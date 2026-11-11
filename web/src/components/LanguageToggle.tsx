'use client';
import {useLocale, useTranslations} from 'next-intl';
import {useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {setLocale} from '@/actions/locale.actions';

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations('locale');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <button type="button" disabled={pending} aria-label={t('switch')} className="w-full px-2 py-1.5 text-start text-sm" onClick={() => startTransition(async () => {await setLocale(locale === 'ar' ? 'en' : 'ar'); router.refresh();})}>{t('switch')}</button>;
}
