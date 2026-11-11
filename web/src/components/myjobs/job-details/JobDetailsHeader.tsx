"use client";

import {useT} from "@/i18n/useT";
import {
  ArrowLeft,
  FileText,
  MoreVertical,
  Pencil,
  Sparkles,
  StickyNote,
  Trash,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  JobResponse,
  getJobTypeLabel,
  getWorkplaceTypeLabel,
} from "@/models/job.model";
import { CompanyLogo } from "../CompanyLogo";

type JobDetailsHeaderProps = {
  job: JobResponse;
  updateStatusMenu?: React.ReactNode;
  coverLetterBlockedReason?: string;
  chatBusy: boolean;
  onBack: () => void;
  onMatch: () => void;
  onCoverLetter: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddNote: () => void;
};

export function JobDetailsHeader({
  job,
  updateStatusMenu,
  coverLetterBlockedReason,
  chatBusy,
  onBack,
  onMatch,
  onCoverLetter,
  onEdit,
  onDelete,
  onAddNote,
}: JobDetailsHeaderProps) {
  const tr = useT();

  const details = [
    job.Location?.label,
    getJobTypeLabel(job.jobType),
    job.workplaceType ? getWorkplaceTypeLabel(job.workplaceType) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-4 @5xl/main:flex-row @5xl/main:items-center">
      <div className="flex flex-1 min-w-0 items-center gap-3">
        <Button title={tr("mb8d99df1066e")} variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="rtl-mirror h-4 w-4" />
        </Button>
        <CompanyLogo
          logoUrl={job.Company?.logoUrl}
          className="h-8 w-8 min-w-8"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">{job.JobTitle?.label}</h1>
          <p className="text-sm text-muted-foreground">
            {job.Company?.label && (
              <Link
                href={`/dashboard/admin/companies/${job.Company.id}`}
                className="hover:text-foreground hover:underline underline-offset-4"
              >
                {job.Company.label}
              </Link>
            )}
            {job.Company?.label && details && " · "}
            {details}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {updateStatusMenu}
        <Button
          variant="outline"
          className="cursor-pointer"
          disabled={chatBusy}
          title={chatBusy ? tr("m529a808b8ac0") : undefined}
          onClick={onMatch}
        >
          <Sparkles className="h-4 w-4 sm:me-2" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {tr("mae539b9a1559")}</span>
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          data-testid="generate-cover-letter-btn"
          disabled={!!coverLetterBlockedReason}
          title={coverLetterBlockedReason}
          onClick={onCoverLetter}
        >
          <FileText className="h-4 w-4 sm:me-2" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {job.coverLetterId ? tr("me4df89c79485") : tr("m1120f0ed04fb")}
          </span>
        </Button>
        <Button
          title={tr("m464c4ffd019e")}
          variant="outline"
          size="icon"
          onClick={onEdit}
          data-testid="job-details-edit-btn"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{tr("m464c4ffd019e")}</span>
        </Button>
        <Button
          title={tr("me2d0a54968ea")}
          variant="outline"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
          data-testid="job-details-delete-btn"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{tr("me2d0a54968ea")}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-haspopup="true"
              size="icon"
              variant="ghost"
              data-testid="job-details-actions-menu-btn"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{tr("mc02651240c87")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>{tr("mff8059dc6752")}</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
                <Pencil className="me-2 h-4 w-4" />
                {tr("mc492f013040b")}</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={onAddNote}>
                <StickyNote className="me-2 h-4 w-4" />
                {tr("mc1c718f3954b")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={onDelete}
              >
                <Trash className="me-2 h-4 w-4" />
                {tr("me2d0a54968ea")}</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
