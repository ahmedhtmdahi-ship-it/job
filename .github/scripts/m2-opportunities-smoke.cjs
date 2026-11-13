const {createRequire}=require('node:module');const {randomBytes}=require('node:crypto');const fs=require('node:fs/promises');const path=require('node:path');
const req=createRequire(path.resolve(__dirname,'../../web/package.json'));const {chromium,expect}=req('@playwright/test');const {PrismaClient}=req('@prisma/client');
const ar=require('../../web/messages/ar.json'),en=require('../../web/messages/en.json');const base='http://localhost:3737';const output=path.join(process.env.RUNNER_TEMP,'m2-screenshots');
const email='m2-demo@example.com',password=randomBytes(32).toString('hex');
const ui=(text)=>ar.ui[Object.entries(en.ui).find(([,v])=>v===text)?.[0]];
async function verify(page,locale){
 await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('html')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
 const root=page.getByTestId('opportunities-page');await expect(root).toBeVisible();
 if(locale==='ar'){
  const text=(await root.innerText()).replace(/Freelancer|Remotive|Jobicy|Remote OK|Arbeitnow|USD|EUR|EGP|SAR|AED|GBP/g,'');
  expect(text).not.toMatch(/[A-Za-z]{2,}|[٠-٩]/);
 }
}
async function main(){console.log(`::add-mask::${password}`);await fs.mkdir(output,{recursive:true});const browser=await chromium.launch();const db=new PrismaClient();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1080}});const page=await context.newPage();page.setDefaultTimeout(30000);
  await page.goto(base+'/signup');await page.getByLabel(ui('Full Name'),{exact:true}).fill('مستخدم فرص تجريبي');await page.getByLabel(ui('Email'),{exact:true}).fill(email);await page.getByLabel(ui('Password'),{exact:true}).fill(password);await page.locator('form').getByRole('button',{name:ui('Create an account'),exact:true}).click();await expect(page).toHaveURL(base+'/dashboard');
  const user=await db.user.findUniqueOrThrow({where:{email}});
  const profile=await db.profile.create({data:{userId:user.id}});const resume=await db.resume.create({data:{profileId:profile.id,title:'سيرة وهمية للفرص'}});const section=await db.resumeSection.create({data:{resumeId:resume.id,sectionTitle:'مهارات تجريبية',sectionType:'skills'}});const tag=await db.tag.create({data:{createdBy:user.id,label:'تصميم',value:'fictional-design'}});await db.skill.create({data:{resumeSectionId:section.id,tagId:tag.id}});
  await page.goto(base+'/dashboard/opportunities');await verify(page,'ar');
  await page.getByRole('button',{name:ar.opportunities.refresh,exact:true}).click();await expect(page.locator('[data-source="freelancer"]')).toContainText(ar.opportunities.ok);
  await expect(page.locator('[data-source="remotive"]')).toContainText(ar.opportunities.blocked);await expect(page.locator('[data-source="remoteok"]')).toContainText(ar.opportunities.failed);await expect(page.getByTestId('opportunity-card').first()).toBeVisible();await verify(page,'ar');
  await page.screenshot({path:path.join(output,'feed-ar.png'),fullPage:true,animations:'disabled'});await page.getByTestId('sources-status').screenshot({path:path.join(output,'sources-ar.png'),animations:'disabled'});
  await page.getByRole('button',{name:ar.opportunities.paste,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
  const pastedUrl='https://mostaql.com/fictional-m2-project?utm_source=demo';
  await page.getByLabel(ar.opportunities.url,{exact:true}).fill(pastedUrl);await page.getByLabel(ar.opportunities.text,{exact:true}).fill('فرصة كتابة تجريبية خاصة\nالمهارات: تصميم\nالميزانية: USD 500-900');
  await page.screenshot({path:path.join(output,'paste-ar.png'),fullPage:true,animations:'disabled'});await page.getByRole('button',{name:ar.opportunities.create,exact:true}).click();await expect(page.getByRole('dialog')).toBeHidden();await expect(page.getByRole('heading',{name:'فرصة كتابة تجريبية خاصة',exact:true})).toBeVisible();
  // Duplicate canonical URL updates the same row, not a new opportunity.
  await page.getByRole('button',{name:ar.opportunities.paste,exact:true}).click();await page.getByLabel(ar.opportunities.url,{exact:true}).fill('https://mostaql.com/fictional-m2-project');await page.getByLabel(ar.opportunities.text,{exact:true}).fill('فرصة كتابة تجريبية خاصة');await page.getByRole('button',{name:ar.opportunities.create,exact:true}).click();await expect(page.getByRole('dialog')).toBeHidden();expect(await db.opportunity.count({where:{userId:user.id,sourceId:'paste'}})).toBe(1);
  const card=page.getByTestId('opportunity-card').filter({has:page.getByRole('heading',{name:'فرصة كتابة تجريبية خاصة',exact:true})});await card.getByRole('button',{name:ar.opportunities.save,exact:true}).click();await expect(card).toHaveCount(0);expect((await db.opportunity.findFirstOrThrow({where:{userId:user.id,sourceId:'paste'}})).disposition).toBe('saved');
  // Other accounts must never see the private paste.
  const other=await db.user.findUniqueOrThrow({where:{email:'demo@example.com'}});expect(await db.opportunity.count({where:{userId:other.id,sourceId:'paste'}})).toBe(0);
  await page.getByRole('button',{name:ui('User menu'),exact:true}).click();await page.getByRole('menuitem',{name:ar.locale.switch,exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','en');await page.goto(base+'/dashboard/opportunities');await verify(page,'en');await page.screenshot({path:path.join(output,'feed-en.png'),fullPage:true,animations:'disabled'});
  await context.close();console.log('::notice title=M2 acceptance passed::Arabic/English feed; paste and canonical dedupe; private saved state; blocked and failed sources isolated; four fictional screenshots');
 }finally{await db.$disconnect();await browser.close();}}
main().catch(error=>{const message=String(error.stack||error).replaceAll(password,'[REDACTED]');console.error('::error title=M2 acceptance failed::'+message.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));process.exitCode=1;});
