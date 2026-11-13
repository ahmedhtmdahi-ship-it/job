import {publicApi} from '../http';
import {object,list,normalized} from './normalize';
export function parseArbeitnow(data:unknown){return list(object(data).data).filter(value=>object(value).remote===true).map(value=>{const r=object(value);return normalized('arbeitnow',{id:r.slug,url:r.url,title:r.title,description:r.description,company:r.company_name,postedAt:r.created_at*1000,skills:r.tags,country:r.location});});}
export const arbeitnow=publicApi('arbeitnow','Arbeitnow','https://www.arbeitnow.com/api/job-board-api',3600000,parseArbeitnow);
