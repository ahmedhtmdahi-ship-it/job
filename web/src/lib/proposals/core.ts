import {createHash} from 'node:crypto';
import {z} from 'zod';
import ar from '../../../messages/ar.json';
import en from '../../../messages/en.json';

export type Language = 'ar' | 'en';
export type Claim = {text: string; reason: 'rule' | 'ai' | 'length' | 'empty' | 'unavailable' | 'stale'};
export type Evidence = {skills: string[]};
export type ProposalInput = {
  evidence: Evidence;
  opportunity: {title: string; description: string; skills: string[]; language: Language; currency: string | null; budgetMin: number | null; budgetMax: number | null};
  floor: {minimum: number; currency: string; platform: string};
};
export const MAX_CHARS = 1200;
export const normalize = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase('en-US');
export const characterCount = (value: string) => Array.from(value).length;
export function words(language: Language) { return (language === 'ar' ? ar : en).proposals; }
export function message(language: Language, key: 'summaryText' | 'missingSkills', values: Record<string,string|number>) {
  let text: string = words(language)[key];
  for (const [name,value] of Object.entries(values)) text = text.replace(`{${name}}`,String(value));
  return text;
}
export function evidenceSkills(skills: string[]): string[] {
  return [...new Map(skills.map(s=>s.trim()).filter(s=>s && s.length<=100 && !/[\r\n\u202a-\u202e\u2066-\u2069]/u.test(s)).map(s=>[normalize(s),s])).values()].sort();
}
export function fingerprint(input: ProposalInput): string {
  return createHash('sha256').update(JSON.stringify({...input,evidence:{skills:evidenceSkills(input.evidence.skills)}})).digest('hex');
}
export function matchedSkills(input: ProposalInput) {
  const profile = new Set(input.evidence.skills.map(normalize));
  return input.opportunity.skills.filter(skill=>profile.has(normalize(skill)));
}
/** Closed factual vocabulary: source text cannot introduce credentials, clients or metrics.
 * Models may order these sentences, but any new sentence fails deterministic review.
 * This is intentionally conservative; free-form truth classification belongs to neither regex nor AI alone.
 */
export function sentenceCatalog(input: ProposalInput): string[] {
  const s = words(input.opportunity.language).sentences;
  const wanted = new Set(input.opportunity.skills.map(normalize));
  const skills = evidenceSkills(input.evidence.skills).filter(skill=>wanted.has(normalize(skill))).slice(0,8);
  return [s.greeting,s.interest,...skills.map(skill=>s.skills.replace('{skill}',skill)),s.scope,s.questions,s.honest,s.close];
}
export function deterministicGate(draft: string, input: ProposalInput): Claim[] {
  const claims: Claim[] = [];
  if (!draft.trim()) claims.push({text:'',reason:'empty'});
  if (characterCount(draft)>MAX_CHARS) claims.push({text:'',reason:'length'});
  const catalog = new Set(sentenceCatalog(input));
  for (const line of draft.split('\n').map(s=>s.trim()).filter(Boolean)) {
    if (!catalog.has(line)) claims.push({text:line,reason:'rule'});
  }
  return claims;
}
export const draftSchema = z.object({draft:z.string().max(10000),suggestedPrice:z.number().finite().nonnegative().max(1e9)}).strict();
export const reviewSchema = z.object({unsupported_claims:z.array(z.object({text:z.string().max(1500)}).strict()).max(30)}).strict();
export function parseJson(text: string): unknown {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
}
export const PLATFORMS = ['freelancer','remotive','jobicy','remoteok','arbeitnow','khamsat','mostaql','kafiil','ureed','upwork','wuzzuf','linkedin','bayt','paste'] as const;
export function platformOf(sourceId: string, url: string | null): string {
  if (sourceId !== 'paste' && PLATFORMS.includes(sourceId as typeof PLATFORMS[number])) return sourceId;
  if (url) {
    try { const host = new URL(url).hostname; for (const name of PLATFORMS) if(host===`${name}.com` || host.endsWith(`.${name}.com`) || (name==='wuzzuf' && /(^|\.)wuzzuf\.net$/.test(host))) return name; } catch { /* Text-only paste. */ }
  }
  return 'paste';
}
