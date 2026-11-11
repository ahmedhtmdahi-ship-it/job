// CI acceptance against our disposable local application only.
const {createRequire} = require('node:module');
const {randomBytes} = require('node:crypto');
const {mkdir} = require('node:fs/promises');
const path = require('node:path');
const requireWeb = createRequire(path.resolve(__dirname, '../../web/package.json'));
const {chromium, expect} = requireWeb('@playwright/test');
const {PrismaClient} = requireWeb('@prisma/client');
const en = require('../../web/messages/en.json');
const ar = require('../../web/messages/ar.json');
const keys = Object.fromEntries(Object.entries(en.ui).map(([k,v]) => [v,k]));
const label = (text, locale='ar') => (locale === 'ar' ? ar : en).ui[keys[text]];
const base = 'http://localhost:3737';
const output = path.join(process.env.RUNNER_TEMP, 'm1-screenshots');
const email = 'demo@example.com';
const password = randomBytes(32).toString('hex');
let pageChecks = 0;
const pages = [
  '/dashboard', '/dashboard/myjobs', '/dashboard/admin?tab=companies',
  '/dashboard/admin?tab=contacts', '/dashboard/activities', '/dashboard/tasks',
  '/dashboard/interviews', '/dashboard/profile', '/dashboard/settings',
  '/dashboard/automations', '/dashboard/questions', '/dashboard/notifications',
];
async function verify(page, locale, url) {
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
  await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  await page.waitForLoadState('networkidle');
  if (locale === 'ar') {
    const placeholders = await page.locator('input[placeholder]:visible, textarea[placeholder]:visible').evaluateAll(nodes => nodes.map(n => n.getAttribute('placeholder')).join('\n'));
    const visible = (await page.locator('body').innerText()) + '\n' + placeholders;
    const cleaned = visible
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\b(?:JobSync|Google|Gemini|Ollama|PDF|CSV|URL)\b/g, '');
    const leaked = cleaned.split('\n').filter(line => /[A-Za-z]{2,}/.test(line));
    if (leaked.length) throw new Error(`English UI on ${url}: ${leaked.join(' | ')}`);
  }
  pageChecks++;
  console.log(`PASS ${locale} ${url}`);
}
async function signIn(page, locale='ar') {
  await page.goto(`${base}/signin`);
  await page.getByLabel(label('Email', locale), {exact:true}).fill(email);
  await page.getByLabel(label('Password', locale), {exact:true}).fill(password);
  await page.getByRole('button', {name:label('Login', locale), exact:true}).click();
  await expect(page).toHaveURL(`${base}/dashboard`);
}
async function main() {
  console.log(`::add-mask::${password}`);
  await mkdir(output, {recursive:true});
  let ready = false;
  for (let i=0;i<90;i++) {
    try { if ((await fetch(`${base}/signin`, {signal:AbortSignal.timeout(3000)})).ok) {ready=true;break;} } catch {}
    await new Promise(r=>setTimeout(r,1000));
  }
  if (!ready) throw new Error('Production server did not become ready');
  const browser = await chromium.launch();
  const db = new PrismaClient();
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1080}});
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    for (const route of ['/signin','/signup']) {
      await page.goto(base+route);await verify(page,'ar',route);
    }
    await page.getByLabel(label('Full Name'), {exact:true}).fill('مستخدم تجريبي وهمي');
    await page.getByLabel(label('Email'), {exact:true}).fill(email);
    await page.getByLabel(label('Password'), {exact:true}).fill(password);
    await page.getByRole('button',{name:label('Create an account'),exact:true}).click();
    await expect(page).toHaveURL(`${base}/dashboard`);
    const user = await db.user.findUniqueOrThrow({where:{email}});
    expect(user.locale).toBe('ar');
    const profile = await db.profile.create({data:{userId:user.id}});
    const resume = await db.resume.create({data:{profileId:profile.id,title:'سيرة تجريبية وهمية'}});
    const routes=[...pages,`/dashboard/profile/resume/${resume.id}`];
    for (const route of routes) {
      await page.goto(base+route);await verify(page,'ar',route);
      const file = {'/dashboard':'dashboard-ar.png','/dashboard/myjobs':'jobs-ar.png','/dashboard/settings':'settings-ar.png'}[route];
      if(file)await page.screenshot({path:path.join(output,file),fullPage:true,animations:'disabled'});
    }
    await page.goto(`${base}/dashboard/myjobs?add-job=true`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await verify(page,'ar','job form dialog');
    await page.screenshot({path:path.join(output,'job-form-ar.png'),fullPage:true,animations:'disabled'});
    await page.goto(`${base}/dashboard`);
    await page.getByRole('button',{name:label('User menu'),exact:true}).click();
    await page.getByRole('menuitem',{name:ar.locale.switch,exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('lang','en');
    expect((await db.user.findUniqueOrThrow({where:{email}})).locale).toBe('en');
    for(const route of routes) {await page.goto(base+route);await verify(page,'en',route);}
    await page.goto(`${base}/dashboard/myjobs?add-job=true`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await verify(page,'en','job form dialog');
    await page.goto(`${base}/dashboard`);
    await page.screenshot({path:path.join(output,'dashboard-en.png'),fullPage:true,animations:'disabled'});
    // No locale cookie: authenticated preference must win on a fresh device.
    const fresh = await browser.newContext({viewport:{width:1440,height:1080}});
    const freshPage = await fresh.newPage();
    await signIn(freshPage);
    await verify(freshPage,'en','persisted user preference on fresh session');
    await fresh.close();
    // Explicit visitor preference supports both unauthenticated pages in English.
    const visitor=await browser.newContext();
    await visitor.addCookies([{name:'locale',value:'en',url:base}]);
    const visitorPage=await visitor.newPage();
    for(const route of ['/signin','/signup']) {await visitorPage.goto(base+route);await verify(visitorPage,'en',route);}
    await visitor.close();await context.close();
    console.log(`::notice title=M1 acceptance passed::${pageChecks} locale/page checks; saved language across sessions; five screenshots`);
  } finally {await db.$disconnect();await browser.close();}
}
main().catch(error=>{
  const message=String(error.stack||error).replaceAll(password,'[REDACTED]');
  console.error(`::error title=M1 acceptance failed::${message.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A')}`);
  process.exitCode=1;
});
