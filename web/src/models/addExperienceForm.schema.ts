import {message as uiMessage} from "@/i18n/message";
import { z } from "zod";

export const AddExperienceFormSchema = z.object({
  id: z.string().optional(),
  resumeId: z.string().optional(),
  sectionId: z.string().optional(),
  sectionTitle: z.string().default("Experience").optional(),
  sectionType: z.string().optional(),
  title: z
    .string({
      error: uiMessage("m97ac1495aa8a"),
    })
    .min(2, {
      message: uiMessage("m5a883923b648"),
    }),
  company: z
    .string({
      error: uiMessage("ma5e52bf6d475"),
    })
    .min(2, {
      message: uiMessage("m6b7c1765dbe5"),
    }),
  location: z
    .string({
      error: uiMessage("me56d59f22012"),
    })
    .min(2, {
      message: uiMessage("m796c3d751696"),
    }),
  jobDescription: z.string().min(10, {
    message: uiMessage("m50bac20a2514"),
  }),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  currentJob: z.boolean().default(false).optional(),
});
