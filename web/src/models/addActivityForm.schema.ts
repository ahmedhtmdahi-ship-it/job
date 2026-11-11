import {message as uiMessage} from "@/i18n/message";
import { APP_CONSTANTS } from "@/lib/constants";
import { combineDateAndTime } from "@/lib/utils";
import { differenceInMinutes, startOfDay } from "date-fns";
import { z } from "zod";

export const AddActivityFormSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string().optional(),
    activityName: z
      .string({
        error: uiMessage("mfc2e409a1bba"),
      })
      .min(2, {
        message: uiMessage("m955b3fa5e41e"),
      }),
    activityType: z.string().min(1, {
      message: uiMessage("m3ea0536f9756"),
    }),
    startDate: z.date(),
    startTime: z
      .string()
      .regex(
        /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/,
        "Start time must be in hh:mm AM/PM format"
      ),
    endDate: z.date().optional(),
    endTime: z
      .string()
      .regex(
        /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/,
        "End time must be in hh:mm AM/PM format"
      )
      .optional(),
    duration: z
      .number()
      .min(0, "Duration must be a positive number")
      .optional(),
    description: z
      .string()
      .max(1000, {
        message: uiMessage("mfba91e8b3483"),
      })
      .optional(),
  })
  // Compare calendar days only: a picked date is local midnight while an
  // untouched default carries the current time, so raw Dates aren't comparable
  .refine(
    (data) => {
      if (!data.endDate) return true; // Skip if no endDate
      return startOfDay(data.endDate) >= startOfDay(data.startDate);
    },
    {
      message: uiMessage("m884388a40b34"),
      path: ["endDate"], // Target the error message to `endDate`
    }
  )
  // Check if the end date/time is earlier than the start date/time
  .refine(
    (data) => {
      if (!data.endDate || !data.endTime) return true; // Skip if no endDate or endTime

      // Combine date and time to compare
      const startDateTime = combineDateAndTime(data.startDate, data.startTime);
      const endDateTime = combineDateAndTime(data.endDate, data.endTime);

      return endDateTime > startDateTime; // Valid only if endDateTime is after startDateTime
    },
    {
      message: uiMessage("m4ab22e266dbd"),
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      if (!data.endDate || !data.endTime) return true; // Skip if no endDate or endTime

      const startDateTime = combineDateAndTime(data.startDate, data.startTime);
      const endDateTime = combineDateAndTime(data.endDate, data.endTime);

      const durationInMinutes = differenceInMinutes(endDateTime, startDateTime);
      return durationInMinutes <= APP_CONSTANTS.ACTIVITY_MAX_DURATION_MINUTES; // Ensure duration is within max duration allowed
    },
    {
      message: `The duration between start and end date/time cannot exceed ${
        APP_CONSTANTS.ACTIVITY_MAX_DURATION_MINUTES / 60
      } hours`,
      path: ["endTime"],
    }
  )
  // Match the timer, which discards anything shorter than the minimum
  .refine(
    (data) => {
      if (!data.endDate || !data.endTime) return true; // Skip if no endDate or endTime

      const startDateTime = combineDateAndTime(data.startDate, data.startTime);
      const endDateTime = combineDateAndTime(data.endDate, data.endTime);

      const durationInMinutes = differenceInMinutes(endDateTime, startDateTime);
      return durationInMinutes >= APP_CONSTANTS.ACTIVITY_MIN_DURATION_MINUTES;
    },
    {
      message: `An activity must be at least ${APP_CONSTANTS.ACTIVITY_MIN_DURATION_MINUTES} minutes long`,
      path: ["endTime"],
    }
  )
  .refine(
    (data) => combineDateAndTime(data.startDate, data.startTime) <= new Date(),
    {
      message: uiMessage("mf0c6a9b53a33"),
      path: ["startTime"],
    }
  );
