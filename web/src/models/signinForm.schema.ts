import {message as uiMessage} from "@/i18n/message";
import { z } from "zod";

export const SigninFormSchema = z.object({
  email: z
    .string({
      error: uiMessage("m288e8d800174"),
    })
    .min(3, {
      message: uiMessage("m6854517c93dd"),
    })
    .email("Please enter a valid email."),
  password: z
    .string({
      error: uiMessage("m99c31a349d47"),
    })
    .min(1),
});
