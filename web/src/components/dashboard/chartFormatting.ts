import {parse, differenceInDays, isValid} from "date-fns";
import {enUS} from "date-fns/locale";
import {formatDate} from "@/i18n/formatting";

/** The upstream weekly series supplies English day labels rather than timestamps. */
export function weeklyDateLabel(label: string, locale: string, compact = false, reference = new Date()) {
  if (locale !== "ar") return compact ? label.split(", ")[1] ?? label : label;
  const candidates = [-1, 0, 1].map(offset => {
    const year = reference.getFullYear() + offset;
    return parse(label, "EEE, MMM d", new Date(year, 0, 1), {locale: enUS});
  }).filter(isValid);
  const date = candidates.sort((a, b) => Math.abs(differenceInDays(a, reference)) - Math.abs(differenceInDays(b, reference)))[0];
  if (!date) return label;
  return formatDate(date, locale, compact
    ? {day: "numeric", month: "short"}
    : {weekday: "long", day: "numeric", month: "long"});
}
