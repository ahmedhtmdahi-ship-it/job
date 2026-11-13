import {createHash} from 'node:crypto';
import {canonicalUrl} from '../canonical';
import {SourceError, type SourceAdapter} from '../types';
export const pastePlatforms = ['khamsat.com','mostaql.com','kafiil.com','ureed.com','upwork.com','wuzzuf.net','linkedin.com','bayt.com'] as const;
/** Deliberately no HTTP client: parse only material explicitly supplied by the user. */
export const pasteAdapter: SourceAdapter = {
  id: 'paste', name: 'Paste a job', kind: 'paste',
  async fetch({url: rawUrl, text = ''}) {
    if (text.length > 50000) throw new SourceError('parser_error','Pasted text is too long');
    let url: string;
    try {
      url = canonicalUrl(rawUrl?.trim() || text.match(/https?:\/\/[^\s<>]+/)?.[0] || '');
      const host = new URL(url).hostname.toLowerCase();
      if (!pastePlatforms.some(domain => host === domain || host.endsWith('.'+domain))) throw Error();
    } catch {throw new SourceError('parser_error','A supported job URL is required');}
    const lines = text.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    return [{sourceId:'paste',externalId:createHash('sha256').update(url).digest('hex'),url,
      title:lines.find(line=>!/^https?:\/\//.test(line))?.slice(0,300) || new URL(url).hostname,
      description:text.trim(), jobType: /(?:khamsat|mostaql|kafiil|ureed|upwork)\./.test(new URL(url).hostname) ? 'freelance':'remote_job',
      postedAt:null, skills:[],language:/[\u0600-\u06ff]/.test(text)?'ar':'en'}];
  },
};
