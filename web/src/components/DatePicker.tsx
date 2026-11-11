"use client";

import {useLocale} from "next-intl";
import {ar, enUS} from "date-fns/locale";
import {useT} from "@/i18n/useT";
import { addDays, addYears, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ControllerRenderProps } from "react-hook-form";
import { JobForm } from "@/models/job.model";
import { useState } from "react";
import { FormControl } from "./ui/form";

interface DatePickerProps {
  field: ControllerRenderProps<any, any>;
  presets: boolean;
  isEnabled: boolean;
  // Swaps the caption for month/year dropdowns, which need a bounded range:
  // left to itself the year dropdown stops at the end of the current year.
  captionLayout?: boolean;
  // Opt out of the default fixed trigger width when the field sits in a grid
  fullWidth?: boolean;
  disableFuture?: boolean;
  // Years past today the dropdown reaches. Opt-in: the default cap is the
  // current month, so a picker for a past-only field stays that way.
  futureYears?: number;
}

export function DatePicker({
  field,
  presets,
  isEnabled,
  captionLayout,
  fullWidth,
  disableFuture,
  futureYears,
}: DatePickerProps) {
  const tr = useT();
  const locale = useLocale();

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "justify-start text-start font-normal",
              fullWidth ? "w-full" : "md:w-[240px] lg:w-[280px]",
              !field.value && "text-muted-foreground"
            )}
            disabled={!isEnabled}
          >
            <CalendarIcon className="me-2 h-4 w-4" />
            {field.value ? format(field.value, "PP", {locale: locale === "ar" ? ar : enUS}) : <span>{tr("m29241ab2d244")}</span>}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
        {presets && (
          <Select
            onValueChange={(value) => {
              field.onChange(addDays(new Date(), parseInt(value)));
              setIsPopoverOpen(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={tr("m1de8ca36a20f")} />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="0">{tr("m2b065c7c9ce4")}</SelectItem>
              <SelectItem value="1">{tr("m456a73bbcefb")}</SelectItem>
              <SelectItem value="3">{tr("m9f7dbc405864")}</SelectItem>
              <SelectItem value="7">{tr("mf17d88698f34")}</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Calendar
          mode="single"
          captionLayout={captionLayout ? "dropdown" : "label"}
          startMonth={captionLayout ? new Date(1970, 0) : undefined}
          endMonth={
            captionLayout
              ? disableFuture || !futureYears
                ? new Date()
                : addYears(new Date(), futureYears)
              : undefined
          }
          selected={field.value}
          disabled={disableFuture ? { after: new Date() } : undefined}
          onSelect={(value) => {
            field.onChange(value);
            setIsPopoverOpen(false);
          }}
          className="rounded-md border"
          //   disabled={(date) =>
          //     field.value > new Date() || field.value < new Date("1900-01-01")
          //   }
          // initialFocus // NOTE: Enabling this cause error in safari browser
        />
      </PopoverContent>
    </Popover>
  );
}
