"use client";
import {useT} from "@/i18n/useT";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobStatus } from "@/models/job.model";
import { cn } from "@/lib/utils";
import { splitStatuses } from "./addJobHints";
import {
  SEGMENT_CHECKED_CLASS,
  SEGMENT_CLASS,
  SegmentedRadio,
} from "./SegmentedRadio";

type StatusSegmentProps = {
  statuses: JobStatus[];
  value?: string;
  onValueChange: (id: string) => void;
};

export function StatusSegment({
  statuses,
  value,
  onValueChange,
}: StatusSegmentProps) {
  const tr = useT();

  const { primary, more } = splitStatuses(statuses);
  const moreSelected = more.find((s) => s.id === value);

  return (
    <SegmentedRadio
      aria-label={tr("m920e413c7d41")}
      options={primary.map((s) => ({ value: s.id, label: s.label }))}
      value={value}
      onValueChange={onValueChange}
    >
      {more.length > 0 && (
        <DropdownMenu>
          {/* Radix owns data-state on the trigger, so checked is a class */}
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                SEGMENT_CLASS,
                "inline-flex items-center justify-center gap-1",
                moreSelected && SEGMENT_CHECKED_CLASS,
              )}
            >
              {tr(moreSelected?.label ?? tr("md47d7cb0e4f8"))}
              {moreSelected && <span className="sr-only">{tr("mbd44f3ef31ee")}</span>}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {more.map((s) => (
              <DropdownMenuItem key={s.id} onSelect={() => onValueChange(s.id)}>
                {tr(s.label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SegmentedRadio>
  );
}
