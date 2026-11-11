import {useLocale} from 'next-intl';
import {format} from 'date-fns';
import {ar, enUS} from 'date-fns/locale';
function formatter(locale: string) {
  return (date: Parameters<typeof format>[0], pattern: string) => format(date, locale === 'ar' ? pattern.replace(/'at'/g, "'الساعة'") : pattern, {locale: locale === 'ar' ? ar : enUS});
}
const arabic = formatter("ar");
const english = formatter("en");
export function useDateFormat() {return useLocale() === "ar" ? arabic : english;}
