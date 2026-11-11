import {message as uiMessage} from "@/i18n/message";
import { z } from "zod";

export const AddTaskFormSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  title: z
    .string({ error: uiMessage("m7c15e7448e6f") })
    .min(2, { message: uiMessage("m82803cf7e0fd") }),
  description: z
    .string()
    .max(2000, { message: uiMessage("m0c47e0bf8bf7") })
    .optional()
    .nullable(),
  status: z.enum(["in-progress", "complete", "needs-attention", "cancelled"]),
  priority: z.number().min(0).max(10),
  percentComplete: z.number().min(0).max(100),
  dueDate: z
    .date()
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: uiMessage("m9864d7c52ff0") }
    ),
  activityTypeId: z.string().optional().nullable(),
});
