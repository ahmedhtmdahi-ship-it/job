"use client";
import {useT} from "@/i18n/useT";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "../ui/button";
import { JobsViewMode } from "@/models/job.model";

type JobsViewToggleProps = {
  value: JobsViewMode;
  onChange: (mode: JobsViewMode) => void;
};

export function JobsViewToggle({ value, onChange }: JobsViewToggleProps) {
  const tr = useT();

  return (
    <div className="flex items-center gap-0.5 rounded-md border p-0.5">
      <Button
        size="sm"
        variant={value === "table" ? "secondary" : "ghost"}
        className="h-7 w-7 p-0"
        title={tr("m272eedb395bb")}
        aria-pressed={value === "table"}
        data-testid="jobs-view-table-btn"
        onClick={() => onChange("table")}
      >
        <List className="h-3.5 w-3.5" />
        <span className="sr-only">{tr("m272eedb395bb")}</span>
      </Button>
      <Button
        size="sm"
        variant={value === "cards" ? "secondary" : "ghost"}
        className="h-7 w-7 p-0"
        title={tr("mc1477c8c3455")}
        aria-pressed={value === "cards"}
        data-testid="jobs-view-cards-btn"
        onClick={() => onChange("cards")}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="sr-only">{tr("mc1477c8c3455")}</span>
      </Button>
    </div>
  );
}
