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
} from "../../ui/alert-dialog";
import { Button } from "../../ui/button";

export function AttachPdfDialog({
  open,
  onOpenChange,
  onChoice,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoice: (choice: "replace" | "download-only") => void;
  onCancel: () => void;
}) {
  const tr = useT();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr("m3d5fbcea05d7")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tr("ma1a972a4e7f8")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{tr("m19766ed6ccb2")}</AlertDialogCancel>
          <Button variant="outline" onClick={() => onChoice("download-only")}>
            {tr("m31fbbe754b9e")}</Button>
          <AlertDialogAction onClick={() => onChoice("replace")}>
            {tr("mdaf2ad44786f")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ClearChatBeforeReviewDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const tr = useT();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr("ma2c937e7cc68")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tr("me095b846854e")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {tr("m2fda58933cf8")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DiscardImportDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const tr = useT();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr("me2761ccb9e4e")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tr("m1646e5a3e3af")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tr("m19766ed6ccb2")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive-bg text-destructive-foreground hover:bg-destructive-bg/90"
            onClick={onConfirm}
          >
            {tr("m8bc2a9d3cac1")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
