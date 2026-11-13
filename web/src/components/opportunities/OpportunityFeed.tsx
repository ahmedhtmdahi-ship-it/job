'use client';
import {useState,useTransition} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {getOpportunityFeed,pasteOpportunity,refreshFeed,saveOpportunityPreferences,setOpportunityDisposition} from '@/actions/opportunity.actions';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {formatDate,formatNumber} from '@/i18n/formatting';

type Data=Awaited<ReturnType<typeof getOpportunityFeed>>;
const sourceNames:Record<string,string>={freelancer:'Freelancer',remotive:'Remotive',jobicy:'Jobicy',remoteok:'Remote OK',arbeitnow:'Arbeitnow'};
const fieldClass='w-full rounded-md border bg-background p-2 text-sm';
export default function OpportunityFeed({data}:{data:Data}){
 const t=useTranslations('opportunities');const locale=useLocale();const router=useRouter();
 const [pending,start]=useTransition();const [notice,setNotice]=useState('');const [dialog,setDialog]=useState(false);
 const [source,setSource]=useState('');const [type,setType]=useState('');const [language,setLanguage]=useState('');const [budget,setBudget]=useState('');const [days,setDays]=useState('');const [disposition,setDisposition]=useState('new');
 const [currency,setCurrency]=useState(data.preferences.currency);const [minimum,setMinimum]=useState(data.preferences.minimumBudget?.toString()??'');const [preferred,setPreferred]=useState(data.preferences.language);const [daily,setDaily]=useState(data.preferences.dailyRefresh);
 const [url,setUrl]=useState('');const [text,setText]=useState('');const [pasteType,setPasteType]=useState<'freelance'|'remote_job'>('freelance');
 const act=(action:()=>Promise<{ok:boolean;error:string|null}>,after?:()=>void)=>start(async()=>{setNotice('');try{const result=await action();setNotice(result.ok?'done':result.error??'failed');if(result.ok)after?.();router.refresh();}catch{setNotice('failed');}});
 const sourceLabel=(id:string)=>id==='paste'?t('pasteSource'):sourceNames[id]??id;
 const items=data.items.filter(item=>(!source||item.sourceId===source)&&(!type||item.jobType===type)&&(!language||item.language===language)&&(!disposition||item.disposition===disposition)&&(!budget||(item.currency===currency&&item.budgetMin!==null&&item.budgetMin>=Number(budget)))&&(!days||(item.postedAt&&Date.now()-new Date(item.postedAt).getTime()<=Number(days)*86400000)));
 return <div className="col-span-3 min-w-0 space-y-5" data-testid="opportunities-page">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold">{t('title')}</h2><p className="text-sm text-muted-foreground">{t('intro')}</p></div><div className="flex gap-2"><Button disabled={pending} onClick={()=>act(refreshFeed)}>{t('refresh')}</Button><Button variant="outline" onClick={()=>setDialog(true)}>{t('paste')}</Button></div></div>
  {notice&&<p role="status" className="rounded border p-3">{t(notice)}</p>}
  <details id="opportunity-preferences" className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">{t('profile')}</summary><p className="my-2 text-sm">{t('profileHint')} {t('skillCount',{count:data.skillCount})}</p>
   <form className="grid gap-3 sm:grid-cols-3" onSubmit={e=>{e.preventDefault();act(()=>saveOpportunityPreferences({minimumBudget:minimum===''?null:Number(minimum),currency,language:preferred,dailyRefresh:daily}));}}>
    <label>{t('minBudget')}<input className={fieldClass} type="number" min="0" max="1000000000" step="0.01" value={minimum} onChange={e=>setMinimum(e.target.value)}/></label>
    <label>{t('currency')}<select className={fieldClass} value={currency} onChange={e=>setCurrency(e.target.value)}>{['USD','EUR','EGP','SAR','AED','GBP'].map(c=><option key={c}>{c}</option>)}</select></label>
    <label>{t('language')}<select className={fieldClass} value={preferred} onChange={e=>setPreferred(e.target.value)}><option value="ar">{t('ar')}</option><option value="en">{t('en')}</option></select></label>
    <label className="flex gap-2 items-center"><input type="checkbox" checked={daily} onChange={e=>setDaily(e.target.checked)}/>{t('daily')}</label><p className="text-sm">{t('dailyHint')}</p><Button disabled={pending}>{t('savePreferences')}</Button>
   </form>
  </details>
  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
   <label>{t('source')}<select className={fieldClass} value={source} onChange={e=>setSource(e.target.value)}><option value="">{t('all')}</option>{[...Object.keys(sourceNames),'paste'].map(id=><option key={id} value={id}>{sourceLabel(id)}</option>)}</select></label>
   <label>{t('type')}<select className={fieldClass} value={type} onChange={e=>setType(e.target.value)}><option value="">{t('all')}</option>{['freelance','remote_job'].map(id=><option key={id} value={id}>{t(id)}</option>)}</select></label>
   <label>{t('language')}<select className={fieldClass} value={language} onChange={e=>setLanguage(e.target.value)}><option value="">{t('all')}</option>{['ar','en'].map(id=><option key={id} value={id}>{t(id)}</option>)}</select></label>
   <label>{t('minBudget')} ({currency})<input className={fieldClass} type="number" min="0" value={budget} onChange={e=>setBudget(e.target.value)}/></label>
   <label>{t('within')}<select className={fieldClass} value={days} onChange={e=>setDays(e.target.value)}><option value="">{t('anyDate')}</option>{[1,7,30].map(n=><option key={n} value={n}>{t('days',{count:n})}</option>)}</select></label>
   <label>{t('disposition')}<select className={fieldClass} value={disposition} onChange={e=>setDisposition(e.target.value)}><option value="">{t('all')}</option>{['new','saved','skipped'].map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label>
  </div>
  <section aria-label={t('sources')} data-testid="sources-status" className="rounded-lg border p-4"><h3 className="font-semibold">{t('sources')}</h3><div className="grid gap-3 mt-3 sm:grid-cols-2 lg:grid-cols-3">{[...Object.keys(sourceNames),'paste'].map(id=>{const run=data.runs.find(r=>r.sourceId===id);return <div key={id} className="rounded border p-3" data-source={id}><div className="flex justify-between gap-2"><span dir="auto">{sourceLabel(id)}</span><strong>{t(run?.status??'not_run')}</strong></div><p className="text-xs">{t('lastRun')}: {run?formatDate(new Date(run.startedAt),locale,{dateStyle:'short',timeStyle:'short'}):t('unknown')}</p><p className="text-sm">{t('items',{count:run?.itemCount??0})}</p>{run?.cached&&<p className="text-xs">{t('cached')}</p>}{run?.reason==='terms'&&<p className="text-xs">{t('terms')}</p>}</div>})}</div></section>
  <div className="grid gap-4 lg:grid-cols-2">{items.map(item=><article key={item.id} data-testid="opportunity-card" className="min-w-0 rounded-lg border p-4 space-y-3">
   <div className="flex flex-wrap justify-between gap-2"><span dir="auto">{sourceLabel(item.sourceId)}</span><span>{t(item.jobType)} · {t(item.language)}</span></div>
   <h3 className="font-semibold text-lg" dir="auto">{item.title}</h3>{item.company&&<p dir="auto">{item.company}</p>}
   <p className="text-sm">{item.postedAt?formatDate(new Date(item.postedAt),locale,{dateStyle:'medium'}):t('unknown')} · {t('budget')}: {item.budgetMin!==null?<bdi dir="ltr">{formatNumber(item.budgetMin,locale)}{item.budgetMax!==null&&item.budgetMax!==item.budgetMin?` – ${formatNumber(item.budgetMax,locale)}`:''} {item.currency??''}</bdi>:t('unknown')}</p>
   {item.bidsCount!==null&&<p className="text-sm">{t('bids',{count:item.bidsCount})}</p>}
   <p className="font-medium">{t.rich('score',{score:formatNumber(item.ranking.score,locale),value:chunks=><bdi dir="ltr">{chunks}</bdi>})}</p><details><summary className="cursor-pointer text-sm">{t('breakdown')}</summary><dl className="grid grid-cols-2 gap-1 text-sm mt-2">{Object.entries(item.ranking.breakdown).map(([key,value])=><div key={key}><dt>{t(key)}</dt><dd>{formatNumber(value,locale,{maximumFractionDigits:1})}</dd></div>)}</dl>{!item.ranking.budgetComparable&&<p className="text-xs">{t('unknownBudget')}</p>}</details>
   <details><summary className="cursor-pointer text-sm">{t('details')}</summary><p className="whitespace-pre-wrap break-words text-sm" dir="auto">{item.description.replace(/<[^>]*>/g,' ')}</p><p className="text-xs text-muted-foreground">{t('plainText')}</p></details>
   {!!item.skills.length&&<p dir="auto" className="text-sm">{item.skills.join(' · ')}</p>}
   <div className="flex flex-wrap gap-2">{item.url&&<a className="rounded border px-3 py-2 text-sm" href={item.url} target="_blank" rel="noopener noreferrer">{t('open')}</a>}<Button variant="outline" disabled={pending||item.disposition==='saved'} onClick={()=>act(()=>setOpportunityDisposition(item.id,'saved'))}>{t(item.disposition==='saved'?'saved':'save')}</Button><Button variant="ghost" disabled={pending} onClick={()=>act(()=>setOpportunityDisposition(item.id,item.disposition==='skipped'?'new':'skipped'))}>{t(item.disposition==='skipped'?'restore':'skip')}</Button></div>
  </article>)}</div>{!items.length&&<p className="rounded border p-6 text-center">{t('empty')}</p>}
  <Dialog open={dialog} onOpenChange={setDialog}><DialogContent><DialogHeader><DialogTitle>{t('paste')}</DialogTitle><DialogDescription>{t('pasteHint')}</DialogDescription></DialogHeader>
   <form className="space-y-3" onSubmit={e=>{e.preventDefault();act(()=>pasteOpportunity({url,text,jobType:pasteType}),()=>{setDialog(false);setText('');setUrl('');setSource('');setDisposition('new');});}}>
    {notice&&notice!=='done'&&<p role="alert">{t(notice)}</p>}
    <label className="block">{t('url')}<input className={fieldClass} dir="ltr" type="url" maxLength={2048} value={url} onChange={e=>setUrl(e.target.value)}/></label><label className="block">{t('text')}<textarea className={fieldClass} rows={7} maxLength={50000} value={text} onChange={e=>setText(e.target.value)}/></label><p className="text-xs">{t('parseHint')}</p>
    <label className="block">{t('type')}<select className={fieldClass} value={pasteType} onChange={e=>setPasteType(e.target.value as 'freelance'|'remote_job')}><option value="freelance">{t('freelance')}</option><option value="remote_job">{t('remote_job')}</option></select></label>
    <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={()=>setDialog(false)}>{t('cancel')}</Button><Button disabled={pending||(!url.trim()&&!text.trim())}>{t('create')}</Button></div>
   </form>
  </DialogContent></Dialog>
 </div>;
}
