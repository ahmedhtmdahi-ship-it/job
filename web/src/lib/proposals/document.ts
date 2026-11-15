import {z} from 'zod';
export type Fact = {id:string;kind:'skill'|'experience'|'project'|'portfolio';text:string;tools:string[];clients:string[];employer?:string;startDate?:string;endDate?:string;url?:string};
export const sentenceSchema=z.object({text:z.string().trim().min(1).max(1200).refine(value=>!/[\r\n]/.test(value)),factIds:z.array(z.string().min(1).max(150)).max(20)}).strict();
export type Sentence=z.infer<typeof sentenceSchema>&{origin:'ai'|'user'};
export const storedSentencesSchema=z.array(sentenceSchema.extend({origin:z.enum(['ai','user'])})).max(80);
export const readSentences=(raw:unknown):Sentence[]=>storedSentencesSchema.safeParse(raw).data??[];
export const renderSentences=(sentences:Sentence[])=>sentences.map(s=>s.text).join('\n');
/** Authorship is reconstructed on the server. A checkbox never relabels unchanged AI text. */
export function editedSentences(text:string,previous:Sentence[]):Sentence[] {
  return text.split('\n').map(s=>s.trim()).filter(Boolean).map(line=>{
    const original=previous.find(s=>s.origin==='ai'&&s.text===line);
    return original?{...original}:{text:line,factIds:[],origin:'user'};
  });
}
export function factText(fact:Fact):string {
  return [fact.text,...fact.tools,...fact.clients,fact.employer,fact.startDate,fact.endDate,fact.url].filter(Boolean).join(' ');
}
const numberWords:Record<string,string>={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',twenty:'20',hundred:'100',thousand:'1000',صفر:'0',واحد:'1',واحدة:'1',اثنان:'2',اثنين:'2',ثلاث:'3',ثلاثة:'3',اربع:'4',اربعة:'4',خمس:'5',خمسة:'5',ست:'6',ستة:'6',سبع:'7',سبعة:'7',ثمان:'8',ثمانية:'8',تسع:'9',تسعة:'9',عشر:'10',عشرة:'10',عشرين:'20',عشرون:'20',مائة:'100',مئة:'100',الف:'1000'};
export function lexical(value:string):string {
 return value.normalize('NFKC').toLowerCase().replace(/[٠-٩۰-۹]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.includes(c)?'٠١٢٣٤٥٦٧٨٩'.indexOf(c):'۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/(?<=\d)[,٬](?=\d{3}\b)/g,'').replace(/[\p{L}]+/gu,w=>numberWords[w]??w);
}
const tokens=(text:string)=>lexical(text).match(/[+-]?\d+(?:\.\d+)?|[\p{L}]+|[%٪]/gu)??[];
// Grammar/transition vocabulary permits free composition, not new factual entities.
// Unknown content words fail conservatively; the independent reviewer checks meaning and relations.
const grammar=new Set(tokens('I me my mine we our you your a an the and or with in on at for from to of as by is are was were have has had can could would will may this that these those it its which who where when how through using used use worked work working built build building developed develop developing delivered deliver delivering helped help helping created create creating designed design designing implemented implement implementing completed complete completing supported support supporting contributed contribute contributing focused focus focusing bring bringing apply applying relevant relevance similar based also including include includes included experience experienced background project projects portfolio profile lists skill skills tools client clients year years month months day days percent during between since until then now scope requirements opportunity hello thank thankyou thanks discuss discussion clarify priorities deliverables details clear propose suggest happy pleased interested previously successfully انا انني ان لدي لي عندي نحن لنا انت لكم مع في علي من الي عن و او ثم ان هذا هذه ذلك تلك هو هي كان كانت لديكم يمكن يمكنني استطيع ارغب اقترح يسعدني شكرا مرحبا بخصوص خلال عبر باستخدام استخدمت استخدام عملت عمل ساهمت اسهمت طورت تطوير انجزت نفذت تنفيذ صممت تصميم قدمت تقديم بنيت بناء اعددت دعمت ساعدت اود ربط تطبيق لتلبية تلبي مناسب مناسبة ملائم ملاءمة خبرة خبرتي تجاربي سابق سابقة سابقا ايضا وكذلك حيث مما بما كما ضمن لذلك لهذا علي اساس يتضمن ملفي مهارة مهارات مهاراتي نطاق متطلبات فرصة توضيح مناقشة تفاصيل اولويات مخرجات اتفاق واضح البداية اولا لاحقا'));
const units:Record<string,string>={year:'year',years:'year',سنة:'year',سنوات:'year',عام:'year',اعوام:'year',month:'month',months:'month',شهر:'month',اشهر:'month',client:'client',clients:'client',عميل:'client',عملاء:'client',project:'project',projects:'project',مشروع:'project',مشروعات:'project',مشاريع:'project',day:'day',days:'day',يوم:'day',ايام:'day','%':'percent','٪':'percent',percent:'percent'};
const measures=(text:string)=>{const t=tokens(text);return t.flatMap((token,i)=>/^[-+]?\d/.test(token)&&units[t[i+1]]?[`${token}:${units[t[i+1]]}`]:[]);};
export function unsupportedTerms(text:string,facts:Fact[],protectedNames:string[]=[]):string[] {
 const evidence=facts.map(factText).join(' ');const allowed=new Set(tokens(evidence));
 const unsupported=tokens(text).filter(token=>{
  if(allowed.has(token))return false;
  if(/^[-+]?\d|^[%٪]$/.test(token))return true;
  if(grammar.has(token))return false;
  // Arabic conjunction/preposition inflections preserve the cited lexical root.
  if(/^[وفبل]/.test(token)&&allowed.has(token.slice(1)))return false;
  return true;
 });
 const supportedMeasures=new Set(facts.flatMap(fact=>measures(factText(fact))));
 unsupported.push(...measures(text).filter(value=>!supportedMeasures.has(value)));
 const normalized=lexical(text),source=lexical(evidence);
 for(const name of protectedNames){const term=lexical(name);if(term&&(' '+tokens(normalized).join(' ')+' ').includes(' '+tokens(term).join(' ')+' ')&&!(' '+tokens(source).join(' ')+' ').includes(' '+tokens(term).join(' ')+' '))unsupported.push(name);}
 for(const name of text.match(/\b[A-Z][A-Za-z0-9+#.-]*\b/g)??[]){if(!['I','My','We','Our','The','This','Using','With','For','In','Based','As','Hello','Thank','It'].includes(name)&&!allowed.has(lexical(name)))unsupported.push(name);}
 for(const match of text.matchAll(/(?:for|at|with|client|company)\s+([A-Z][A-Za-z0-9.-]*(?:\s+[A-Z][A-Za-z0-9.-]*)*)/g)){if(!source.includes(lexical(match[1])))unsupported.push(match[1]);}
 for(const match of text.matchAll(/شركة\s+([^.!؟،\n]+)/g)){const name=match[1].split(/\s+(?:باستخدام|مع|في|علي|على|خلال|ولدي|وحققت|لمدة|أنجزت|انجزت|نفذت|طورت|عملت|صممت)(?:\s|$)/u)[0].trim();if(!source.includes(lexical('شركة '+name)))unsupported.push(name);}
 return [...new Set(unsupported)];
}
