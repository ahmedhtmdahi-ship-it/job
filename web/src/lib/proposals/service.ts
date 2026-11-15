import 'server-only';
import db from '@/lib/db';
import type {Prisma} from '@prisma/client';
import {deterministicGate,evidenceSkills,fingerprint,matchedSkills,message,platformOf,words,type Claim,type Language,type ProposalInput} from './core';
import {rankOpportunity} from '@/lib/sources/ranking';
import type {Opportunity as SourceOpportunity} from '@/lib/sources/types';
import {resolveCompany,resolveJobSource,resolveJobTitle} from '@/lib/jobs/resolve';
import {firstStageCreate} from '@/lib/jobs/createJobRecord';

export async function loadProposalContext(userId:string,opportunityId:string) {
  const opportunity = await db.opportunity.findFirst({where:{id:opportunityId,userId}});
  if(!opportunity) throw Error('notFound');
  const platform = platformOf(opportunity.sourceId,opportunity.url);
  const [skillRows,preferences,floorRow] = await Promise.all([
    db.skill.findMany({where:{ResumeSection:{Resume:{profile:{userId}}}},select:{Tag:{select:{label:true}}}}),
    db.opportunityPreference.findUnique({where:{userId}}),
    db.proposalPriceFloor.findUnique({where:{userId_platform:{userId,platform}}}),
  ]);
  const skills = evidenceSkills(skillRows.map(s=>s.Tag.label));
  const language:Language = opportunity.language==='en'?'en':'ar';
  const floor = {platform,minimum:floorRow?.minimum??20,currency:floorRow?.currency??'USD'};
  const input:ProposalInput = {evidence:{skills},opportunity:{title:opportunity.title,description:opportunity.description.slice(0,16000),skills:opportunity.skills,language,currency:opportunity.currency,budgetMin:opportunity.budgetMin,budgetMax:opportunity.budgetMax},floor};
  const profile = {skills,minimumBudget:preferences?.minimumBudget??undefined,currency:preferences?.currency??'USD',language};
  const ranked = rankOpportunity({...opportunity,company:opportunity.company??undefined,budgetMin:opportunity.budgetMin??undefined,budgetMax:opportunity.budgetMax??undefined,currency:opportunity.currency??undefined,bidsCount:opportunity.bidsCount??undefined,country:opportunity.country??undefined} as SourceOpportunity,profile);
  const matched = matchedSkills(input);
  const missing = opportunity.skills.filter(skill=>!matched.includes(skill));
  const text = words(language);
  const risks = [text.scopeRisk];
  if(!skills.length) risks.push(text.noSkills);
  if(missing.length) risks.push(message(language,'missingSkills',{skills:missing.join('، ')}));
  if(opportunity.currency!==floor.currency || opportunity.budgetMax===null) risks.push(text.budgetRisk);
  else if(opportunity.budgetMax<floor.minimum) risks.push(text.belowFloor);
  const summary = message(language,'summaryText',{matched:matched.length,total:opportunity.skills.length});
  return {opportunity,input,score:ranked.score,summary,risks,profileHash:fingerprint(input)};
}
export async function ensureProposal(userId:string,context:Awaited<ReturnType<typeof loadProposalContext>>) {
  return db.proposal.upsert({where:{opportunityId:context.opportunity.id},create:{userId,opportunityId:context.opportunity.id,language:context.input.opportunity.language,platform:context.input.floor.platform,risks:[]},update:{}});
}
export function copyIssues(proposal:{draft:string;reviewStatus:string;profileHash:string;unsupportedClaims:unknown},input:ProposalInput):Claim[] {
  const issues = deterministicGate(proposal.draft,input);
  if(proposal.profileHash!==fingerprint(input)) issues.push({text:'',reason:'stale'});
  if(proposal.reviewStatus!=='passed') issues.push({text:'',reason:'unavailable'});
  const parsed = Array.isArray(proposal.unsupportedClaims)?proposal.unsupportedClaims:[];
  if(parsed.length) issues.push(...parsed as Claim[]);
  return issues;
}
export const claimsJson = (claims:Claim[]) => claims as unknown as Prisma.InputJsonValue;

/** Only an explicit user action writes a tracker entry. The transaction claims the proposal row
 * before creating a Job, so parallel clicks cannot create duplicate applications.
 */
export async function recordApplication(userId:string,opportunityId:string) {
  const context = await loadProposalContext(userId,opportunityId);
  const proposal = await ensureProposal(userId,context);
  if(proposal.appliedAt) return {jobId:proposal.jobId,appliedAt:proposal.appliedAt};
  const o = context.opportunity;
  const [title,company,source,status] = await Promise.all([
    resolveJobTitle(o.title,userId),
    resolveCompany(o.company || words(context.input.opportunity.language).unknownCompany,userId),
    resolveJobSource(context.input.floor.platform,userId),
    db.jobStatus.findUniqueOrThrow({where:{value:'applied'}}),
  ]);
  const now = new Date();
  const stages = await firstStageCreate(status.id,userId,now);
  return db.$transaction(async tx=>{
    const claimed = await tx.proposal.updateMany({where:{id:proposal.id,userId,appliedAt:null},data:{appliedAt:now}});
    if(!claimed.count) {
      const existing = await tx.proposal.findFirstOrThrow({where:{id:proposal.id,userId}});
      return {jobId:existing.jobId,appliedAt:existing.appliedAt};
    }
    const job = await tx.job.create({data:{userId,jobTitleId:title.id,companyId:company.id,jobSourceId:source.id,statusId:status.id,jobUrl:o.url,description:o.description,jobType:o.jobType==='freelance'?'C':'',workplaceType:o.jobType==='remote_job'?'REMOTE':null,createdAt:now,applied:true,appliedDate:now,createdVia:'proposal',stages}});
    await tx.proposal.update({where:{id:proposal.id},data:{jobId:job.id}});
    return {jobId:job.id,appliedAt:now};
  });
}
