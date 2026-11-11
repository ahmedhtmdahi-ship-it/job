"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { X } from "lucide-react";
import { EMPTY_JOB_FACETS, hasJobFacets } from "@/lib/jobs/jobFacets";
import {
  JobFacets,
  JobStatus,
  getJobTypeLabel,
  getWorkplaceTypeLabel,
} from "@/models/job.model";

// "Filtered by" row for the popover facets; deep-link chips stay in the
// header (D6), so Clear all here leaves company/title/location/source alone.
export function JobsFilterChips({
  statuses,
  facets,
  onChange,
}: {
  statuses: JobStatus[];
  facets: JobFacets;
  onChange: (facets: JobFacets) => void;
}) {
  const tr = useT();

  if (!hasJobFacets(facets)) return null;

  const statusLabels = [
    ...facets.statuses.map(
      (value) => statuses.find((s) => s.value === value)?.label ?? value,
    ),
    ...(facets.acceptedDiscovered ? [uiMessage("m7adaa3b7bbd7")] : []),
  ];

  const chips = [
    {
      name: tr("m920e413c7d41"),
      value: statusLabels.join(", "),
      clear: { statuses: [], acceptedDiscovered: false },
    },
    {
      name: tr("m38938209da01"),
      value: facets.jobTypes.map((c) => getJobTypeLabel(c)).join(", "),
      clear: { jobTypes: [] },
    },
    {
      name: tr("m09fd2948a8df"),
      value: facets.workplaces.map((c) => getWorkplaceTypeLabel(c)).join(", "),
      clear: { workplaces: [] },
    },
    {
      name: tr("m9d74727714db"),
      value: facets.includeDismissed ? uiMessage("mba829a98b799") : "",
      clear: { includeDismissed: false },
    },
  ].filter((chip) => chip.value);

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <span className="me-0.5 text-xs text-muted-foreground">{tr("mac2335969679")}</span>
      {chips.map((chip) => (
        <button
          key={chip.name}
          type="button"
          aria-label={tr("m8499937f40ed", {v0: chip.name})}
          title={chip.value}
          onClick={() => onChange({ ...facets, ...chip.clear })}
          className="inline-flex h-7 max-w-[280px] items-center gap-1.5 rounded-md bg-muted ps-2.5 pe-2 text-[13px] hover:bg-muted/70"
        >
          <span className="text-muted-foreground">{chip.name}</span>
          <span className="truncate font-medium">{chip.value}</span>
          <X className="h-3 w-3 shrink-0" />
        </button>
      ))}
      <button
        type="button"
        className="h-7 px-2 text-[13px] text-muted-foreground underline hover:text-foreground"
        onClick={() => onChange(EMPTY_JOB_FACETS)}
      >
        {tr("m29a390f9237e")}</button>
    </div>
  );
}
