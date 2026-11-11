"use client";

import {useDateFormat} from "@/i18n/useDateFormat";
import {useT} from "@/i18n/useT";
import Link from "next/link";
import { format } from "date-fns";
import { Briefcase } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CircularScore } from "@/components/CircularScore";
import { StatusBadge } from "@/components/StatusBadge";
import { JobTabEmptyState } from "@/components/myjobs/job-details/JobTabEmptyState";
import { getJobStatusBadgeColor } from "@/lib/badge-colors";
import type { CompanyJobRow } from "@/models/companyDetails.model";

type CompanyJobsTabProps = {
  jobs: CompanyJobRow[];
};

// Read-only on purpose: every job action already lives on the job's own page
export function CompanyJobsTab({ jobs }: CompanyJobsTabProps) {
  const formatLocalized = useDateFormat();

  const tr = useT();

  if (jobs.length === 0) {
    return (
      <JobTabEmptyState
        icon={Briefcase}
        title={tr("m0ca9ccf2ff74")}
        description={tr("m42f5e9600ba8")}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tr("m7e8cd2056da7")}</TableHead>
          <TableHead>{tr("m920e413c7d41")}</TableHead>
          <TableHead className="hidden md:table-cell">{tr("m15b61974b270")}</TableHead>
          <TableHead className="hidden md:table-cell">{tr("m0c79a9c22284")}</TableHead>
          <TableHead>{tr("m03c0e806becb")}</TableHead>
          <TableHead className="hidden md:table-cell">{tr("m0e570ca6fabe")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium">
              <Link
                href={`/dashboard/myjobs/${job.id}`}
                className="hover:underline underline-offset-4"
              >
                {job.JobTitle.label}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge
                label={job.Status.label}
                color={getJobStatusBadgeColor(job.Status.value)}
              />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {job.Location?.label ?? "—"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {job.appliedDate
                ? formatLocalized(new Date(job.appliedDate), "PP")
                : job.applied
                  ? tr("m0c79a9c22284")
                  : tr("m3de0546b8c29")}
            </TableCell>
            <TableCell>
              {job.matchScore != null ? (
                <CircularScore score={job.matchScore} size="sm" />
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {job.JobSource?.label ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
