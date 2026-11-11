import {message} from "@/i18n/message";
import { z } from "zod";

export const AddSummarySectionFormSchema = z.object({
  id: z.string().optional(),
  sectionTitle: z
    .string({
      error: message("mb65b6c4ebde9"),
    })
    .min(1),
  sectionType: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  resumeId: z.string().optional(),
  content: z
    .string({
      error: message("m0874883b291d"),
    })
    .min(10),
});
