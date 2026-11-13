import {publicApi} from '../http';
import {object,list,normalized} from './normalize';
export function parseRemoteOK(data:unknown){return list(data).filter(value=>!object(value).legal).map(value=>{const r=object(value);return normalized('remoteok',{id:r.id,url:r.url,title:r.position,description:r.description,company:r.company,postedAt:r.date,skills:r.tags,country:r.location});});}
export const remoteok=publicApi('remoteok','Remote OK','https://remoteok.com/api',24*3600000,parseRemoteOK);
