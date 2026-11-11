import {message} from "@/i18n/message";
import { z } from "zod";
import { APP_CONSTANTS } from "@/lib/constants";

export const CreateResumeFormSchema = z.object({
  id: z.string().optional(),
  createdBy: z.string().optional(),
  title: z
    .string()
    .min(1, "Resume title is required.")
    .max(100, "Title must be less than 100 characters"),
  profileId: z.string().optional(),
  file: z
    .instanceof(File)
    .refine((file) => (APP_CONSTANTS.RESUME_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type), {
      message: message("m3814c5825d66"),
    })
    .refine((file) => file.size <= APP_CONSTANTS.MAX_RESUME_FILE_SIZE_BYTES, {
      message: message("mbac2111f02d5"),
    })
    .optional(),
  fileId: z.string().optional(),
});
