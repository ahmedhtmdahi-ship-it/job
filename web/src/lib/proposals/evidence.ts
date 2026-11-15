import type {Fact} from './document';
export const plain=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function structuredFacts(
 skills:{id:string;Tag:{label:string}}[],
 experience:{id:string;description:string;startDate:Date;endDate:Date|null;Company:{label:string};jobTitle:{label:string}}[],
 items:{id:string;title:string;content:string;ResumeSection:{sectionType:string;sectionTitle:string}|null}[],
):Fact[]{
 const labels=skills.map(s=>s.Tag.label);
 const toolsIn=(text:string)=>labels.filter(label=>text.toLocaleLowerCase().includes(label.toLocaleLowerCase()));
 return [
  ...skills.map((s):Fact=>({id:`skill:${s.id}`,kind:'skill',text:s.Tag.label,tools:[s.Tag.label],clients:[]})),
  ...experience.map((e):Fact=>({id:`experience:${e.id}`,kind:'experience',text:plain(`${e.jobTitle.label}: ${e.description}`),clients:[e.Company.label],tools:toolsIn(e.description),startDate:e.startDate.toISOString().slice(0,10),...(e.endDate?{endDate:e.endDate.toISOString().slice(0,10)}:{})})),
  ...items.filter(item=>item.ResumeSection?.sectionType==='project'||/portfolio|بورتفوليو|معرض|اعمال|أعمال/i.test(`${item.title} ${item.ResumeSection?.sectionTitle}`)).map((item):Fact=>({id:`item:${item.id}`,kind:item.ResumeSection?.sectionType==='project'?'project':'portfolio',text:plain(`${item.title}: ${item.content}`),tools:toolsIn(item.content),clients:[],...(item.content.match(/https?:\/\/[^\s<>"']+/)?.[0]?{url:item.content.match(/https?:\/\/[^\s<>"']+/)![0]}:{})})),
 ];
}
