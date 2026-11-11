import {message} from "@/i18n/message";
import { z } from "zod";

export const CoverLetterFormSchema = z.object({
  id: z.string().optional(),
  title: z
    .string({
      error: message("me61dde50f4e0"),
    })
    .min(1, {
      message: message("me61dde50f4e0"),
    })
    .max(100, {
      message: message("maadf9ad13390"),
    }),
  content: z
    .string({
      error: message("m3d65c52036a0"),
    })
    .min(10, {
      message: message("m04cb738d5be6"),
    }),
});
