'use client';
import {DirectionProvider} from '@radix-ui/react-direction';
import {useLocale} from 'next-intl';
export function LocaleDirection({children}: {children: React.ReactNode}) {
  return <DirectionProvider dir={useLocale() === 'ar' ? 'rtl' : 'ltr'}>{children}</DirectionProvider>;
}
