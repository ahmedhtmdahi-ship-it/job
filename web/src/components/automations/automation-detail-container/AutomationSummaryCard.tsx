"use client";

import {useT} from "@/i18n/useT";
import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, Clock, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AutomationWithResume } from "@/models/automation.model";
import { AutomationSearchConfig } from "./AutomationSearchConfig";

interface AutomationSummaryCardProps {
  automation: AutomationWithResume;
  retired: boolean;
  resumeMissing: boolean;
  isRunning: boolean;
  totalJobs: number;
  newJobsCount: number;
}

export function AutomationSummaryCard({
  automation,
  retired,
  resumeMissing,
  isRunning,
  totalJobs,
  newJobsCount,
}: AutomationSummaryCardProps) {
  const tr = useT();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{tr("m920e413c7d41")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  automation.status === "active" ? "default" : "secondary"
                }
              >
                {automation.status}
              </Badge>
              {isRunning && (
                <Badge variant="default" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {tr("mf4ccae29e1bb")}</Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m63d96480f475")}</p>
            <p className="text-sm font-medium capitalize">{automation.jobBoard}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("mfd706e4ebf0b")}</p>
            <p className="text-sm font-medium">{automation.matchThreshold}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("mf4830a1dae29")}</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {automation.scheduleHour.toString().padStart(2, "0")}{tr("mc102ebbdc91b")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("md640c7421da0")}</p>
            {resumeMissing ? (
              <p className="text-amber-600 flex items-center gap-1 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {tr("m6be36ca49ee8")}</p>
            ) : (
              <Link
                href={`/dashboard/profile/resume/${automation.resume.id}`}
                className="text-sm font-medium flex items-center gap-1 hover:underline"
              >
                <FileText className="h-4 w-4" />
                {automation.resume.title}
              </Link>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m2e65ffbea246")}</p>
            <p className="text-sm font-medium">
              {automation.nextRunAt && automation.status === "active"
                ? format(new Date(automation.nextRunAt), "MMM d, h:mm a")
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m9c05e80faaf8")}</p>
            <p className="text-sm font-medium">
              {automation.lastRunAt
                ? format(new Date(automation.lastRunAt), "MMM d, h:mm a")
                : tr("m6300ef800bb8")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m3457f3cfe808")}</p>
            <p className="text-sm font-medium">
              {totalJobs} {tr("m11239872d178")}{newJobsCount > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {newJobsCount} {tr("m11507a0e2f5e")}</Badge>
              )}
            </p>
          </div>
        </div>

        <AutomationSearchConfig
          sourceConfig={automation.sourceConfig}
          jobBoard={automation.jobBoard}
          retired={retired}
        />
      </CardContent>
    </Card>
  );
}
