import {useLocale} from 'next-intl';
import {formatDate} from './formatting';
import {format} from 'date-fns';
import {ar, enUS} from 'date-fns/locale';
function formatter(locale: string) {
  return (date: Parameters<typeof format>[0], pattern: string) => {
    if (locale === 'ar' && /^(?:EEE|EEEE)[ ,]+MMMM? d(?:, yyyy)?$/.test(pattern)) {
      return formatDate(new Date(date), locale, {
        weekday: 'long', day: 'numeric', month: 'long',
        ...(pattern.includes('yyyy') ? {year: 'numeric' as const} : {}),
      });
    }
    return format(date, locale === 'ar' ? pattern.replace(/'at'/g, "'الساعة'") : pattern, {locale: locale === 'ar' ? ar : enUS});
  };
}
const arabic = formatter("ar");
const english = formatter("en");
export function useDateFormat() {return useLocale() === "ar" ? arabic : english;}
