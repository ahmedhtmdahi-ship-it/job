'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import db from '@/lib/db';
import {requireUser} from './shared';
import {characterCount,MAX_CHARS,PLATFORMS,type Claim} from '@/lib/proposals/core';
import {generateProposal,reviewDraft} from '@/lib/proposals/engine';
import {callProposalModel} from '@/lib/proposals/provider';
import {claimsJson,copyIssues,ensureProposal,loadProposalContext,recordApplication} from '@/lib/proposals/service';

const idSchema = z.string().min(1).max(100);
const refresh = (id:string) => revalidatePath(`/dashboard/opportunities/${id}/proposal`);
export async function getProposalData(opportunityId:string) {
  const user = await requireUser();
  const context = await loadProposalContext(user.id,idSchema.parse(opportunityId));
  const proposal = await ensureProposal(user.id,context);
  const calls = await db.aiCall.findMany({where:{userId:user.id,proposalId:proposal.id},orderBy:{startedAt:'desc'},take:100,select:{id:true,provider:true,feature:true,status:true,inputTokens:true,outputTokens:true,startedAt:true}});
  return {...context,proposal,calls,copyAllowed:copyIssues(proposal,context.input).length===0,stale:!!proposal.profileHash&&proposal.profileHash!==context.profileHash};
}
const operationSchema = z.object({opportunityId:idSchema,version:z.number().int().nonnegative(),draft:z.string().max(6000).optional()});
export async function writeProposal(raw:unknown) {
  const user = await requireUser();
  const parsed = operationSchema.safeParse(raw);
  if(!parsed.success) return {ok:false,error:'failed'};
  const {opportunityId,version,draft} = parsed.data;
  const context = await loadProposalContext(user.id,opportunityId);
  const proposal = await ensureProposal(user.id,context);
  const claimed = await db.proposal.updateMany({where:{id:proposal.id,userId:user.id,version,leaseUntil:{lte:new Date()}},data:{version:{increment:1},reviewStatus:'pending',leaseUntil:new Date(Date.now()+300000)}});
  if(!claimed.count) return {ok:false,error:'busy'};
  const nextVersion = version+1;
  try {
    const call = (request:Parameters<typeof callProposalModel>[2])=>callProposalModel(user.id,proposal.id,request);
    const result = draft===undefined
      ? await generateProposal(context.input,call,proposal.draft || undefined)
      : {draft,suggestedPrice:Math.max(proposal.suggestedPrice,context.input.floor.minimum),...await reviewDraft(context.input,draft,call)};
    if(draft===undefined && characterCount(result.draft)>MAX_CHARS) throw Error('generationFailed');
    const latest = await loadProposalContext(user.id,opportunityId);
    if(latest.profileHash!==context.profileHash) result.unsupported_claims.push({text:'',reason:'stale'});
    const saved = await db.proposal.updateMany({where:{id:proposal.id,userId:user.id,version:nextVersion},data:{draft:result.draft,suggestedPrice:result.suggestedPrice,currency:context.input.floor.currency,language:context.input.opportunity.language,score:context.score,summary:context.summary,risks:context.risks,profileHash:context.profileHash,unsupportedClaims:claimsJson(result.unsupported_claims),reviewStatus:result.unsupported_claims.length?'blocked':'passed'}});
    if(!saved.count) return {ok:false,error:'conflict'};
    return {ok:true,error:null};
  } catch(error) {
    await db.proposal.updateMany({where:{id:proposal.id,userId:user.id,version:nextVersion},data:{reviewStatus:'blocked',unsupportedClaims:claimsJson([{text:'',reason:'unavailable'}])}});
    return {ok:false,error:error instanceof Error && error.message==='providerUnavailable'?'providerUnavailable':'generationFailed'};
  } finally {
    await db.proposal.updateMany({where:{id:proposal.id,userId:user.id,version:nextVersion},data:{leaseUntil:new Date(0)}});
    refresh(opportunityId);
  }
}
export async function copyProposal(opportunityId:string,version:number) {
  const user = await requireUser();
  const context = await loadProposalContext(user.id,idSchema.parse(opportunityId));
  const proposal = await db.proposal.findFirstOrThrow({where:{opportunityId,userId:user.id}});
  if(proposal.version!==version || copyIssues(proposal,context.input).length) return {ok:false,error:'blocked',draft:null};
  return {ok:true,error:null,draft:proposal.draft};
}
export async function setProposalFloor(raw:unknown) {
  const user = await requireUser();
  const parsed = z.object({opportunityId:idSchema,minimum:z.number().finite().min(0).max(1e9),currency:z.enum(['USD','EGP','SAR','AED','EUR','GBP'])}).safeParse(raw);
  if(!parsed.success) return {ok:false,error:'failed'};
  const {opportunityId,minimum,currency} = parsed.data;
  const context = await loadProposalContext(user.id,opportunityId);
  const platform = z.enum(PLATFORMS).parse(context.input.floor.platform);
  await db.proposalPriceFloor.upsert({where:{userId_platform:{userId:user.id,platform}},create:{userId:user.id,platform,minimum,currency},update:{minimum,currency}});
  refresh(opportunityId);
  return {ok:true,error:null};
}
export async function markProposalApplied(opportunityId:string) {
  const user = await requireUser();
  try {
    const result = await recordApplication(user.id,idSchema.parse(opportunityId));
    refresh(opportunityId);revalidatePath('/dashboard');
    return {ok:true,error:null,...result};
  } catch { return {ok:false,error:'failed'}; }
}
export async function skipProposal(opportunityId:string) {
  const user = await requireUser();
  const result = await db.opportunity.updateMany({where:{id:idSchema.parse(opportunityId),userId:user.id},data:{disposition:'skipped'}});
  refresh(opportunityId);revalidatePath('/dashboard/opportunities');
  return {ok:result.count===1,error:result.count?null:'failed'};
}
