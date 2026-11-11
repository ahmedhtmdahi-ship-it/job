import english from '../../messages/en.json';
/** Default message for static metadata and stored system labels. */
export function message(key: string): string {
  return (english.ui as Record<string, string>)[key];
}
export const messageKeys = Object.fromEntries(Object.entries(english.ui).map(([key, value]) => [value, key]));
