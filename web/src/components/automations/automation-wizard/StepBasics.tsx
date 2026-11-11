"use client";

import {useT} from "@/i18n/useT";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
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

export function StepBasics({
  form,
}: {
  form: UseFormReturn<CreateAutomationInput>;
}) {
  const tr = useT();

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tr("m9a46f09dd197")}</FormLabel>
            <FormControl>
              <Input placeholder={tr("md7cd6e58028a")} {...field} />
            </FormControl>
            <FormDescription>
              {tr("m8fd6aa79caf1")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="jobBoard"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tr("m63d96480f475")}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={tr("m88ae8e2c0dcc")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="greenhouse">
                  {tr("m97e4ab6aa14f")}</SelectItem>
                <SelectItem value="lever">{tr("m7f48b680b587")}</SelectItem>
                <SelectItem value="ashby">{tr("m12dfc79af5e6")}</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {tr("m860400b47b0b")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
