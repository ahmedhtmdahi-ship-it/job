"use client";
import {useT} from "@/i18n/useT";
import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { StatusBadge } from "../StatusBadge";
import { getJobStatusBadgeColor } from "@/lib/badge-colors";
import { cn } from "@/lib/utils";
import { JobResponse } from "@/models/job.model";

type JobStatusBadgeProps = {
  job: JobResponse;
  className?: string;
  children?: ReactNode;
};

// Dismissed and past-due drafts override the stored status. Shared by the
// table and card views so the two can't disagree about the same job.
export function JobStatusBadge({ job, className, children }: JobStatusBadgeProps) {
  const tr = useT();

  if (job.discoveryStatus === "dismissed") {
    return (
      <Badge
        variant="outline"
        className={cn("text-muted-foreground", className)}
      >
        {tr("m9d74727714db")}{children}
      </Badge>
    );
  }

  if (job.dueDate && new Date() > job.dueDate && job.Status?.value === "draft") {
    return (
      <StatusBadge label={tr("m424a2551d356")} color="amber" className={className}>
        {children}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge
      label={job.Status?.label ?? ""}
      color={getJobStatusBadgeColor(job.Status?.value ?? "")}
      className={className}
    >
      {children}
    </StatusBadge>
  );
}
