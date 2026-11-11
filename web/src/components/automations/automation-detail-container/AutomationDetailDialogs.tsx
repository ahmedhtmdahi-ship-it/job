"use client";

import {useT} from "@/i18n/useT";
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

interface AutomationDetailDialogsProps {
  abortConfirmOpen: boolean;
  onAbortConfirmOpenChange: (open: boolean) => void;
  onAbortRun: () => void;
  deleteConfirmOpen: boolean;
  onDeleteConfirmOpenChange: (open: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function AutomationDetailDialogs({
  abortConfirmOpen,
  onAbortConfirmOpenChange,
  onAbortRun,
  deleteConfirmOpen,
  onDeleteConfirmOpenChange,
  onDelete,
  isDeleting,
}: AutomationDetailDialogsProps) {
  const tr = useT();

  return (
    <>
      <AlertDialog
        open={abortConfirmOpen}
        onOpenChange={onAbortConfirmOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("m5bc6a24ccd1d")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("m79ff00965f49")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("m154949dbda2a")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={(e) => {
                e.preventDefault();
                onAbortRun();
              }}
            >
              {tr("ma37f09f81b1b")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={onDeleteConfirmOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("mc9aa0d6611ab")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("m4f88f794e043")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tr("m19766ed6ccb2")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
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
