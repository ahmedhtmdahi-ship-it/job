/** Identity normalization only: never remove parameters that identify a job. */
export function canonicalUrl(raw: string): string {
  const url = new URL(raw);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid opportunity URL');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid','gclid'].includes(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.toString();
}
export function dedupe<T extends {url: string}>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.flatMap(item => {
    const url = canonicalUrl(item.url);
    if (seen.has(url)) return [];
    seen.add(url); return [{...item, url}];
  });
}
