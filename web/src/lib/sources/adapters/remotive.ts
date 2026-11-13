import {publicApi} from '../http';
import {object,list,normalized} from './normalize';
export function parseRemotive(data:unknown){return list(object(data).jobs).map(value=>{const r=object(value);return normalized('remotive',{id:r.id,url:r.url,title:r.title,description:r.description,company:r.company_name,postedAt:r.publication_date,skills:r.tags,country:r.candidate_required_location});});}
export const remotive=publicApi('remotive','Remotive','https://remotive.com/api/remote-jobs',6*3600000,parseRemotive);
