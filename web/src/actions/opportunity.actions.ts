'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {requireUser} from './shared';
import db from '@/lib/db';
import {pasteAdapter} from '@/lib/sources/adapters/paste';
import {persistOpportunity,refreshOpportunities} from '@/lib/sources/service';
import {rankOpportunity} from '@/lib/sources/ranking';
import type {Opportunity} from '@/lib/sources/types';

export async function getOpportunityFeed(){
  const user=await requireUser();
  const [items,preferences,runs,skills]=await Promise.all([
    db.opportunity.findMany({where:{userId:user.id},orderBy:{createdAt:'desc'},take:500}),
    db.opportunityPreference.findUnique({where:{userId:user.id}}),
    db.sourceRun.findMany({where:{userId:user.id},orderBy:{startedAt:'desc'},take:100}),
    db.skill.findMany({where:{ResumeSection:{Resume:{profile:{userId:user.id}}}},select:{Tag:{select:{label:true}}}}),
  ]);
  const profile={skills:skills.map(s=>s.Tag.label),minimumBudget:preferences?.minimumBudget??undefined,currency:preferences?.currency??'USD',language:(preferences?.language??'ar') as 'ar'|'en'};
  const now=new Date();
  return {items:items.map(item=>({...item,ranking:rankOpportunity({...item,company:item.company??undefined,budgetMin:item.budgetMin??undefined,budgetMax:item.budgetMax??undefined,currency:item.currency??undefined,bidsCount:item.bidsCount??undefined,country:item.country??undefined} as Opportunity,profile,now)})).sort((a,b)=>b.ranking.score-a.ranking.score||a.canonicalUrl.localeCompare(b.canonicalUrl)),
    preferences:preferences??{minimumBudget:null,currency:'USD',language:'ar',dailyRefresh:false},
    runs:runs.filter((run,index)=>runs.findIndex(r=>r.sourceId===run.sourceId)===index),skillCount:profile.skills.length};
}

export async function refreshFeed(){
  const user=await requireUser();
  try{const refreshed=await refreshOpportunities(user.id);revalidatePath('/dashboard/opportunities');return {ok:refreshed,error:refreshed?null:'busy'};}catch{return {ok:false,error:'failed'};}
}
export async function pasteOpportunity(input:unknown){
  const user=await requireUser();
  const parsed=z.object({url:z.string().max(2048).optional(),text:z.string().max(50000).optional(),jobType:z.enum(['freelance','remote_job']).optional()}).safeParse(input);
  const startedAt=new Date();
  if(!parsed.success)return {ok:false,error:'parser_error'};
  try{
    const [item]=await pasteAdapter.fetch(parsed.data);
    await persistOpportunity(user.id,item);
    await db.sourceRun.create({data:{userId:user.id,sourceId:'paste',status:'ok',itemCount:1,startedAt}});
    revalidatePath('/dashboard/opportunities');return {ok:true,error:null};
  }catch(error){
    const status=error instanceof Error && 'status' in error && error.status==='parser_error'?'parser_error':'failed';
    await db.sourceRun.create({data:{userId:user.id,sourceId:'paste',status,startedAt}});
    revalidatePath('/dashboard/opportunities');return {ok:false,error:status};
  }
}
export async function setOpportunityDisposition(id:string,disposition:'new'|'saved'|'skipped'){
  const user=await requireUser();
  if(typeof id!=='string' || id.length>100 || !['new','saved','skipped'].includes(disposition))throw Error('Invalid disposition');
  const result=await db.opportunity.updateMany({where:{id,userId:user.id},data:{disposition}});
  revalidatePath('/dashboard/opportunities');return {ok:result.count===1,error:result.count?null:'failed'};
}
export async function saveOpportunityPreferences(input:unknown){
  const user=await requireUser();
  const parsed=z.object({minimumBudget:z.number().min(0).max(1e9).nullable(),currency:z.enum(['USD','EUR','EGP','SAR','AED','GBP']),language:z.enum(['ar','en']),dailyRefresh:z.boolean()}).safeParse(input);
  if(!parsed.success)return {ok:false,error:'invalid'};
  await db.opportunityPreference.upsert({where:{userId:user.id},create:{userId:user.id,...parsed.data},update:parsed.data});
  const {syncSchedulerState}=await import('@/lib/scheduler');await syncSchedulerState();
  revalidatePath('/dashboard/opportunities');return {ok:true,error:null};
}
