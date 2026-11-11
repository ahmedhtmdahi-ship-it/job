"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useEffect, useState, useTransition } from "react";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteAlertDialog } from "@/components/DeleteAlertDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { toastActionResult } from "@/lib/toast";
import { deleteJobStage } from "@/actions/jobStage.actions";
import type { JobStage } from "@/models/jobStage.model";
import {
  askedTally,
  formatStageDateTime,
  isInterviewStage,
} from "./stageDisplay";
import { StageOverviewTab } from "./StageOverviewTab";
import { StageInterviewersTab } from "./StageInterviewersTab";
import { StagePrepList } from "./StagePrepList";

// Underline tabs rather than the app's filled pills: this row sits inside the
// job's own pill tab bar, and two nested pill bars read as competing controls.
const TAB_TRIGGER =
  "cursor-pointer rounded-none border-b-2 border-transparent px-0 pb-2.5 text-sm font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";

type StageDetailPanelProps = {
  stage: JobStage;
  isCurrent: boolean;
  onEdit: () => void;
  onLinkInterviewers: () => void;
  onAddPrepQuestions: () => void;
  onChanged: () => void;
};

export function StageDetailPanel({
  stage,
  isCurrent,
  onEdit,
  onLinkInterviewers,
  onAddPrepQuestions,
  onChanged,
}: StageDetailPanelProps) {
  const tr = useT();

  const [, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const interview = isInterviewStage(stage);
  const { asked, total } = askedTally(stage);

  // Selecting another stage re-renders this component rather than remounting
  // it, so the tab has to follow the id or an interview tab survives onto a
  // stage that has none.
  useEffect(() => {
    setTab("overview");
  }, [stage.id]);

  // Both joins cascade with the stage, so the confirmation names what goes.
  const interviewerCount = stage.interviewers?.length ?? 0;
  const prepCount = stage.prepQuestions?.length ?? 0;
  const hasLinks = interviewerCount > 0 || prepCount > 0;
  const deleteDescription =
    isCurrent || hasLinks ? (
      <>
        {isCurrent && (
          <p>
            {tr("m1d1921feb351")}</p>
        )}
        {hasLinks && (
          <>
            <p className={cn(isCurrent && "mt-2")}>{tr("m39f2033b4045")}</p>
            <ul className="mt-1.5 list-disc space-y-1 ps-5">
              {interviewerCount > 0 && (
                <li>
                  <span className="font-semibold text-foreground">
                    {interviewerCount} {" "}{tr("m2272bea616a0")}{" "}
                    {interviewerCount === 1 ? tr("m1f8391309ece") : tr("m440aadc69df0")}
                  </span>{" "}
                  {tr("m73fe15b47e2a")}</li>
              )}
              {prepCount > 0 && (
                <li>
                  <span className="font-semibold text-foreground">
                    {prepCount} {" "}{tr("mb10b18f906fc")}{" "}
                    {prepCount === 1 ? tr("m1f5087db919c") : tr("m17d5efa695de")}
                  </span>{" "}
                  {tr("m8d873dcc3051")}</li>
              )}
            </ul>
            <p className="mt-2">
              {interviewerCount > 0 && prepCount > 0
                ? tr("m23a258553921")
                : interviewerCount > 0
                  ? tr("m1f36d280f2bf")
                  : tr("m30d78f957b2f")}
            </p>
          </>
        )}
      </>
    ) : undefined;

  const onDelete = () => {
    setDeleteOpen(false);
    startTransition(async () => {
      const res = await deleteJobStage(stage.id);
      toastActionResult(res, {
        success: uiMessage("m128a78913cd0"),
        onSuccess: onChanged,
      });
    });
  };

  return (
    <div className="flex-1 rounded-lg border bg-card p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-lg font-bold">{stage.StageType.label}</h3>
          {isCurrent && (
            <StatusBadge
              label={tr("mba2cbea56ba4")}
              color="emerald"
              className="text-[11px] font-bold"
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            aria-label={tr("meab6cca5fe7d", {v0: stage.StageType.label})}
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
            aria-label={tr("m3468c78743f0", {v0: stage.StageType.label})}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        {formatStageDateTime(
          stage.occurredAt,
          interview ? stage.durationMins : null,
        )}
      </p>

      {/* A one-tab bar is a control that does nothing, so a non-interview
          stage gets the overview on its own. */}
      {interview ? (
        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="overview" className={TAB_TRIGGER}>
              {tr("md4b1ea5708dd")}</TabsTrigger>
            <TabsTrigger value="interviewer" className={TAB_TRIGGER}>
              {tr("m67b21e748742")}{stage.interviewers.length > 0 && (
                <span className="ms-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {stage.interviewers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="prep" className={TAB_TRIGGER}>
              {tr("me45c02ccf496")}{total > 0 && (
                <span className="ms-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {asked} {" "}{tr("m28391d3bc64e")}{" "}{total}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <StageOverviewTab stage={stage} onChanged={onChanged} />
          </TabsContent>
          <TabsContent value="interviewer" className="mt-4">
            <StageInterviewersTab
              stage={stage}
              onLinkInterviewers={onLinkInterviewers}
              onChanged={onChanged}
            />
          </TabsContent>
          <TabsContent value="prep" className="mt-4">
            <StagePrepList
              stage={stage}
              onAddPrepQuestions={onAddPrepQuestions}
              onChanged={onChanged}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <hr className="my-4" />
          <StageOverviewTab stage={stage} onChanged={onChanged} />
        </>
      )}

      <DeleteAlertDialog
        pageTitle="stage"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={onDelete}
        alertTitle={`Delete the ${stage.StageType.label} stage?`}
        alertDescription={deleteDescription}
      />
    </div>
  );
}
