import db from '@/lib/db';
import {apiSources} from './index';
import {runSource} from './http';
import {canonicalUrl} from './canonical';
import type {Opportunity,SourceAdapter,SourceStatus} from './types';
import type {Prisma} from '@prisma/client';
const intervals:Record<string,number>={freelancer:3600000,remotive:21600000,jobicy:3600000,remoteok:86400000,arbeitnow:3600000};

export async function persistOpportunity(userId:string,item:Opportunity) {
  const canonical=item.url?canonicalUrl(item.url):`text:${item.externalId}`;
  // Tenant-scoped uniqueness avoids leaking user-pasted content between accounts.
  const data={...item,canonicalUrl:canonical,userId};
  return db.opportunity.upsert({where:{userId_canonicalUrl:{userId,canonicalUrl:canonical}},create:data,
    // Preserve the original source and the owner's saved/skipped choice on refresh.
    update:{title:item.title,description:item.description,skills:item.skills,postedAt:item.postedAt,budgetMin:item.budgetMin,budgetMax:item.budgetMax,currency:item.currency,bidsCount:item.bidsCount}});
}

async function cachedSource(source:SourceAdapter) {
  if(source.id==='remotive')return {items:[] as Opportunity[],status:'blocked' as SourceStatus,cached:false,reason:'terms'};
  const now=new Date();
  const cache=await db.sourceCache.upsert({where:{sourceId:source.id},create:{sourceId:source.id},update:{}});
  const lease=await db.sourceCache.updateMany({where:{sourceId:source.id,nextFetchAt:{lte:now}},data:{nextFetchAt:new Date(now.getTime()+intervals[source.id])}});
  if(!lease.count){
    const items=Array.isArray(cache.payload)?(cache.payload as unknown as Opportunity[]).map(item=>({...item,postedAt:item.postedAt?new Date(item.postedAt):null})):[];
    return {items,status:cache.status as SourceStatus,cached:true,reason:cache.fetchedAt?'cached':'cooldown'};
  }
  const run=await runSource(source,{});
  await db.sourceCache.update({where:{sourceId:source.id},data:{status:run.status,fetchedAt:new Date(),
    ...('retryAt' in run && run.retryAt ? {nextFetchAt:new Date(Math.max(now.getTime()+intervals[source.id],run.retryAt.getTime()))}:{}),
    ...(run.status==='ok'?{payload:JSON.parse(JSON.stringify(run.items)) as Prisma.InputJsonValue}:{}),
  }});
  return {items:run.items,status:run.status,cached:false,reason:run.status==='ok'?null:'source_error'};
}

export async function refreshOpportunities(userId:string) {
  const now=new Date();
  await db.opportunityPreference.upsert({where:{userId},create:{userId},update:{}});
  const lease=await db.opportunityPreference.updateMany({where:{userId,refreshLeaseUntil:{lte:now}},data:{refreshLeaseUntil:new Date(now.getTime()+120000)}});
  if(!lease.count)return false;
  try {
    await Promise.all(apiSources.map(async source=>{
      const startedAt=new Date();
      try {
        const result=await cachedSource(source);
        // Failed refreshes leave previously imported opportunities intact.
        if(result.status==='ok')for(const item of result.items.slice(0,500))await persistOpportunity(userId,item);
        await db.sourceRun.create({data:{userId,sourceId:source.id,status:result.status,reason:result.reason,startedAt,itemCount:result.status==='ok'?result.items.length:0,cached:result.cached}});
      }catch{
        await db.sourceRun.create({data:{userId,sourceId:source.id,status:'failed',reason:'storage_or_source',startedAt}});
      }
    }));
    await db.opportunityPreference.update({where:{userId},data:{nextRefreshAt:new Date(Date.now()+86400000)}});
    return true;
  }finally{await db.opportunityPreference.update({where:{userId},data:{refreshLeaseUntil:new Date(0)}});}
}

export async function refreshDueOpportunityFeeds(){
  const due=await db.opportunityPreference.findMany({where:{dailyRefresh:true,nextRefreshAt:{lte:new Date()},refreshLeaseUntil:{lte:new Date()}},select:{userId:true},take:50});
  for(const user of due) await refreshOpportunities(user.userId).catch(()=>undefined);
}
