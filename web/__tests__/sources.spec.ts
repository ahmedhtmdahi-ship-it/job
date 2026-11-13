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
