import {message as uiMessage} from "@/i18n/message";
import { ActivityType } from "./activity.model";

export const TASK_STATUSES = {
  "in-progress": uiMessage("mb4cc4b07c300"),
  "complete": uiMessage("m143b270a3260"),
  "needs-attention": uiMessage("m63cdbf0ebd1d"),
  "cancelled": uiMessage("md353a99eb455"),
} as const;

export type TaskStatus = keyof typeof TASK_STATUSES;

export type TaskGroupBy =
  | "none"
  | "createdDate"
  | "dueDate"
  | "updatedDate"
  | "activityType";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: number;
  percentComplete: number;
  dueDate?: Date | null;
  activityTypeId?: string | null;
  activityType?: ActivityType | null;
  activities?: { id: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskWithActivityType extends Task {
  activityType: ActivityType | null;
}
