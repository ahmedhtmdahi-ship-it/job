import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { buttonVariants } from "./ui/button";

interface DeleteAlertDialogProps {
  pageTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  alertTitle?: string;
  alertDescription?: ReactNode;
  deleteAction?: boolean;
  actionLabel?: string;
  actionVariant?: "destructive" | "default";
}

export function DeleteAlertDialog({
  pageTitle,
  open,
  onOpenChange,
  onDelete,
  alertTitle,
  alertDescription = uiMessage("m15c6b9cb370e"),
  deleteAction = true,
  actionLabel = uiMessage("me2d0a54968ea"),
  actionVariant = "destructive",
}: DeleteAlertDialogProps) {
  const tr = useT();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alertTitle ? tr(alertTitle) : tr("m90d3f19c10dc", {v0: pageTitle})}
          </AlertDialogTitle>
          {/* asChild: a description may carry a list, which cannot nest in a p. */}
          <AlertDialogDescription asChild>
            <div>{typeof alertDescription === "string" ? tr(alertDescription) : alertDescription}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
          {deleteAction && (
            <AlertDialogAction
              className={buttonVariants({ variant: actionVariant })}
              onClick={onDelete}
            >
              {tr(actionLabel)}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
