import {createHash} from 'node:crypto';
import {canonicalUrl} from '../canonical';
import {SourceError, type SourceAdapter} from '../types';
export const pastePlatforms = ['khamsat.com','mostaql.com','kafiil.com','ureed.com','upwork.com','wuzzuf.net','linkedin.com','bayt.com'] as const;
/** Never fetch pasted URLs. Missing dates/budgets stay unknown, not invented. */
export const pasteAdapter: SourceAdapter = {
  id:'paste',name:'Paste a job',kind:'paste',
  async fetch({url:rawUrl,text='',jobType}) {
    text=text.trim();
    if(text.length>50000 || (rawUrl?.length??0)>2048 || (!text && !rawUrl?.trim()))throw new SourceError('parser_error','Invalid paste');
    let url:string|null=null;
    const supplied=rawUrl?.trim() || text.match(/https?:\/\/[^\s<>]+/)?.[0];
    if(supplied){
      try{url=canonicalUrl(supplied);const host=new URL(url).hostname;
        if(!pastePlatforms.some(domain=>host===domain||host.endsWith('.'+domain)))throw Error();
      }catch{throw new SourceError('parser_error','Unsupported URL');}
    }
    const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const skillsLine=lines.find(line=>/^(?:skills|المهارات)\s*[:：]/i.test(line));
    const budget=text.match(/(?:budget|الميزانية)\s*:\s*(USD|EUR|EGP|SAR|AED|GBP)\s+(\d+(?:\.\d{1,2})?)(?:\s*[-–]\s*(\d+(?:\.\d{1,2})?))?/i);
    const budgetMin=budget?Number(budget[2]):undefined;
    const budgetMax=budget?Number(budget[3]??budget[2]):undefined;
    if(budgetMin!==undefined && budgetMax!<budgetMin)throw new SourceError('parser_error','Invalid budget range');
    return [{sourceId:'paste',externalId:createHash('sha256').update(url??text).digest('hex'),url,
      title:lines.find(line=>!/^https?:\/\//.test(line))?.slice(0,300) || (url?new URL(url).hostname:''),
      description:text,budgetMin,budgetMax,currency:budget?.[1].toUpperCase(),
      jobType:jobType??(url&&/(?:wuzzuf|linkedin|bayt)\./.test(new URL(url).hostname)?'remote_job':'freelance'),
      postedAt:null,skills:skillsLine?skillsLine.split(/[:：]/).slice(1).join(':').split(/[,،]/).map(s=>s.trim()).filter(Boolean):[],
      language:/[\u0600-\u06ff]/.test(text)?'ar':'en'}];
  },
};
