// CI transport mock: production provider code, usage logging and fallback remain unchanged.
// No live Gemini/Ollama request is allowed from browser acceptance.
require('./m2-network-fixtures.cjs');
if(process.env.CI!=='true') throw Error('M3 fixtures require CI');
process.env.GEMINI_API_KEY='fictional-ci-key-not-a-credential';
const original=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  if(url.hostname==='generativelanguage.googleapis.com') {
    if(!url.pathname.endsWith(':generateContent')) throw Error('Unexpected mock model operation');
    const body=JSON.parse(init.body);
    const text=body.contents.flatMap(message=>message.parts??[]).map(part=>part.text).filter(Boolean).at(-1);
    const request=JSON.parse(text);
    let result;
    if(request.priceFloor) {
      const english=request.untrustedAdvertisement.language==='en';
      const facts=request.profileFacts;
      const fact=(english?facts.find(f=>f.kind==='project'&&/Documentation/.test(f.text)):facts.find(f=>f.kind==='experience'))??facts.find(f=>f.kind==='project')??facts[0];
      let text;
      if(fact?.kind==='experience')text=request.previousDraft?'لدى شركة تجريبية أنجزت 3 مشروعات باستخدام تصميم.':'أنجزت 3 مشروعات لدى شركة تجريبية باستخدام تصميم.';
      else text=fact?(english?'I worked on ':'عملت على ')+fact.text+'.':'';
      if(request.untrustedAdvertisement.description.includes('حالة اختبار ادعاء'))text=text.replace('3','50');
      result={sentences:fact?[{text,factIds:[fact.id]}]:[],suggestedPrice:40};
    } else {
      // AI-origin assertions are deliberately approved: deterministic rules must catch fabrication.
      result={unsupported_claims:(request.sentences??[]).filter(s=>s.origin==='user').map(s=>({text:s.text}))};
    }
    return new Response(JSON.stringify({candidates:[{content:{role:'model',parts:[{text:JSON.stringify(result)}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:101,candidatesTokenCount:37,totalTokenCount:138},modelVersion:'fictional-fixed-mock'}),{headers:{'content-type':'application/json'}});
  }
  if(url.port==='11434') throw Error('Live Ollama disabled in CI');
  return original(input,init);
};
