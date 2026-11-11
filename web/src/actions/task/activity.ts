"use server";
import {message as uiMessage} from "@/i18n/message";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { requireUser } from "../shared";

export const startActivityFromTask = async (
  taskId: string
): Promise<any | undefined> => {
  try {
    const user = await requireUser();

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id,
      },
    });

    if (!task) {
      return { success: false, message: uiMessage("mb19fa2937342") };
    }

    if (task.status === "complete" || task.status === "cancelled") {
      return {
        success: false,
        message: uiMessage("m5e7ca0687cd5"),
      };
    }

    if (!task.activityTypeId) {
      return {
        success: false,
        message: uiMessage("mb42c3604357d"),
      };
    }

    const runningActivity = await prisma.activity.findFirst({
      where: {
        userId: user.id,
        endTime: null,
      },
    });

    if (runningActivity) {
      return {
        success: false,
        message:
          uiMessage("m5af8eb49aed8"),
      };
    }

    // A task can have many activities over time; each start links a new one
    // to the task so per-task time can be tracked.
    const activity = await prisma.activity.create({
      data: {
        activityName: task.title,
        activityTypeId: task.activityTypeId,
        userId: user.id,
        startTime: new Date(),
        endTime: null,
        taskId: task.id,
      },
      include: {
        activityType: true,
      },
    });

    return { success: true, data: activity };
  } catch (error) {
    const msg = "Failed to start activity from task.";
    return handleError(error, msg);
  }
};
