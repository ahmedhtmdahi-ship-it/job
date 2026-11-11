"use client";

import {useT} from "@/i18n/useT";
import { format } from "date-fns";
import Link from "next/link";
import { ExternalLink, FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CircularScore } from "@/components/CircularScore";
import { StatusBadge } from "@/components/StatusBadge";
import { DownloadFileButton } from "@/components/profile/DownloadFileButton";
import { BADGE_COLORS, getJobStatusBadgeColor } from "@/lib/badge-colors";
import { cn, formatUrl } from "@/lib/utils";
import type { JobMatchData } from "@/models/ai.schemas";
import {
  JobResponse,
  JobStatus,
  getJobTypeLabel,
  getWorkplaceTypeLabel,
} from "@/models/job.model";

type JobSummaryCardProps = {
  job: JobResponse;
  currentStatus: JobStatus;
  matchData: JobMatchData | null;
};

export function JobSummaryCard({
  job,
  currentStatus,
  matchData,
}: JobSummaryCardProps) {
  const tr = useT();

  const expired =
    job.dueDate &&
    new Date() > new Date(job.dueDate) &&
    currentStatus?.value === "draft";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{tr("m920e413c7d41")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {expired ? (
                <StatusBadge label={tr("m424a2551d356")} color="amber" />
              ) : (
                <StatusBadge
                  label={currentStatus?.label ?? ""}
                  color={getJobStatusBadgeColor(currentStatus?.value ?? "")}
                />
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("mbc89262d832e")}</p>
            <p className="mt-1 text-sm font-medium">
              {getJobTypeLabel(job.jobType)}
              {job.workplaceType &&
                ` · ${getWorkplaceTypeLabel(job.workplaceType)}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m8c03c4ca21ce")}</p>
            <p className="mt-1 text-sm font-medium">{job.salaryRange || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m0e570ca6fabe")}</p>
            <p className="mt-1 text-sm font-medium">{job.JobSource?.label ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m0c79a9c22284")}</p>
            <p className="mt-1 text-sm font-medium">
              {job.appliedDate
                ? format(new Date(job.appliedDate), "PP")
                : job.applied
                  ? "Yes, no date"
                  : "Not applied"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("mae539b9a1559")}</p>
            {job.matchScore != null && matchData?.analyzed !== false ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <CircularScore score={job.matchScore} size="sm" />
                {matchData?.recommendation && (
                  <Badge variant="outline" className="capitalize">
                    {matchData.recommendation}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium">{tr("m2395fae627c0")}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("md640c7421da0")}</p>
            <div className="mt-1 text-sm font-medium">
              {job.Resume?.File?.filePath ? (
                DownloadFileButton(
                  job.Resume.id!,
                  job.Resume.File.filePath,
                  job.Resume.title,
                  job.Resume.File.fileName,
                )
              ) : job.Resume?.id ? (
                <Link
                  href={`/dashboard/profile/resume/${job.Resume.id}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  {job.Resume.title}
                </Link>
              ) : (
                <p>-</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m6b02e0d363a4")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {job.createdAt ? format(new Date(job.createdAt), "PP") : "-"}
              </span>
              {job.createdVia && (
                <Badge
                  variant="outline"
                  className={cn("gap-1", BADGE_COLORS.violet)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {tr("m4d327af41f96")}{job.createdVia}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {(job.jobUrl || (job.tags && job.tags.length > 0)) && (
          <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-4">
            {job.jobUrl && (
              <a
                href={formatUrl(job.jobUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {job.jobUrl}
              </a>
            )}
            {job.tags && job.tags.length > 0 && (
              <div className="ms-auto flex flex-wrap gap-1">
                {job.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
