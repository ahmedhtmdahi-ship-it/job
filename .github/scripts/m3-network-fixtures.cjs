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
    if(request.allowedSentences) {
      const allowed=request.allowedSentences;
      const selected=request.previousDraft?[allowed[0],...allowed.slice(2,-1),allowed.at(-1)]:[...allowed.slice(0,4),allowed.at(-1)];
      const lines=[];
      for(const line of selected) if(Array.from([...lines,line].join('\n')).length<=1200) lines.push(line);
      result={draft:lines.join('\n'),suggestedPrice:40};
    } else {
      // Deliberately permissive AI proves that deterministic rules still reject fabricated claims.
      result={unsupported_claims:[]};
    }
    return new Response(JSON.stringify({candidates:[{content:{role:'model',parts:[{text:JSON.stringify(result)}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:101,candidatesTokenCount:37,totalTokenCount:138},modelVersion:'fictional-fixed-mock'}),{headers:{'content-type':'application/json'}});
  }
  if(url.port==='11434') throw Error('Live Ollama disabled in CI');
  return original(input,init);
};
