import {message} from "@/i18n/message";
import { z } from "zod";

export const AddCertificationFormSchema = z.object({
  id: z.string().optional(),
  resumeId: z.string().optional(),
  sectionId: z.string().optional(),
  sectionTitle: z.string().default("Certifications").optional(),
  title: z
    .string({
      error: message("m362f14233e45"),
    })
    .min(2),
  organization: z
    .string({
      error: message("m29a7293f5879"),
    })
    .min(2),
  issueDate: z.date().nullable().optional(),
  expirationDate: z.date().nullable().optional(),
  credentialUrl: z.string().nullable().optional(),
  noExpiration: z.boolean().default(false).optional(),
});
