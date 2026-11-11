import {messageKeys} from "./message";
import {getTranslations} from 'next-intl/server';
export async function getT() {
  const t = await getTranslations('ui');
  return (key: string, values?: Record<string, unknown>): string => {
    const id = messageKeys[key] ?? key;
    if (!messageKeys[key] && !/^m[0-9a-f]{12}$/.test(id)) return key;
    if (!values) return t.raw(id);
    const formatted = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'number' ? v : String(v ?? '')]));
    return t(id, formatted);
  };
}
