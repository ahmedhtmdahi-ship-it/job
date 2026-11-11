"use client";

import {useT} from "@/i18n/useT";
import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toastSuccess, toastError } from "@/lib/toast";
import {
  MoreVertical,
  Pause,
  Play,
  Pencil,
  Trash2,
  Clock,
  FileText,
  AlertTriangle,
  Zap,
} from "lucide-react";
import type { AutomationWithResume } from "@/models/automation.model";
import { isRetiredBoard } from "@/models/automation.model";
import {
  deleteAutomation,
  pauseAutomation,
  resumeAutomation,
} from "@/actions/automation.actions";
import { APP_CONSTANTS } from "@/lib/constants";
import Link from "next/link";

interface AutomationListProps {
  automations: AutomationWithResume[];
  onEdit: (automation: AutomationWithResume) => void;
  onRefresh: () => void;
}

export function AutomationList({
  automations,
  onEdit,
  onRefresh,
}: AutomationListProps) {
  const tr = useT();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handlePause = async (id: string) => {
    setLoadingAction(id);
    const result = await pauseAutomation(id);
    setLoadingAction(null);

    if (result.success) {
      toastSuccess(tr("m79112a7f368d"));
      onRefresh();
    } else {
      toastError(result.message);
    }
  };

  const handleResume = async (id: string) => {
    setLoadingAction(id);
    const result = await resumeAutomation(id);
    setLoadingAction(null);

    if (result.success) {
      toastSuccess(tr("mebad6882a9b9"));
      onRefresh();
    } else {
      toastError(result.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    const result = await deleteAutomation(deleteId);
    setIsDeleting(false);
    setDeleteId(null);

    if (result.success) {
      toastSuccess(tr("mca8e1bb2621a"));
      onRefresh();
    } else {
      toastError(result.message);
    }
  };

  if (automations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{tr("mb777509a8aea")}</h3>
          <p className="text-muted-foreground text-center mt-2">
            {tr("m4d5c3ac43173")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {automations.map((automation) => {
          const isLoading = loadingAction === automation.id;
          const resumeMissing = !automation.resume;

          const retired = isRetiredBoard(automation.jobBoard);
          const ats = (() => {
            try {
              return JSON.parse(automation.sourceConfig ?? "{}")[
                automation.jobBoard
              ];
            } catch {
              return null;
            }
          })();
          const atsCompanies: { name: string; token: string }[] =
            ats?.companies ?? [];
          const atsTitles: string[] = ats?.targetTitles ?? [];
          const atsLocations: string[] = ats?.locations ?? [];
          const atsKeywords: string[] = ats?.keywords ?? [];
          const atsTopK: number = ats?.topK ?? APP_CONSTANTS.MAX_JOBS_PER_RUN;
          const atsSaveUnanalyzed: boolean = ats?.saveUnanalyzed !== false;

          return (
            <div
              key={automation.id}
              className="flex items-start justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/dashboard/automations/${automation.id}`}
                    className="font-semibold hover:underline"
                  >
                    {automation.name}
                  </Link>
                  <Badge variant="outline" className="capitalize">
                    {automation.jobBoard}
                  </Badge>
                  {retired ? (
                    <Badge variant="destructive">{tr("ma9f71bc2404c")}</Badge>
                  ) : (
                    <Badge
                      variant={
                        automation.status === "active" ? "default" : "secondary"
                      }
                    >
                      {automation.status}
                    </Badge>
                  )}
                </div>

                {retired && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      {tr("m4a159f8f930c")}</span>
                  </div>
                )}

                {!retired && resumeMissing && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{tr("m1c529f869546")}</span>
                  </div>
                )}

                {!retired && (
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-1">
                      {atsCompanies.slice(0, 3).map((c) => (
                        <Badge key={c.token} variant="secondary">
                          {c.name}
                        </Badge>
                      ))}
                      {atsCompanies.length > 3 && (
                        <Badge variant="secondary">
                          +{atsCompanies.length - 3} {tr("m187897ce0afc")}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      <span>
                        <span className="font-medium text-foreground">
                          {tr("m797b45a8e0b6")}</span>{" "}
                        {atsTitles.length ? atsTitles.join(", ") : tr("m4895f73177ab")}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {tr("m54006df6b3da")}</span>{" "}
                        {atsKeywords.length ? atsKeywords.join(", ") : tr("m2b505597daa7")}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {tr("mbbdffe25dc7d")}</span>{" "}
                        {atsLocations.length
                          ? atsLocations.join(", ")
                          : tr("mcaadb2786b37")}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {tr("m5ac8b3f1dc74")}</span>{" "}
                        {atsTopK}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {tr("mde9dbcde15eb")}</span>{" "}
                        {atsSaveUnanalyzed ? tr("mb8d31e852725") : tr("mb4dc66dde806")}
                      </span>
                      {automation.resume && (
                        <span>
                          <span className="font-medium text-foreground">
                            {tr("m5bd8515c5cd1")}</span>{" "}
                          {automation.resume.title}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {automation.scheduleHour.toString().padStart(2, "0")}{tr("mc102ebbdc91b")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{automation.matchThreshold}{tr("m580e9fe399be")}</span>
                  </div>
                  {!retired &&
                    automation.nextRunAt &&
                    automation.status === "active" && (
                      <span className="text-xs">
                        {tr("m5693e770dd67")}{" "}
                        {format(
                          new Date(automation.nextRunAt),
                          "MMM d, h:mm a",
                        )}
                      </span>
                    )}
                  {automation.lastRunAt && (
                    <span className="text-xs">
                      {tr("md57a5a051efe")}{" "}
                      {format(new Date(automation.lastRunAt), "MMM d, h:mm a")}
                    </span>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!retired &&
                    (automation.status === "active" ? (
                      <DropdownMenuItem
                        onClick={() => handlePause(automation.id)}
                      >
                        <Pause className="h-4 w-4 me-2" />
                        {tr("m858e4ba7a29f")}</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleResume(automation.id)}
                        disabled={resumeMissing}
                      >
                        <Play className="h-4 w-4 me-2" />
                        {tr("md640c7421da0")}</DropdownMenuItem>
                    ))}
                  {!retired && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(automation)}>
                        <Pencil className="h-4 w-4 me-2" />
                        {tr("m464c4ffd019e")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteId(automation.id)}
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    {tr("me2d0a54968ea")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("mc9aa0d6611ab")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("m4f88f794e043")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tr("m19766ed6ccb2")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive-bg text-destructive-foreground hover:bg-destructive-bg/90"
            >
              {isDeleting ? tr("m685ecb984ac2") : tr("me2d0a54968ea")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
