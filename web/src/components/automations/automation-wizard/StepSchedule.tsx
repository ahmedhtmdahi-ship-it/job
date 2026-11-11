"use client";

import {useT} from "@/i18n/useT";
import type { UseFormReturn } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { CreateAutomationInput } from "@/models/automation.schema";
import { HOURS } from "./wizardConfig";

export function StepSchedule({
  form,
  takenHours,
}: {
  form: UseFormReturn<CreateAutomationInput>;
  takenHours: Set<number>;
}) {
  const tr = useT();

  return (
    <FormField
      control={form.control}
      name="scheduleHour"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{tr("m73e0d188fa39")}</FormLabel>
          <Select
            onValueChange={(val) => {
              field.onChange(parseInt(val));
              form.clearErrors("scheduleHour");
            }}
            value={field.value.toString()}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={tr("me5293385514b")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {HOURS.map((hour) => (
                <SelectItem key={hour.value} value={hour.value.toString()}>
                  {hour.label}
                  {takenHours.has(hour.value) && (
                    <span className="ms-2 text-xs text-muted-foreground">
                      {tr("m750af77aa42e")}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            {tr("m8c7d9d292d55")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
