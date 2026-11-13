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
const untranslated = [];
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
  const brand = locale === 'ar' ? 'أول شغلانة' : 'Awel Shoghlana';
  await expect(page.locator('h1').filter({hasText:brand}).first()).toContainText(brand);
  await expect(page).toHaveTitle(new RegExp(brand));
  if (locale === 'ar') {
    const placeholders = await page.locator('input[placeholder]:visible, textarea[placeholder]:visible').evaluateAll(nodes => nodes.map(n => n.getAttribute('placeholder')).join('\n'));
    const visible = (await page.locator('body').innerText()) + '\n' + placeholders;
    expect(visible, `Latin digits and spaced units on ${url}`).not.toMatch(/[٠-٩۰-۹]|[0-9](?:ساعة|يوم|أيام|دقيقة|وظائف)/);
    const cleaned = visible
      // Only the explicitly requested upstream attribution is exempted.
      .replace(ar.ui.m8bb483f7be15, '')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\b(?:JobSync|Google|Gemini|Ollama|PDF|CSV|URL)\b/g, '');
    const leaked = cleaned.split('\n').filter(line => /[A-Za-z]{2,}/.test(line));
    if (leaked.length) untranslated.push(`English UI on ${url}: ${leaked.join(' | ')}`);
  }
  pageChecks++;
  console.log(`CHECKED ${locale} ${url}`);
}

