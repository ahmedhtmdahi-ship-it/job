"use client";
import {useDateFormat} from "@/i18n/useDateFormat";
import {useT} from "@/i18n/useT";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Pencil, StickyNote, Trash } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { useState } from "react";
import {
  JobResponse,
  JobSortField,
  JobStatus,
  getJobTypeLabel,
  getWorkplaceTypeLabel,
} from "@/models/job.model";
import type { SortState } from "@/models/sort.model";
import { SortableTableHead } from "../SortableTableHead";
import Link from "next/link";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { CircularScore } from "@/components/CircularScore";
import { JobStatusBadgeMenu } from "./JobStatusBadgeMenu";
import { TooltipProvider } from "../ui/tooltip";
import { JobActionsMenu } from "./JobActionsMenu";
import { MatchJobButton } from "./MatchJobButton";
import { CompanyLogo } from "./CompanyLogo";

type MyJobsTableProps = {
  jobs: JobResponse[];
  jobStatuses: JobStatus[];
  deleteJob: (id: string) => void;
  editJob: (id: string) => void;
  onChangeJobStatus: (id: string, status: JobStatus) => void;
  onAddNote: (jobId: string) => void;
  sort: SortState<JobSortField> | null;
  onSort: (field: JobSortField) => void;
};

function MyJobsTable({
  jobs,
  jobStatuses,
  deleteJob,
  editJob,
  onChangeJobStatus,
  onAddNote,
  sort,
  onSort,
}: MyJobsTableProps) {
  const formatLocalized = useDateFormat();

  const tr = useT();

  const [alertOpen, setAlertOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState("");

  const onDeleteJob = (jobId: string) => {
    setAlertOpen(true);
    setJobIdToDelete(jobId);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-[100px] sm:table-cell">
              <span className="sr-only">{tr("md6e2a199bcd7")}</span>
            </TableHead>
            <SortableTableHead
              field="appliedDate"
              sort={sort}
              onSort={onSort}
              className="hidden md:table-cell"
            >
              {tr("m0c79a9c22284")}</SortableTableHead>
            <SortableTableHead field="title" sort={sort} onSort={onSort}>
              {tr("m7e8cd2056da7")}</SortableTableHead>
            <SortableTableHead field="company" sort={sort} onSort={onSort}>
              {tr("mde4743c87973")}</SortableTableHead>
            <SortableTableHead
              field="location"
              sort={sort}
              onSort={onSort}
              className="hidden md:table-cell"
            >
              {tr("m15b61974b270")}</SortableTableHead>
            <TableHead>{tr("m920e413c7d41")}</TableHead>
            <SortableTableHead
              field="matchScore"
              sort={sort}
              onSort={onSort}
              className="hidden md:table-cell text-center"
            >
              {tr("m03c0e806becb")}</SortableTableHead>
            <SortableTableHead
              field="source"
              sort={sort}
              onSort={onSort}
              className="hidden md:table-cell"
            >
              {tr("m0e570ca6fabe")}</SortableTableHead>
            <TableHead>
              <span className="sr-only">{tr("mff8059dc6752")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job: JobResponse) => {
            return (
              <TableRow key={job.id}>
                <TableCell className="hidden sm:table-cell">
                  <CompanyLogo
                    logoUrl={job.Company?.logoUrl}
                    className="h-8 w-8 min-w-8"
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell w-[120px] whitespace-nowrap">
                  {job.appliedDate
                    ? formatLocalized(job.appliedDate, "PP")
                    : tr("m94fb836726d8")}
                  {job.createdAt && (
                    <span className="block text-xs text-muted-foreground">
                      {tr("m6b02e0d363a4")}{" "}{formatLocalized(job.createdAt, "PP")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium cursor-pointer max-w-[120px] md:max-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/myjobs/${job?.id}`}
                      className="block truncate text-primary underline-offset-4 hover:underline"
                    >
                      {job.JobTitle?.label}
                    </Link>
                    {(job._count?.Notes ?? 0) > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0 h-5 shrink-0"
                      >
                        <StickyNote className="h-3 w-3 me-0.5" />
                        {job._count!.Notes}
                      </Badge>
                    )}
                  </div>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {[
                      getJobTypeLabel(job.jobType),
                      job.workplaceType
                        ? getWorkplaceTypeLabel(job.workplaceType)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </TableCell>
                <TableCell className="font-medium max-w-[100px] md:max-w-[160px]">
                  {job.Company?.id ? (
                    <Link
                      href={`/dashboard/admin/companies/${job.Company.id}`}
                      className="block truncate text-teal-600 underline-offset-4 hover:underline"
                    >
                      {job.Company.label}
                    </Link>
                  ) : (
                    <span className="block truncate">{job.Company?.label}</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell whitespace-nowrap max-w-[120px]">
                  <span className="block truncate">{job.Location?.label}</span>
                </TableCell>
                <TableCell>
                  <JobStatusBadgeMenu
                    job={job}
                    jobStatuses={jobStatuses}
                    onChangeJobStatus={onChangeJobStatus}
                    className="w-[110px] whitespace-nowrap justify-center"
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {job.matchScore != null ? (
                    <CircularScore
                      score={job.matchScore}
                      size="sm"
                      animate={false}
                      className="mx-auto"
                    />
                  ) : (
                    <MatchJobButton jobId={job.id} />
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {job.JobSource?.label}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={tr("mc492f013040b")}
                      aria-label={tr("mc492f013040b")}
                      onClick={() => editJob(job.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={tr("mb58e4ff842e4")}
                      aria-label={tr("mb58e4ff842e4")}
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDeleteJob(job.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <JobActionsMenu
                      job={job}
                      jobStatuses={jobStatuses}
                      onChangeJobStatus={onChangeJobStatus}
                      onAddNote={onAddNote}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <DeleteAlertDialog
        pageTitle="job"
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onDelete={() => deleteJob(jobIdToDelete)}
      />
    </TooltipProvider>
  );
}

export default MyJobsTable;
