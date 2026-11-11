import {message} from "@/i18n/message";
import { z } from "zod";

export const AddEducationFormSchema = z.object({
  id: z.string().optional(),
  resumeId: z.string().optional(),
  sectionId: z.string().optional(),
  sectionTitle: z.string().default("Education").optional(),
  sectionType: z.string().optional(),
  institution: z
    .string({
      error: message("m6913622e5b9d"),
    })
    .min(2),
  degree: z
    .string({
      error: message("m4cd5790e7224"),
    })
    .min(2),
  fieldOfStudy: z
    .string({
      error: message("mecb35c47ed14"),
    })
    .min(2),
  location: z
    .string({
      error: message("me56d59f22012"),
    })
    .min(2, {
      message: message("m796c3d751696"),
    }),
  description: z.string().nullable().optional(),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  degreeCompleted: z.boolean().default(true).optional(),
});
