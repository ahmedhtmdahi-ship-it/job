import {it,expect,vi} from 'vitest';
import {canonicalUrl,dedupe} from '@/lib/sources/canonical';
import {pasteAdapter,pastePlatforms} from '@/lib/sources/adapters/paste';
import {runSource} from '@/lib/sources/http';
import {SourceError,type SourceAdapter} from '@/lib/sources/types';
it('canonicalizes tracking URLs and deduplicates',()=>{
 expect(canonicalUrl('https://example.com/job/?id=42&utm_source=test#apply')).toBe('https://example.com/job?id=42');
 expect(dedupe([{url:'https://example.com/job?utm_source=a'},{url:'https://example.com/job'}])).toHaveLength(1);
});
it.each(pastePlatforms)('pasted fictional %s content never requests the network',async host=>{
 const network=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('No network'));
 try{const [item]=await pasteAdapter.fetch({url:`https://${host}/fictional-project`,text:'مشروع وهمي\nتطوير موقع تجريبي'});expect(item.language).toBe('ar');expect(network).not.toHaveBeenCalled();}finally{network.mockRestore();}
});
it.each(['blocked','failed','parser_error'] as const)('isolates %s',async status=>{
 const source:SourceAdapter={id:'fictional',name:'Fixture',kind:'api',fetch:async()=>{throw new SourceError(status,'fixture');}};
 expect(await runSource(source,{})).toMatchObject({status,itemCount:0,items:[]});
});
import {parseRemotive} from '@/lib/sources/adapters/remotive';
import {parseJobicy} from '@/lib/sources/adapters/jobicy';
import {parseRemoteOK} from '@/lib/sources/adapters/remoteok';
import {parseArbeitnow} from '@/lib/sources/adapters/arbeitnow';
import {parseFreelancer} from '@/lib/sources/adapters/freelancer';
import remotive from '@/lib/sources/__fixtures__/remotive.json';
import jobicy from '@/lib/sources/__fixtures__/jobicy.json';
import remoteok from '@/lib/sources/__fixtures__/remoteok.json';
import arbeitnow from '@/lib/sources/__fixtures__/arbeitnow.json';
import freelancer from '@/lib/sources/__fixtures__/freelancer.json';
import pasted from '@/lib/sources/__fixtures__/paste.json';
import {publicApi} from '@/lib/sources/http';
import {rankOpportunity} from '@/lib/sources/ranking';
it.each([
 ['remotive',parseRemotive,remotive],['jobicy',parseJobicy,jobicy],['remoteok',parseRemoteOK,remoteok],['arbeitnow',parseArbeitnow,arbeitnow],['freelancer',parseFreelancer,freelancer],
] as const)('normalizes fictional %s recording',async(id,parse,fixture)=>{
 const network=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify(fixture)));
 try{const api=publicApi('fixture-'+id,id,'https://example.com/api',3600000,parse);const items=await api.fetch({});expect(items).toHaveLength(1);expect(items[0]).toMatchObject({sourceId:id});expect(items[0].postedAt).toBeInstanceOf(Date);expect(network.mock.calls[0][1]?.headers).toMatchObject({'User-Agent':expect.stringContaining('AwelShoghlana')});await expect(api.fetch({})).rejects.toMatchObject({status:'blocked'});expect(network).toHaveBeenCalledTimes(1);expect(()=>parse({unexpected:true})).toThrow();}finally{network.mockRestore();}
});
it.each(pasted)('extracts explicit pasted fields from $url',async fixture=>{const [item]=await pasteAdapter.fetch(fixture);expect(item.skills).toEqual(['TypeScript','CSS']);expect(item.budgetMin).toBe(500);expect(item.postedAt).toBeNull();});
it('supports text-only paste without inventing a URL',async()=>{const [item]=await pasteAdapter.fetch({text:'مشروع تجريبي وهمي'});expect(item.url).toBeNull();});
it.each(['javascript:alert(1)','https://linkedin.com.evil.example/job','http://localhost/job'])('rejects unsafe paste %s',async url=>{await expect(pasteAdapter.fetch({url})).rejects.toMatchObject({status:'parser_error'});});
it.each([[403,'blocked'],[429,'blocked'],[503,'failed'],[200,'parser_error']] as const)('classifies HTTP %s',async(status,expected)=>{
 const network=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('not JSON',{status,headers:{'Retry-After':'3600'}}));
 try{expect(await runSource(publicApi('http-'+status,'Fixture','https://example.com',1000,parseRemotive),{})).toMatchObject({status:expected,itemCount:0});}finally{network.mockRestore();}
});
it('isolates timeout',async()=>{const network=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('timeout'));try{expect(await runSource(publicApi('timeout','Fixture','https://example.com',1000,parseRemotive),{})).toMatchObject({status:'failed'});}finally{network.mockRestore();}});
it('ranks matches, freshness and competition without FX conversion',()=>{
 const item=parseFreelancer(freelancer)[0];const profile={skills:['TypeScript'],minimumBudget:500,currency:'USD',language:'ar' as const};const now=new Date('2026-11-11T12:00:00Z');const best=rankOpportunity(item,profile,now);expect(best.breakdown.budget).toBe(10);
 for(const other of [{...item,skills:[]},{...item,postedAt:new Date('2020-01-01')},{...item,bidsCount:100},{...item,currency:'EGP'}])expect(best.score).toBeGreaterThan(rankOpportunity(other,profile,now).score);
 expect(rankOpportunity({...item,budgetMin:undefined},profile,now).breakdown.budget).toBe(0);
});
