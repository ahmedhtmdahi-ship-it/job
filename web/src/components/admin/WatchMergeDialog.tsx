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
import { PROVIDER_META } from "@/components/automations/ats-search-step/types";
import type { JobBoard } from "@/models/automation.model";

export type PendingMerge = {
  provider: JobBoard;
  board: { name: string; token: string; host?: "default" | "eu" };
  existing: { id: string; label: string };
};

type Props = {
  pending: PendingMerge | null;
  onConfirm: () => void;
  onCancel: () => void;
};

// There is no "create a separate entry" option: @@unique([value, createdBy])
// forbids a second row with the same canonical value.
export function WatchMergeDialog({ pending, onConfirm, onCancel }: Props) {
  const tr = useT();

  return (
    <AlertDialog open={!!pending} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr("mafb3f541b99b")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tr("m9a7710cdfabb")}<strong>{pending?.existing.label}</strong>{tr("m9e136bc3aeec")}{pending && PROVIDER_META[pending.provider].label} {tr("m859169b38185")}{" "}
            <code>{pending?.board.token}</code> {tr("m9a1bb1e057dd")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{tr("m19766ed6ccb2")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{tr("m8cf63f081d42")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
