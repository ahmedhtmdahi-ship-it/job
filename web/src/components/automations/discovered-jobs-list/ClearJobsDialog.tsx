"use client";

import {useT} from "@/i18n/useT";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { buttonVariants } from "@/components/ui/button";
import { toastSuccess, toastError } from "@/lib/toast";
import { clearDiscoveredJobs } from "@/actions/automation.actions";

interface ClearJobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  includeNew: boolean;
  onIncludeNewChange: (includeNew: boolean) => void;
  newCount: number;
  automationId: string;
  onRefresh: () => void;
}

export function ClearJobsDialog({
  open,
  onOpenChange,
  includeNew,
  onIncludeNewChange,
  newCount,
  automationId,
  onRefresh,
}: ClearJobsDialogProps) {
  const tr = useT();

  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    const result = await clearDiscoveredJobs({
      automationId,
      includeNew,
    });
    setClearing(false);
    onOpenChange(false);

    if (result.success) {
      toastSuccess(`Removed ${result.deleted ?? 0} job(s).`, tr("mb5c79a4c25f4"));
      onRefresh();
    } else {
      toastError(result.message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr("mb41fc1dbbad4")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tr("mdd89a5e922e8")}{includeNew && newCount > 0 ? tr("m437304de277b") : ""}
            {tr("me3a16e1be8cc")}</AlertDialogDescription>
        </AlertDialogHeader>
        {newCount > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={includeNew}
              onChange={(e) => onIncludeNewChange(e.target.checked)}
            />
            {tr("m97921a034f32")}{" "}{newCount} {" "}{tr("m50b231ebf0fb")}</label>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={clearing}>{tr("m19766ed6ccb2")}</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={clearing}
            onClick={(e) => {
              e.preventDefault();
              handleClear();
            }}
          >
            {clearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
