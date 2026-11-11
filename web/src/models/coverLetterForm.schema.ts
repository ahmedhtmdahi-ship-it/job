import {message as uiMessage} from "@/i18n/message";
import { z } from "zod";

export const CoverLetterFormSchema = z.object({
  id: z.string().optional(),
  title: z
    .string({
      error: uiMessage("me61dde50f4e0"),
    })
    .min(1, {
      message: uiMessage("me61dde50f4e0"),
    })
    .max(100, {
      message: uiMessage("maadf9ad13390"),
    }),
  content: z
    .string({
      error: uiMessage("m3d65c52036a0"),
    })
    .min(10, {
      message: uiMessage("m04cb738d5be6"),
    }),
});
