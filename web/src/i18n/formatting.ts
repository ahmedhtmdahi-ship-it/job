/** Presentation-only locale: keep the stored language and html lang as ar/en. */
export function numberLocale(locale: string) {
  return new Intl.Locale(locale, {numberingSystem: "latn"}).toString();
}

export function formatNumber(value: number, locale: string, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(locale, {...options, numberingSystem: "latn"}).format(Object.is(value, -0) ? 0 : value);
}

export function formatDate(date: Date, locale: string, options: Intl.DateTimeFormatOptions) {
  const text = new Intl.DateTimeFormat(locale, {...options, numberingSystem: "latn"}).format(date);
  return locale === "ar" ? text.replace(/،/g, "") : text;
}
