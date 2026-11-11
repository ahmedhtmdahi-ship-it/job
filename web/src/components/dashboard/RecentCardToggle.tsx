"use client";

import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { getJobStatusBadgeColor } from "@/lib/badge-colors";
import { cn } from "@/lib/utils";
import { APP_CONSTANTS } from "@/lib/constants";
import { usePersistedTabIndex } from "@/hooks/usePersistedTabIndex";
import { useActivity } from "@/context/ActivityContext";
import { useActivitySwitchConfirm } from "@/hooks/useActivitySwitchConfirm";
import { JobResponse } from "@/models/job.model";
import { CirclePlay } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type RecentActivity = {
  id: string;
  activityName: string;
  duration: number | null;
  endTime: Date | null;
  activityType: { label: string } | null;
};

interface RecentCardToggleProps {
  jobs: JobResponse[];
  activities: RecentActivity[];
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return totalMinutes === 0 ? "0min" : `${hours}h ${minutes}min`;
}

function groupJobsByDate(jobs: JobResponse[]) {
  const groups = new Map<string, JobResponse[]>();
  for (const job of jobs) {
    const key = job.appliedDate
      ? format(job.appliedDate, "EEE MMMM d, yyyy")
      : uiMessage("m4214c2fd737c");
    const existing = groups.get(key);
    if (existing) {
      existing.push(job);
    } else {
      groups.set(key, [job]);
    }
  }
  return Array.from(groups.entries());
}

function groupActivitiesByDate(activities: RecentActivity[]) {
  const groups = new Map<string, RecentActivity[]>();
  for (const activity of activities) {
    const key = activity.endTime
      ? format(activity.endTime, "EEE MMMM d, yyyy")
      : uiMessage("mc1f88e9d6c41");
    const existing = groups.get(key);
    if (existing) {
      existing.push(activity);
    } else {
      groups.set(key, [activity]);
    }
  }
  return Array.from(groups.entries());
}

const tabs = [uiMessage("m2f17a0f8d518"), uiMessage("m4d0076e6b4c7")] as const;

export default function RecentCardToggle({
  jobs,
  activities,
}: RecentCardToggleProps) {
  const tr = useT();

  const [activeIndex, selectTab] = usePersistedTabIndex(
    APP_CONSTANTS.DASHBOARD_RECENT_CARD_STORAGE_KEY,
    tabs,
  );
  const { startActivity } = useActivity();
  const { requestStart, confirmDialog } = useActivitySwitchConfirm();

  return (
    <Card className="mb-2 @3xl/main:mb-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg text-green-600 min-w-0 truncate">
            {tr("m690dbe9dc099")}{" "}{tabs[activeIndex]}
          </CardTitle>
          <div
            className="flex shrink-0 rounded-md border text-xs"
            data-testid="recent-card-toggle-group"
          >
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => selectTab(index)}
                className={cn(
                  "px-2 py-1 transition-colors",
                  index === 0 && "rounded-s-md",
                  index === tabs.length - 1 && "rounded-e-md",
                  activeIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        {/* One shared grid cell keeps the card height equal on both tabs */}
        <div className="grid">
          <div
            className={cn(
              "col-start-1 row-start-1 grid auto-rows-max content-start gap-6",
              activeIndex !== 0 && "invisible",
            )}
          >
            {groupJobsByDate(jobs).map(([date, dateJobs]) => (
              <div key={date} className="grid gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {date}
                </p>
                {dateJobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-4">
                    <Avatar className="hidden h-8 w-8 sm:flex">
                      <AvatarImage
                        src={job.Company?.logoUrl || "/images/jobsync-logo.svg"}
                        alt={tr("mca8e826d9c2e")}
                      />
                      <AvatarFallback>{tr("m0917e7be3804")}</AvatarFallback>
                    </Avatar>
                    <Link href={`/dashboard/myjobs/${job?.id}`} className="min-w-0">
                      <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none truncate">
                          {job.JobTitle?.label}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.Company?.label}
                          {job.Location?.label ? ` · ${job.Location.label}` : ""}
                        </p>
                      </div>
                    </Link>
                    {job.Status?.label ? (
                      <StatusBadge
                        label={job.Status.label}
                        color={getJobStatusBadgeColor(job.Status.value)}
                        className="ms-auto shrink-0 justify-center text-xs px-1.5 py-0 h-5"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div
            className={cn(
              "col-start-1 row-start-1 grid auto-rows-max content-start gap-6",
              activeIndex !== 1 && "invisible",
            )}
          >
            {groupActivitiesByDate(activities).map(([date, dateActivities]) => (
              <div key={date} className="grid gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {date}
                </p>
                <div className="grid gap-4">
                  {dateActivities.map((activity) => (
                    <div
                      key={activity.id}
                      data-testid="recent-activity-row"
                      className="relative flex items-center gap-2"
                    >
                      <Button
                        title={tr("m20209b27f575")}
                        data-testid="recent-activity-start-btn"
                        size="icon"
                        variant="ghost"
                        onClick={() => requestStart(() => startActivity(activity.id))}
                        className="h-9 w-9 shrink-0"
                      >
                        <span>
                          <CirclePlay className="text-green-600 h-6 w-6" />
                        </span>
                      </Button>
                      <div className="grid gap-1 min-w-0 flex-1">
                        <p className="text-sm font-medium leading-none truncate">
                          {activity.activityName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.activityType?.label || tr("mb764cdc0eab7")}
                        </p>
                      </div>
                      <div className="ms-auto text-end shrink-0">
                        <p className="text-sm font-medium">
                          {formatDuration(activity.duration ?? 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      {confirmDialog}
    </Card>
  );
}
