"use client";

import {useT} from "@/i18n/useT";
import Link from "next/link";
import {
  ArrowLeft,
  Pause,
  Play,
  RefreshCw,
  Loader2,
  AlertTriangle,
  PlayCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutomationWithResume } from "@/models/automation.model";

interface AutomationDetailHeaderProps {
  automation: AutomationWithResume;
  retired: boolean;
  resumeMissing: boolean;
  runActive: boolean;
  aborting: boolean;
  actionLoading: boolean;
  jobsBusy: boolean;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPauseResume: () => void;
  onAbort: () => void;
  onRunNow: () => void;
}

export function AutomationDetailHeader({
  automation,
  retired,
  resumeMissing,
  runActive,
  aborting,
  actionLoading,
  jobsBusy,
  onRefresh,
  onEdit,
  onDelete,
  onPauseResume,
  onAbort,
  onRunNow,
}: AutomationDetailHeaderProps) {
  const tr = useT();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/automations">
            <ArrowLeft className="rtl-mirror h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">{automation.name}</h1>
          {retired && (
            <p className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {tr("mb344d80e24a3")}{automation.jobBoard} {tr("md38b5b404cc6")}</p>
          )}
          {(automation.keywords || automation.location) && (
            <p className="text-sm text-muted-foreground">
              {[automation.keywords, automation.location]
                .filter(Boolean)
                .join(" in ")}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        {!retired && (
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4 me-2" />
            {tr("m464c4ffd019e")}</Button>
        )}
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 me-2" />
          {tr("me2d0a54968ea")}</Button>
        {!retired && (
          <Button
            variant="outline"
            onClick={onPauseResume}
            disabled={actionLoading || resumeMissing}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : automation.status === "active" ? (
              <Pause className="h-4 w-4 me-2" />
            ) : (
              <Play className="h-4 w-4 me-2" />
            )}
            {automation.status === "active" ? tr("m858e4ba7a29f") : tr("md640c7421da0")}
          </Button>
        )}
        {retired ? null : runActive ? (
          <Button
            variant="destructive"
            onClick={onAbort}
            disabled={aborting}
          >
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
            {aborting ? tr("m4a395152a74f") : tr("mb30c6162cca9")}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onRunNow}
            disabled={
              resumeMissing || automation.status === "paused" || jobsBusy
            }
            title={
              jobsBusy
                ? tr("me494b49c3e83")
                : undefined
            }
          >
            <PlayCircle className="h-4 w-4 me-2" />
            {tr("m849ccb784cf3")}</Button>
        )}
      </div>
    </div>
  );
}
