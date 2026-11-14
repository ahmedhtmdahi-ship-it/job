'use client';
import {useState,useTransition} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useLocale,useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
import {copyProposal,getProposalData,markProposalApplied,setProposalFloor,skipProposal,writeProposal} from '@/actions/proposal.actions';
import {formatDate,formatNumber} from '@/i18n/formatting';
import type {Claim} from '@/lib/proposals/core';

type Data=Awaited<ReturnType<typeof getProposalData>>;
const field='w-full rounded border bg-background p-3';
export default function ProposalEditor({data}:{data:Data}) {
  const t=useTranslations('proposals');const locale=useLocale();const router=useRouter();
  const [pending,start]=useTransition();const [notice,setNotice]=useState('');
  const [draft,setDraft]=useState(data.proposal.draft);
  const [minimum,setMinimum]=useState(String(data.input.floor.minimum));
  const [currency,setCurrency]=useState(data.input.floor.currency);
  const [copied,setCopied]=useState(false);
  const dirty=draft!==data.proposal.draft;
  const canCopy=data.copyAllowed&&!dirty&&!pending;
  const claims=(Array.isArray(data.proposal.unsupportedClaims)?data.proposal.unsupportedClaims:[]) as Claim[];
  const id=data.opportunity.id;
  const act=(action:()=>Promise<{ok:boolean;error:string|null}>,success='saved')=>start(async()=>{
    setNotice('');setCopied(false);
    try{const result=await action();setNotice(result.ok?success:result.error??'failed');router.refresh();}
    catch{setNotice('failed');}
  });
  const copy=()=>start(async()=>{
    setCopied(false);setNotice('');
    try {
      const result=await copyProposal(id,data.proposal.version);
      if(!result.ok || !result.draft){setNotice(result.error??'blocked');router.refresh();return;}
      await navigator.clipboard.writeText(result.draft);setCopied(true);
    } catch{setNotice('failed');}
  });
  const draftLanguage=data.input.opportunity.language;
  return <div data-testid="proposal-page" className="col-span-3 min-w-0 space-y-5">
    <Link href="/dashboard/opportunities" className="text-sm underline">{t('back')}</Link>
    <header><h2 className="text-2xl font-semibold">{t('title')}</h2><h3 className="mt-2 text-lg" dir="auto">{data.opportunity.title}</h3><p className="text-muted-foreground">{t('intro')}</p></header>
    {(notice||copied)&&<p role="status" className="rounded border p-3">{t(copied?'copied':notice)}</p>}
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded border p-4"><h3>{t('score')}</h3><p className="text-2xl" data-testid="proposal-score"><bdi dir="ltr">{formatNumber(data.score,locale)} / 100</bdi></p></div>
      <div className="rounded border p-4"><h3>{t('language')}</h3><p>{t(draftLanguage)}</p></div>
      <div className="rounded border p-4"><h3>{t('price')}</h3><p className="text-xl"><bdi dir="ltr">{formatNumber(data.proposal.draft?data.proposal.suggestedPrice:data.input.floor.minimum,locale)} {data.proposal.draft?data.proposal.currency:data.input.floor.currency}</bdi></p></div>
    </section>
    <section className="rounded border p-4 space-y-2"><h3 className="font-semibold">{t('summary')}</h3><p lang={draftLanguage} dir={draftLanguage==='ar'?'rtl':'ltr'}>{data.summary}</p><h3 className="font-semibold">{t('risks')}</h3><ul className="list-disc ps-5" lang={draftLanguage} dir={draftLanguage==='ar'?'rtl':'ltr'}>{data.risks.map((risk,index)=><li key={index}>{risk}</li>)}</ul></section>
    <details className="rounded border p-4" data-testid="price-settings"><summary className="cursor-pointer font-medium">{t('settings')}</summary>
      <p className="mt-2">{t('platform')}: <bdi>{data.input.floor.platform==='paste'?t('unknownPlatform'):data.input.floor.platform}</bdi></p>
      <p className="my-2 text-sm text-muted-foreground">{t('floorHint')} {t('defaultFloor')}</p>
      <form className="grid gap-3 sm:grid-cols-3" onSubmit={e=>{e.preventDefault();act(()=>setProposalFloor({opportunityId:id,minimum:Number(minimum),currency}));}}>
        <label>{t('floor')}<input className={field} type="number" min="0" max="1000000000" step="0.01" required value={minimum} onChange={e=>setMinimum(e.target.value)}/></label>
        <label>{t('currency')}<select className={field} value={currency} onChange={e=>setCurrency(e.target.value)}>{['USD','EGP','SAR','AED','EUR','GBP'].map(code=><option key={code}>{code}</option>)}</select></label>
        <Button className="self-end" disabled={pending}>{t('saveFloor')}</Button>
      </form>
    </details>
    <section className="rounded border p-4 space-y-3" data-testid="honesty-gate" aria-live="polite">
      <h3 className="font-semibold">{t('gate')}</h3><p className={canCopy?'text-green-700 dark:text-green-400':'text-amber-700 dark:text-amber-400'}>{t(dirty?'edited':data.stale?'stale':data.copyAllowed?'passed':data.proposal.draft?'blocked':'pending')}</p>
      <p className="text-sm text-muted-foreground">{t('reviewHint')}</p>
      {!!claims.length&&<div><h4>{t('claims')}</h4><ul className="list-disc ps-5">{claims.map((claim,index)=><li key={index}>{claim.text&&<blockquote className="break-words" dir="auto">{claim.text}</blockquote>}<span>{t(claim.reason)}</span></li>)}</ul></div>}
      <Link href="/dashboard/profile" className="inline-block underline">{t('profileLink')}</Link>
    </section>
    <section className="space-y-3"><label className="block font-semibold">{t('draft')}<textarea data-testid="proposal-draft" className={`${field} mt-2 min-h-56 font-normal`} lang={draftLanguage} dir={draftLanguage==='ar'?'rtl':'ltr'} maxLength={6000} value={draft} onChange={e=>{setDraft(e.target.value);setCopied(false);}}/></label>
      <p>{t('chars',{count:Array.from(draft).length})}</p><p className="text-sm text-muted-foreground">{t('privacy')}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={()=>act(()=>writeProposal({opportunityId:id,version:data.proposal.version}))}>{t(data.proposal.draft?'rewrite':'generate')}</Button>
        <Button variant="outline" disabled={pending||!dirty} onClick={()=>act(()=>writeProposal({opportunityId:id,version:data.proposal.version,draft}))}>{t('review')}</Button>
        <Button variant="outline" disabled={!canCopy} onClick={copy}>{t('copy')}</Button>
        {data.opportunity.url&&<a className="rounded border px-4 py-2" href={data.opportunity.url} target="_blank" rel="noopener noreferrer">{t('open')}</a>}
        <Button variant="outline" disabled={pending||!!data.proposal.appliedAt} onClick={()=>act(()=>markProposalApplied(id),'applied')}>{t(data.proposal.appliedAt?'applied':'apply')}</Button>
        <Button variant="ghost" disabled={pending||data.opportunity.disposition==='skipped'} onClick={()=>act(()=>skipProposal(id),'skipped')}>{t('skip')}</Button>
      </div>
      {data.proposal.appliedAt&&<p>{t('appliedTime')}: {formatDate(new Date(data.proposal.appliedAt),locale,{dateStyle:'medium',timeStyle:'short'})} {data.proposal.jobId&&<Link className="underline" href={`/dashboard/myjobs/${data.proposal.jobId}`}>{t('tracker')}</Link>}</p>}
    </section>
    <section className="rounded border p-4 space-y-2"><h3 className="font-semibold">{t('usage')}</h3><p>{t('calls')}: {data.calls.length}</p><p>{t('inputTokens')}: {data.calls.some(c=>c.inputTokens===null)?t('usageUnknown'):formatNumber(data.calls.reduce((sum,c)=>sum+(c.inputTokens??0),0),locale)}</p><p>{t('outputTokens')}: {data.calls.some(c=>c.outputTokens===null)?t('usageUnknown'):formatNumber(data.calls.reduce((sum,c)=>sum+(c.outputTokens??0),0),locale)}</p><Link href="/dashboard/settings" className="underline">{t('aiSettings')}</Link></section>
  </div>;
}
