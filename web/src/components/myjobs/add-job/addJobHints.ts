import {createTranslator} from "next-intl";
import messages from "../../../../messages/en.json";
const english = createTranslator({locale: "en", messages: messages.ui as Record<string, string>});
import {message as uiMessage} from "@/i18n/message";
import { differenceInCalendarDays } from "date-fns";
import { JobStatus } from "@/models/job.model";

export const PRIMARY_STATUS_VALUES = [
  "new",
  "draft",
  "applied",
  "interview",
  "offer",
] as const;

export function splitStatuses(statuses: JobStatus[]): {
  primary: JobStatus[];
  more: JobStatus[];
} {
  const primaryValues: readonly string[] = PRIMARY_STATUS_VALUES;
  const primary = PRIMARY_STATUS_VALUES.flatMap(
    (v) => statuses.find((s) => s.value === v) ?? [],
  );
  const more = statuses.filter((s) => !primaryValues.includes(s.value));
  return { primary, more };
}

export function dueDateHint(due: Date | undefined, today: Date, translate: (key: string, values?: Record<string, string | number>) => string = english): string {
  if (!due) return "";
  const days = differenceInCalendarDays(due, today);
  if (days === 0) return translate("m19e82138c35f");
  const n = Math.abs(days);
  return translate(days > 0 ? "mb0e0db70e969" : "m2f30450b6198", {count: n});
}

export type RequiredField = "title" | "company" | "location" | "source";

export const REQUIRED_FIELD_LABELS: Record<RequiredField, string> = {
  title: uiMessage("mde2c88352242"),
  company: "Company",
  location: "Job Location",
  source: "Job Source",
};

const REQUIRED_FIELDS: RequiredField[] = [
  "title",
  "company",
  "location",
  "source",
];

export function missingRequiredFields(
  values: Partial<Record<RequiredField, string>>,
): RequiredField[] {
  return REQUIRED_FIELDS.filter((f) => !values[f]);
}
