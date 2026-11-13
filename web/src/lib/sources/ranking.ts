import type {Opportunity} from './types';
export interface RankingProfile {skills:string[]; minimumBudget?:number; currency?:string; language:'ar'|'en';}
/** Unknown and incomparable budgets receive no budget points; no implicit FX conversion. */
export function rankOpportunity(item: Opportunity, profile: RankingProfile, now = new Date()) {
  const normalize=(s:string)=>s.normalize('NFKC').trim().toLocaleLowerCase('en-US');
  const wanted=new Set(profile.skills.map(normalize).filter(Boolean));
  const offered=new Set(item.skills.map(normalize));
  const matches=[...wanted].filter(skill=>offered.has(skill));
  const skills=wanted.size ? 50*matches.length/wanted.size:0;
  const age=item.postedAt ? Math.max(0,(now.getTime()-item.postedAt.getTime())/86400000):null;
  const recency=age === null ? 0:Math.max(0,20*(1-age/30));
  const competition=item.bidsCount === undefined ? 0:10/(1+Math.max(0,item.bidsCount)/10);
  const comparable=!!profile.currency && item.currency?.toUpperCase()===profile.currency.toUpperCase();
  const budget=comparable && profile.minimumBudget !== undefined && item.budgetMin !== undefined && item.budgetMin>=profile.minimumBudget ? 10:0;
  const language=item.language===profile.language?10:0;
  const breakdown={skills,recency,competition,budget,language};
  return {score:Math.round(Object.values(breakdown).reduce((a,b)=>a+b,0)*100)/100,breakdown,matches,budgetComparable:comparable};
}