async function verifyChartPolish(page, locale) {
  const chart = page.getByTestId('weekly-chart');
  const today = new Date();
  const dates = [6, 0].map(days => {const d = new Date(today);d.setDate(d.getDate()-days);return d;});
  const labels = dates.map(d => locale === 'ar'
    ? new Intl.DateTimeFormat('ar', {numberingSystem:'latn',weekday:'long',day:'numeric',month:'long'}).format(d).replace(/،/g,'')
    : new Intl.DateTimeFormat('en-US', {weekday:'short',month:'short',day:'numeric'}).format(d));
  const points = [];
  for (const label of labels) {
    const tick = chart.locator('svg text').filter({hasText:new RegExp(`^${label}$`)});
    await expect(tick).toBeVisible();
    points.push(await tick.boundingBox());
  }
  expect(locale === 'ar' ? points[0].x > points[1].x : points[0].x < points[1].x).toBe(true);
  const calendar = page.getByTestId('activity-calendar-chart');
  const months = [0,11].map(month => new Intl.DateTimeFormat(locale,{month:'short'}).format(new Date(2020,month,1)));
  const monthPoints = [];
  for(const label of months) {
    const tick = calendar.locator('svg text').filter({hasText:new RegExp(`^${label}$`)});
    await expect(tick).toBeVisible();
    monthPoints.push(await tick.boundingBox());
    if(locale === 'ar') await expect(tick).toHaveAttribute('transform', /scale\(-1,1\)$/);
  }
  expect(locale === 'ar' ? monthPoints[0].x > monthPoints[1].x : monthPoints[0].x < monthPoints[1].x).toBe(true);
  if(locale === 'ar') {
    await expect(page.getByText('الهدف',{exact:true})).toBeVisible();
  }
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
    await page.locator('form').getByRole('button',{name:label('Create an account'),exact:true}).click();
    await expect(page).toHaveURL(`${base}/dashboard`);
    const user = await db.user.findUniqueOrThrow({where:{email}});
    expect(user.locale).toBe('ar');
    await expect(page.getByTestId('jobs-activity-total')).toContainText('0 ساعة');
    // Fictional completed activity makes the heatmap and donut reviewable.
    const demoType = await db.activityType.create({data:{createdBy:user.id,label:'نشاط وهمي',value:'fictional-ci-activity'}});
    const demoEnd = new Date();
    await db.activity.create({data:{userId:user.id,activityTypeId:demoType.id,activityName:'تعلّم تجريبي وهمي',startTime:new Date(demoEnd.getTime()-3600000),endTime:demoEnd,duration:60}});
    const profile = await db.profile.create({data:{userId:user.id}});
    const resume = await db.resume.create({data:{profileId:profile.id,title:'سيرة تجريبية وهمية'}});
    const routes=[...pages,`/dashboard/profile/resume/${resume.id}`];
    for (const route of routes) {
      await page.goto(base+route);await verify(page,'ar',route);
      if (route === '/dashboard') await verifyChartPolish(page, 'ar');
      if (route === '/dashboard/settings') await expect(page.getByTestId('upstream-credit')).toHaveText(ar.ui.m8bb483f7be15);
      const file = {'/dashboard':'dashboard-ar.png','/dashboard/myjobs':'jobs-ar.png','/dashboard/settings':'settings-ar.png'}[route];
      if(file)await page.screenshot({path:path.join(output,file),fullPage:true,animations:'disabled'});
    }
    // Exercise the main creation dialogs and each settings section in RTL.
    for (const [route, button] of [
      ['/dashboard/admin?tab=companies','New Company'],
      ['/dashboard/admin?tab=contacts','New Contact'],
      ['/dashboard/activities','New Activity'],
      ['/dashboard/tasks','New Task'],
      ['/dashboard/profile','Add New Resume'],
    ]) {
      await page.goto(base+route);
      if (route === '/dashboard/profile') {
        await page.getByRole('button',{name:label('New'),exact:true}).click();
        await page.getByRole('menuitem',{name:label(button),exact:true}).click();
      } else {
        await page.getByRole('button',{name:label(button),exact:true}).click();
      }
      await expect(page.getByRole('dialog')).toBeVisible();
      await verify(page,'ar',`${route} creation dialog`);
    }
    // Regression: field names remain machine identifiers while labels are Arabic.
    await page.goto(`${base}/dashboard/tasks`);
    await page.getByRole('button',{name:label('New Task'),exact:true}).click();
    await page.getByRole('dialog').locator('input[name="title"]').fill('مهمة تجريبية وهمية');
    const activityPicker = page.getByRole('combobox',{name:label('Activity Type'),exact:true});
    await activityPicker.click();
    const activitySearch = page.locator('[cmdk-input]');
    await activitySearch.fill('نشاط تجريبي وهمي');
    await activitySearch.press('Enter');
    await expect(activityPicker).toContainText('نشاط تجريبي وهمي');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByRole('dialog')).toBeHidden();
    const savedTask = await db.task.findFirstOrThrow({where:{userId:user.id,title:'مهمة تجريبية وهمية'},include:{activityType:true}});
    expect(savedTask.activityType?.label).toBe('نشاط تجريبي وهمي');
    expect(savedTask.status).toBe('in-progress');
    await verify(page,'ar','saved Arabic task');
    await page.goto(`${base}/dashboard/settings`);
    for(const section of ['AI Provider','AI Usage','API Keys','Appearance','MCP Access','Data']) {
      await page.getByRole('button',{name:label(section),exact:true}).click();
      await verify(page,'ar',`settings: ${section}`);
    }
    await page.goto(`${base}/dashboard/myjobs?add-job=true`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await verify(page,'ar','job form dialog');
    await expect(page.getByRole('dialog')).toContainText('باقي 4 حقول مطلوبة:');
    await page.screenshot({path:path.join(output,'job-form-ar.png'),fullPage:true,animations:'disabled'});
    await page.goto(`${base}/dashboard`);
    await page.getByRole('button',{name:label('User menu'),exact:true}).click();
    await page.getByRole('menuitem',{name:ar.locale.switch,exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('lang','en');
    expect((await db.user.findUniqueOrThrow({where:{email}})).locale).toBe('en');
    for(const route of routes) {await page.goto(base+route);await verify(page,'en',route);if(route === '/dashboard')await verifyChartPolish(page,'en');}
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
    if (untranslated.length) throw new Error(untranslated.join("\n"));
    console.log(`::notice title=M1.1 acceptance passed::${pageChecks} locale/page checks; Arabic task/type creation; saved language across sessions; five screenshots`);
  } finally {await db.$disconnect();await browser.close();}
}
main().catch(error=>{
  const message=String(error.stack||error).replaceAll(password,'[REDACTED]');
  console.error(`::error title=M1.1 acceptance failed::${message.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A')}`);
  process.exitCode=1;
});
