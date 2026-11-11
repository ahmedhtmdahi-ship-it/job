"use client";
import {useT} from "@/i18n/useT";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, DatabaseZap } from "lucide-react";
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
import {
  generateMockActivitiesAction,
  generateMockJobsAction,
  generateMockProfileDataAction,
} from "@/actions/mock.actions";
import { toastActionResult } from "@/lib/toast";

export function GenerateMockDataButton() {
  const tr = useT();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Jobs need the mock companies, titles and resumes from the profile step
    const steps = [
      generateMockProfileDataAction,
      generateMockActivitiesAction,
      generateMockJobsAction,
    ];
    let result = { success: true, message: "" };
    for (const step of steps) {
      result = await step();
      if (!result.success) break;
    }
    toastActionResult(result, { success: "Mock data generated" });
    setIsGenerating(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <DatabaseZap className="h-4 w-4" />
        )}
        {tr("mc0efd2b4e844")}</Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("m45b0c0d3a8be")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("m152a05229a1b")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGenerating}>{tr("m19766ed6ccb2")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isGenerating}
              onClick={(e) => {
                e.preventDefault();
                handleGenerate();
              }}
            >
              {tr("m49e49bb4401e")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
