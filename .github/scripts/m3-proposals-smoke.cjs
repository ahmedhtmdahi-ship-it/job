const {createRequire}=require('node:module');
const {randomBytes}=require('node:crypto');
const path=require('node:path');const fs=require('node:fs/promises');
const req=createRequire(path.resolve(__dirname,'../../web/package.json'));
const {chromium,expect}=req('@playwright/test');const {PrismaClient}=req('@prisma/client');
const ar=require('../../web/messages/ar.json'),en=require('../../web/messages/en.json');
const t=ar.proposals,ui=text=>ar.ui[Object.entries(en.ui).find(([,value])=>value===text)?.[0]];
const base='http://localhost:3737',output=path.join(process.env.RUNNER_TEMP,'m3-screenshots');
const email='m3-demo@example.com',password=randomBytes(32).toString('hex');
async function main(){
 console.log(`::add-mask::${password}`);await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch();const db=new PrismaClient();
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1080},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  await page.goto(base+'/signup');await page.getByLabel(ui('Full Name'),{exact:true}).fill('مستخدم تقديم وهمي');await page.getByLabel(ui('Email'),{exact:true}).fill(email);await page.getByLabel(ui('Password'),{exact:true}).fill(password);await page.locator('form').getByRole('button',{name:ui('Create an account'),exact:true}).click();await expect(page).toHaveURL(base+'/dashboard');
  const user=await db.user.findUniqueOrThrow({where:{email}});
  const profile=await db.profile.create({data:{userId:user.id}});const resume=await db.resume.create({data:{profileId:profile.id,title:'سيرة تقديم وهمية'}});const section=await db.resumeSection.create({data:{resumeId:resume.id,sectionTitle:'مهارات وهمية',sectionType:'skills'}});const tag=await db.tag.create({data:{createdBy:user.id,label:'تصميم',value:'m3-fictional-design'}});const skill=await db.skill.create({data:{resumeSectionId:section.id,tagId:tag.id}});
  const opportunity=await db.opportunity.create({data:{userId:user.id,sourceId:'paste',externalId:'m3-fictional',canonicalUrl:'https://mostaql.com/m3-fictional',url:'https://mostaql.com/m3-fictional',title:'تصميم واجهة عربية تجريبية',description:'إعلان وهمي يطلب التصميم والبرمجة. لا يمثل فرصة حقيقية.',skills:['تصميم','برمجة'],jobType:'freelance',language:'ar',currency:'USD',budgetMin:50,budgetMax:150}});
  const route=base+`/dashboard/opportunities/${opportunity.id}/proposal`;
  await page.goto(route);await expect(page.locator('html')).toHaveAttribute('dir','rtl');await expect(page.locator('html')).toHaveAttribute('lang','ar');
  const copy=page.getByRole('button',{name:t.copy,exact:true});await expect(copy).toBeDisabled();
  await page.getByRole('button',{name:t.generate,exact:true}).click();await expect(copy).toBeEnabled();
  let proposal=await db.proposal.findUniqueOrThrow({where:{opportunityId:opportunity.id}});
  expect(proposal.reviewStatus).toBe('passed');expect(proposal.draft).toContain('تصميم');expect(proposal.draft).not.toContain('برمجة');expect(Array.from(proposal.draft).length).toBeLessThanOrEqual(1200);
  const calls=await db.aiCall.findMany({where:{proposalId:proposal.id}});expect(calls.map(call=>call.feature).sort()).toEqual(['proposal_draft','proposal_review']);for(const call of calls){expect(call.inputTokens).toBe(101);expect(call.outputTokens).toBe(37);}
  const body=(await page.getByTestId('proposal-page').innerText()).replace(/Gemini|Ollama|USD|EGP|SAR|AED|EUR|GBP/g,'');expect(body).not.toMatch(/[A-Za-z]{2,}|[٠-٩]/);
  await page.screenshot({path:path.join(output,'proposal-ar.png'),fullPage:true,animations:'disabled'});
  await copy.click();await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toBe(proposal.draft);
  const safeDraft=proposal.draft;
  await page.getByTestId('proposal-draft').fill(safeDraft+'\nأتقن البرمجة ولدي خبرة 10 سنوات مع شركة وهمية.');await expect(copy).toBeDisabled();
  await page.getByRole('button',{name:t.review,exact:true}).click();await expect(page.getByTestId('honesty-gate')).toContainText(t.rule);await expect(copy).toBeDisabled();
  proposal=await db.proposal.findUniqueOrThrow({where:{opportunityId:opportunity.id}});expect(proposal.reviewStatus).toBe('blocked');expect(proposal.unsupportedClaims.length).toBeGreaterThan(0);
  await page.screenshot({path:path.join(output,'honesty-blocked-ar.png'),fullPage:true,animations:'disabled'});
  await page.getByTestId('proposal-draft').fill(safeDraft);await page.getByRole('button',{name:t.review,exact:true}).click();await expect(copy).toBeEnabled();
  await page.getByTestId('price-settings').locator('summary').click();await page.getByLabel(t.floor,{exact:true}).fill('200');await page.getByRole('button',{name:t.saveFloor,exact:true}).click();await expect(page.getByTestId('honesty-gate')).toContainText(t.stale);await expect(copy).toBeDisabled();
  await page.getByRole('button',{name:t.rewrite,exact:true}).click();await expect(copy).toBeEnabled();proposal=await db.proposal.findUniqueOrThrow({where:{opportunityId:opportunity.id}});expect(proposal.suggestedPrice).toBe(200);expect(proposal.draft).not.toBe(safeDraft);
  // Removing profile evidence invalidates approval. No model can substitute missing credentials.
  await db.skill.delete({where:{id:skill.id}});await page.reload();await expect(copy).toBeDisabled();await expect(page.getByTestId('honesty-gate')).toContainText(t.stale);
  await page.getByRole('button',{name:t.rewrite,exact:true}).click();await expect(copy).toBeEnabled();proposal=await db.proposal.findUniqueOrThrow({where:{opportunityId:opportunity.id}});expect(proposal.draft).not.toContain('تصميم');
  await page.getByRole('button',{name:t.apply,exact:true}).click();await expect(page.getByRole('button',{name:t.applied,exact:true})).toBeDisabled();
  proposal=await db.proposal.findUniqueOrThrow({where:{opportunityId:opportunity.id}});expect(proposal.appliedAt).toBeTruthy();const job=await db.job.findUniqueOrThrow({where:{id:proposal.jobId},include:{stages:true}});expect(job.userId).toBe(user.id);expect(job.applied).toBe(true);expect(job.appliedDate.getTime()).toBe(proposal.appliedAt.getTime());expect(job.stages).toHaveLength(1);
  await page.reload();await expect(page.getByRole('button',{name:t.applied,exact:true})).toBeDisabled();expect(await db.job.count({where:{userId:user.id,createdVia:'proposal'}})).toBe(1);
  await page.screenshot({path:path.join(output,'applied-ar.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('link',{name:t.tracker,exact:true}).click();await expect(page).toHaveURL(base+`/dashboard/myjobs/${job.id}`);
  await page.goto(route);await page.getByRole('button',{name:t.skip,exact:true}).click();await expect(page.getByRole('button',{name:t.skip,exact:true})).toBeDisabled();expect((await db.opportunity.findUniqueOrThrow({where:{id:opportunity.id}})).disposition).toBe('skipped');
  // An English advertisement produces an English draft even with an Arabic UI.
  const english=await db.opportunity.create({data:{userId:user.id,sourceId:'paste',externalId:'m3-en',canonicalUrl:'text:m3-en',title:'Fictional English opportunity',description:'Fictional English opportunity',skills:['Python'],jobType:'remote_job',language:'en'}});
  await page.goto(base+`/dashboard/opportunities/${english.id}/proposal`);await page.getByRole('button',{name:t.generate,exact:true}).click();await expect(copy).toBeEnabled();await expect(page.getByTestId('proposal-draft')).toHaveAttribute('lang','en');await expect(page.getByTestId('proposal-draft')).toHaveAttribute('dir','ltr');expect(await page.getByTestId('proposal-draft').inputValue()).toContain('Hello');
  // Cross-user private opportunity URL returns not-found and exposes no draft.
  const other=await db.user.findUniqueOrThrow({where:{email:'m2-demo@example.com'}});const privateItem=await db.opportunity.findFirstOrThrow({where:{userId:other.id}});await page.goto(base+`/dashboard/opportunities/${privateItem.id}/proposal`);await expect(page.getByTestId('proposal-page')).toHaveCount(0);
  console.log('::notice title=M3 acceptance passed::Arabic RTL proposal, blocked unsupported skill/experience despite permissive mock review, corrected copy, profile invalidation, per-platform floor, independent token rows, explicit idempotent tracker entry, English advertisement language, private owner boundary; three fictional screenshots');
  await context.close();
 }finally{await db.$disconnect();await browser.close();}
}
main().catch(error=>{console.error('::error title=M3 acceptance failed::'+String(error.stack||error).replaceAll(password,'[REDACTED]').replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));process.exitCode=1;});
