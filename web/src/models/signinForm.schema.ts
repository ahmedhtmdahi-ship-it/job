import {message} from "@/i18n/message";
import { z } from "zod";

export const SigninFormSchema = z.object({
  email: z
    .string({
      error: message("m288e8d800174"),
    })
    .min(3, {
      message: message("m6854517c93dd"),
    })
    .email("Please enter a valid email."),
  password: z
    .string({
      error: message("m99c31a349d47"),
    })
    .min(1),
});
