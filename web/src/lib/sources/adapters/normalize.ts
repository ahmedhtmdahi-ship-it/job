import {canonicalUrl} from '../canonical';
import type {Opportunity} from '../types';
export function object(value:unknown):Record<string,any>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Expected object');return value as Record<string,any>;}
export function list(value:unknown):unknown[]{if(!Array.isArray(value))throw Error('Expected list');return value;}
export function normalized(sourceId:string,row:Record<string,any>):Opportunity{
  if(typeof row.title!=='string'||!row.title.trim()||typeof row.description!=='string')throw Error('Invalid content');
  const postedAt=row.postedAt===undefined||row.postedAt===null?null:new Date(row.postedAt);
  if(postedAt&&!Number.isFinite(postedAt.getTime()))throw Error('Invalid date');
  const numeric=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:undefined;
  return {sourceId,externalId:String(row.id),url:canonicalUrl(row.url),title:row.title,description:row.description,
    company:typeof row.company==='string'?row.company:undefined,budgetMin:numeric(row.budgetMin),budgetMax:numeric(row.budgetMax),
    currency:typeof row.currency==='string'?row.currency.toUpperCase():undefined,jobType:row.jobType??'remote_job',postedAt,
    bidsCount:numeric(row.bidsCount),skills:Array.isArray(row.skills)?row.skills.filter((s:unknown)=>typeof s==='string'):[],
    country:typeof row.country==='string'?row.country:undefined,language:/[\u0600-\u06ff]/.test(row.title+' '+row.description)?'ar':'en'};
}
