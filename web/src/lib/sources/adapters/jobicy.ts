import {publicApi} from '../http';
import {object,list,normalized} from './normalize';
export function parseJobicy(data:unknown){return list(object(data).jobs).map(value=>{const r=object(value);return normalized('jobicy',{id:r.id,url:r.url,title:r.jobTitle,description:r.jobDescription,company:r.companyName,postedAt:r.pubDate,country:r.jobGeo,skills:[]});});}
export const jobicy=publicApi('jobicy','Jobicy','https://jobicy.com/api/v2/remote-jobs?count=50',3600000,parseJobicy);
