import {message as uiMessage} from "@/i18n/message";
import { z } from "zod";

export const AddContactInfoFormSchema = z.object({
  id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  resumeId: z.string().optional(),
  firstName: z
    .string({
      error: uiMessage("m13695d8f7932"),
    })
    .min(2, {
      message: uiMessage("m9e8b38f7bdaf"),
    }),
  lastName: z
    .string({
      error: uiMessage("m24d9a924ec5e"),
    })
    .min(2, {
      message: uiMessage("ma3be47ccb423"),
    }),
  headline: z
    .string({
      error: uiMessage("m2cd15adfb697"),
    })
    .min(2, {
      message: uiMessage("m537c98bffd17"),
    }),
  email: z
    .string({
      error: uiMessage("ma11345c6c6fb"),
    })
    .email("Please enter a valid email!"),
  phone: z.string({
    error: uiMessage("mfadac94be3a4"),
  }),
  address: z.string().optional(),
  url1: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), "URL must start with http:// or https://"),
  url1Label: z.string().optional(),
  url2: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), "URL must start with http:// or https://"),
  url2Label: z.string().optional(),
});
