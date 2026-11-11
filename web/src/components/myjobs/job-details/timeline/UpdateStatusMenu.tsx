"use client";
import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { HelpCircle, Plus, Tags, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobStatusMenuItems } from "@/components/myjobs/JobStatusMenuItems";
import type { JobStatus } from "@/models/job.model";
import type { JobStage } from "@/models/jobStage.model";
import { isInterviewStage } from "./stageDisplay";

type UpdateStatusMenuProps = {
  targetStage: JobStage | null;
  jobStatuses: JobStatus[];
  currentStatusId: string;
  onChangeStatus: (status: JobStatus) => void;
  onAddStage: () => void;
  onLinkInterviewers: () => void;
  onAddPrepQuestions: () => void;
};

export function UpdateStatusMenu({
  targetStage,
  jobStatuses,
  currentStatusId,
  onChangeStatus,
  onAddStage,
  onLinkInterviewers,
  onAddPrepQuestions,
}: UpdateStatusMenuProps) {
  const tr = useT();

  // Disabled with a visible reason rather than hidden: an item that comes and
  // goes as you change tabs is harder to learn than one that greys out.
  const reason = !targetStage
    ? message("m97f1586bac20")
    : isInterviewStage(targetStage)
      ? null
      : `${targetStage.StageType.label} is not an interview stage`;

  const items: {
    key: string;
    label: string;
    icon: typeof Plus;
    onSelect: () => void;
    reason: string | null;
  }[] = [
    { key: "add", label: tr("mafe6f5a22533"), icon: Plus, onSelect: onAddStage, reason: null },
    { key: "link", label: tr("m5ec6bebb0fd4"), icon: Users, onSelect: onLinkInterviewers, reason },
    { key: "prep", label: tr("m5a89219de3ae"), icon: HelpCircle, onSelect: onAddPrepQuestions, reason },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="cursor-pointer"
          data-testid="update-status-menu-btn"
        >
          <Tags className="h-4 w-4 sm:me-2" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {tr("m3030ddce9921")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>{tr("m3030ddce9921")}</DropdownMenuLabel>
        <DropdownMenuGroup>
          {/* Moved out of the ⋮ menu: one control answers "where is this job
              now", instead of two with near-identical names. */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <Tags className="me-2 h-4 w-4" />
              {tr("madf6fa877b9d")}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="p-0">
                <JobStatusMenuItems
                  jobStatuses={jobStatuses}
                  currentStatusId={currentStatusId}
                  onSelectStatus={onChangeStatus}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />

          {items.map(({ key, label, icon: Icon, onSelect, reason: itemReason }) => (
            <DropdownMenuItem
              key={key}
              className="cursor-pointer"
              disabled={!!itemReason}
              onSelect={onSelect}
            >
              <Icon className="me-2 h-4 w-4" />
              <span>
                {label}
                {itemReason && (
                  <span className="block text-xs text-muted-foreground">
                    {itemReason}
                  </span>
                )}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
