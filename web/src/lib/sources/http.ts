import {SourceError, type SourceAdapter, type SourceQuery, type Opportunity} from './types';
export const USER_AGENT='AwelShoghlana/1.0 (+https://github.com/ahmedhtmdahi-ship-it/job; public opportunity feed)';
/** Shared by adapter instances. A caller cannot evade cooldown by changing query. */
const nextAllowed = new Map<string,number>();
export function publicApi(id:string,name:string,endpoint:string,intervalMs:number,parse:(data:unknown)=>Opportunity[]):SourceAdapter {
  return {id,name,kind:'api',async fetch(_query:SourceQuery){
    const now=Date.now();
    if(now<(nextAllowed.get(id)??0))throw new SourceError('blocked','Source cooldown');
    nextAllowed.set(id,now+intervalMs);
    let response:Response;
    try {response=await fetch(endpoint,{headers:{'User-Agent':USER_AGENT,Accept:'application/json'},signal:AbortSignal.timeout(15000),redirect:'error'});}
    catch {throw new SourceError('failed','Source request failed');}
    if([401,403,429].includes(response.status)) {
      const retry=response.headers.get('retry-after');
      const until=retry && /^\d+$/.test(retry)?now+Number(retry)*1000:retry?Date.parse(retry):NaN;
      if(Number.isFinite(until))nextAllowed.set(id,Math.max(nextAllowed.get(id)!,until));
      throw new SourceError('blocked','Source access restricted',new Date(nextAllowed.get(id)!));
    }
    if(!response.ok)throw new SourceError('failed','Source response failed');
    try{return parse(await response.json());}catch{throw new SourceError('parser_error','Source response format changed');}
  }};
}
export async function runSource(source:SourceAdapter,query:SourceQuery){
  const startedAt=new Date();
  try{const items=await source.fetch(query);return {sourceId:source.id,status:'ok' as const,startedAt,itemCount:items.length,items};}
  catch(error){return {sourceId:source.id,retryAt:error instanceof SourceError?error.retryAt:undefined,status:error instanceof SourceError?error.status:'failed' as const,startedAt,itemCount:0,items:[]};}
}
