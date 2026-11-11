import {messageKeys} from "./message";
import {useTranslations} from 'next-intl';

interface Translate {
  (key: string, values?: Record<string, unknown>): string;
  (key: undefined): undefined;
  (key: string | undefined, values?: Record<string, unknown>): string | undefined;
}
const translators = new WeakMap<object, Translate>();

/** Static messages use raw to preserve literal braces in UI examples. */
export function useT() {
  const t = useTranslations('ui');
  const existing = translators.get(t);
  if (existing) return existing;
  const translate = ((key: string | undefined, values?: Record<string, unknown>): string | undefined => {
    if (key === undefined) return undefined;
    const id = messageKeys[key] ?? key;
    if (!messageKeys[key] && !/^m[0-9a-f]{12}$/.test(id)) return key;
    if (!values) return t.raw(id);
    const formatted = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'number' ? v : String(v ?? '')]));
    return t(id, formatted);
  }) as Translate;
  translators.set(t, translate);
  return translate;
}
