import {message} from "@/i18n/message";
import { z } from "zod";
import { APP_CONSTANTS } from "@/lib/constants";

export const AddJobFormSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  title: z
    .string({
      error: message("m97ac1495aa8a"),
    })
    .min(2, {
      message: message("m5a883923b648"),
    }),
  company: z
    .string({
      error: message("ma5e52bf6d475"),
    })
    .min(2, {
      message: message("m6b7c1765dbe5"),
    }),
  location: z
    .string({
      error: message("me56d59f22012"),
    })
    .min(2, {
      message: message("m796c3d751696"),
    }),
  type: z.string().min(1),
  workplaceType: z.string().optional(),
  source: z
    .string({
      error: message("me3256cdfe04f"),
    })
    .min(2, {
      message: message("m9451d727e7e4"),
    }),
  status: z
    .string({
      error: message("m3930283eb998"),
    })
    .min(2, {
      message: message("m3e10e2608dbe"),
    })
    .default("draft"),
  dueDate: z.date(),
  /**
   * Note: Timezone offsets can be allowed by setting the offset option to true.
   * z.string().datetime({ offset: true });
   */
  //
  dateApplied: z.date().optional(),
  salaryRange: z.string().optional(),
  jobDescription: z
    .string({
      error: message("mea336906bf2c"),
    })
    .refine((val) => val === "N/A" || val.length >= 10, {
      message: message("m50bac20a2514"),
    }),
  jobUrl: z.string().optional(),
  resume: z.string().optional(),
  coverLetter: z.string().optional(),
  tags: z
    .array(z.string())
    .max(APP_CONSTANTS.MAX_JOB_TAGS)
    .optional()
    .default([]),
});
