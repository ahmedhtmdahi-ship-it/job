import {message as uiMessage} from "@/i18n/message";
import { z } from "zod";

export const NoteFormSchema = z.object({
  id: z.string().optional(),
  jobId: z.string({ error: uiMessage("m89c8e1fc9a30") }),
  content: z
    .string({ error: uiMessage("mbb0f587815fa") })
    .min(1, { message: uiMessage("m7a430b251196") }),
});
