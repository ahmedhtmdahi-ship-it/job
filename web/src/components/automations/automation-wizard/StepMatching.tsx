"use client";

import {useT} from "@/i18n/useT";
import type { UseFormReturn } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { CreateAutomationInput } from "@/models/automation.schema";

export function StepMatching({
  form,
}: {
  form: UseFormReturn<CreateAutomationInput>;
}) {
  const tr = useT();

  return (
    <FormField
      control={form.control}
      name="matchThreshold"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{tr("ma3a7f40f0648")}{field.value}%</FormLabel>
          <FormControl>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[field.value]}
              onValueChange={(value) => field.onChange(value[0])}
            />
          </FormControl>
          <FormDescription>
            {tr("m174ecf4c441d")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
