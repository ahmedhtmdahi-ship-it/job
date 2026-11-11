import {message} from "@/i18n/message";
import { z } from "zod";

const isValidHttpUrl = (url: string) => {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

const optionalText = (max: number) => z.string().max(max).default("").optional();

export const AddContactFormSchema = z
  .object({
    id: z.string().optional(),
    name: z
      .string({ error: message("m4c1b58b422eb") })
      .min(1, { message: message("m35a06671de7c") })
      .max(120, { message: message("mf99a4d7fc0c3") }),
    title: optionalText(120),
    email: z
      .string()
      .default("")
      .optional()
      .refine(
        (v) => !v || z.email().safeParse(v).success,
        "Please enter a valid email address.",
      ),
    phone: optionalText(40),
    linkedinUrl: z
      .string()
      .default("")
      .optional()
      .refine(
        (url) => !url || isValidHttpUrl(url),
        "Please enter a full LinkedIn URL starting with https://",
      ),
    company: z.string().optional(),
    location: z.string().optional(),
    relationship: optionalText(120),
    workedAtCompany: z.string().optional(),
    workedFrom: z.date().nullable().optional(),
    workedTo: z.date().nullable().optional(),
    // Named for ComboBox's `case "contactRole"` create path, not for the column
    contactRole: z.string().optional(),
    notes: optionalText(2000),
    lastContactedAt: z
      .date()
      .nullable()
      .optional()
      .refine(
        (date) => {
          if (!date) return true;
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
          return date <= endOfToday;
        },
        { message: message("m27e89fa9e1e2") },
      ),
  })
  .refine(
    (v) => !v.workedFrom || !v.workedTo || v.workedTo >= v.workedFrom,
    { message: message("mdc5152b435a8"), path: ["workedTo"] },
  );

export type ContactFormValues = z.infer<typeof AddContactFormSchema>;
