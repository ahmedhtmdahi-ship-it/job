"use client";
import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { clearAllDataAction } from "@/actions/mock.actions";
import { toastActionResult } from "@/lib/toast";

export function ClearAllDataButton() {
  const tr = useT();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    const result = await clearAllDataAction();
    toastActionResult(result, { success: message("m3bcf9e070b26") });
    setIsClearing(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={isClearing}
      >
        {isClearing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {tr("m70378e4ca135")}</Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("m5d55ea8d8ddc")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("m14c86247a8ad")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>{tr("m19766ed6ccb2")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isClearing}
              onClick={(e) => {
                e.preventDefault();
                handleClear();
              }}
            >
              {tr("m71eb8a08ffd7")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
