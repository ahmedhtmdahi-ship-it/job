import {publicApi} from '../http';
import {object,list,normalized} from './normalize';
export function parseFreelancer(data:unknown){return list(object(object(data).result).projects).map(value=>{const r=object(value);return normalized('freelancer',{id:r.id,url:`https://www.freelancer.com/projects/${r.id}`,title:r.title,description:r.description??r.preview_description,postedAt:r.time_submitted*1000,skills:r.jobs?.map((s:Record<string,unknown>)=>s.name),budgetMin:r.budget?.minimum,budgetMax:r.budget?.maximum,currency:r.currency?.code,bidsCount:r.bid_stats?.bid_count,jobType:'freelance'});});}
export const freelancer=publicApi('freelancer','Freelancer','https://www.freelancer.com/api/projects/0.1/projects/active/?limit=50&full_description=true&job_details=true',3600000,parseFreelancer);
