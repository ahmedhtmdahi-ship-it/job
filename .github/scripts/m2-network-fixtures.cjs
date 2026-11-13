// Loaded only by the CI server process, never by the production application.
const fs=require('node:fs');const path=require('node:path');
if(process.env.CI!=='true')throw Error('Fixture preloader is CI-only');
const original=globalThis.fetch;
const sources={'www.freelancer.com':'freelancer','remotive.com':'remotive','jobicy.com':'jobicy','remoteok.com':'remoteok','www.arbeitnow.com':'arbeitnow'};
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 const id=sources[url.hostname];
 if(id){
  if(id==='remoteok')return new Response('Fictional source outage',{status:503});
  const data=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../../web/src/lib/sources/__fixtures__/${id}.json`),'utf8'));
  const rows=Array.isArray(data)?data.slice(1):data.jobs??data.data??data.result?.projects??[];
  for(const row of rows){for(const field of ['title','jobTitle','position'])if(field in row)row[field]='فرصة تطوير تجريبية وهمية';for(const field of ['description','jobDescription'])if(field in row)row[field]='مشروع وهمي لتطوير واجهة عربية. لا يمثل إعلانًا حقيقيًا.';for(const field of ['company','company_name','companyName'])if(field in row)row[field]='شركة تجريبية وهمية';for(const field of ['tags'])if(field in row)row[field]=['تصميم'];if(row.jobs)row.jobs=[{name:'تصميم'}];}
  return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
 }
 if(['localhost','127.0.0.1','[::1]'].includes(url.hostname))return original(input,init);
 throw Error('External network disabled for browser acceptance');
};
