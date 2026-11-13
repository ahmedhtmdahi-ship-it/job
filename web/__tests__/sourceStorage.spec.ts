import {it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({
 db:{opportunity:{upsert:vi.fn()},opportunityPreference:{upsert:vi.fn(),updateMany:vi.fn(),update:vi.fn(),findMany:vi.fn()},sourceCache:{upsert:vi.fn(),updateMany:vi.fn(),update:vi.fn()},sourceRun:{create:vi.fn()}},
 source:{id:'freelancer',name:'Fixture',kind:'api',fetch:vi.fn()},
}));
vi.mock('@/lib/db',()=>({default:mocks.db}));
vi.mock('@/lib/sources/index',()=>({apiSources:[mocks.source,{id:'jobicy',name:'Failing fixture',kind:'api',fetch:async()=>{throw Error('offline');}}]}));
import {persistOpportunity,refreshOpportunities,refreshDueOpportunityFeeds} from '@/lib/sources/service';
import {parseFreelancer} from '@/lib/sources/adapters/freelancer';
import fixture from '@/lib/sources/__fixtures__/freelancer.json';
beforeEach(()=>{vi.clearAllMocks();mocks.db.opportunityPreference.updateMany.mockResolvedValue({count:1});mocks.db.sourceCache.upsert.mockResolvedValue({payload:null,status:'blocked',fetchedAt:null});mocks.db.sourceCache.updateMany.mockResolvedValue({count:1});mocks.source.fetch.mockResolvedValue(parseFreelancer(fixture));});
it('deduplicates canonical URLs per user across sources and preserves decisions',async()=>{
 const item=parseFreelancer(fixture)[0];await persistOpportunity('alice',item);await persistOpportunity('alice',{...item,sourceId:'jobicy',url:item.url+'?utm_source=other'});await persistOpportunity('bob',item);
 const calls=mocks.db.opportunity.upsert.mock.calls.map(([args])=>args);
 expect(calls[0].where).toEqual(calls[1].where);expect(calls[2].where).not.toEqual(calls[0].where);expect(calls[1].update).not.toHaveProperty('disposition');expect(calls[1].update).not.toHaveProperty('userId');
});
it('keeps a successful source when another fails',async()=>{
 expect(await refreshOpportunities('alice')).toBe(true);expect(mocks.db.opportunity.upsert).toHaveBeenCalledTimes(1);
 const statuses=mocks.db.sourceRun.create.mock.calls.map(([{data}])=>data.status).sort();expect(statuses).toEqual(['failed','ok']);
 expect(mocks.db.opportunityPreference.update).toHaveBeenLastCalledWith({where:{userId:'alice'},data:{refreshLeaseUntil:new Date(0)}});
});
it('does not fetch when another refresh owns the user lease',async()=>{mocks.db.opportunityPreference.updateMany.mockResolvedValue({count:0});expect(await refreshOpportunities('alice')).toBe(false);expect(mocks.source.fetch).not.toHaveBeenCalled();});
it('uses cached public data without another HTTP request',async()=>{mocks.db.sourceCache.updateMany.mockResolvedValue({count:0});mocks.db.sourceCache.upsert.mockResolvedValue({payload:JSON.parse(JSON.stringify(parseFreelancer(fixture))),status:'ok',fetchedAt:new Date()});await refreshOpportunities('alice');expect(mocks.source.fetch).not.toHaveBeenCalled();expect(mocks.db.opportunity.upsert).toHaveBeenCalled();});
it('schedules only opted-in due profiles',async()=>{mocks.db.opportunityPreference.findMany.mockResolvedValue([]);await refreshDueOpportunityFeeds();expect(mocks.db.opportunityPreference.findMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({dailyRefresh:true,nextRefreshAt:{lte:expect.any(Date)}})}));expect(mocks.source.fetch).not.toHaveBeenCalled();});
