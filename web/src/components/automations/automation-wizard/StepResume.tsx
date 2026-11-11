"use client";

import {useT} from "@/i18n/useT";
import type { UseFormReturn } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { CreateAutomationInput } from "@/models/automation.schema";
import type { WizardResume } from "./wizardConfig";
import Link from "next/link";
import { hasMinResumeSections } from "@/lib/resumeSections";
import { APP_CONSTANTS } from "@/lib/constants";
import { IncompleteResumeHint } from "@/components/IncompleteResumeHint";

export function StepResume({
  form,
  resumes,
}: {
  form: UseFormReturn<CreateAutomationInput>;
  resumes: WizardResume[];
}) {
  const tr = useT();

  const selectableCount = resumes.filter((r) =>
    hasMinResumeSections(r.sectionCount),
  ).length;
  const incompleteCount = resumes.length - selectableCount;
  const min = APP_CONSTANTS.MIN_RESUME_SECTIONS_FOR_SELECTION;

  return (
    <>
      <FormField
        control={form.control}
        name="resumeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tr("m7e4bf17b60ee")}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="[&_[data-incomplete-hint]]:pointer-events-none">
                  <SelectValue placeholder={tr("mc971793dc97f")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {resumes.map((resume) => (
                  <SelectItem
                    key={resume.id}
                    value={resume.id}
                    disabled={!hasMinResumeSections(resume.sectionCount)}
                  >
                    {resume.title}
                    {hasMinResumeSections(resume.sectionCount) ? null : (
                      <IncompleteResumeHint />
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {tr("m1dabc27a6534")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {resumes.length === 0 && (
        <p className="text-sm text-orange-600 dark:text-orange-500">
          {tr("m1f1a418f98c5")}</p>
      )}
      {resumes.length > 0 && incompleteCount > 0 && (
        <p className="text-sm text-orange-600 dark:text-orange-500">
          {incompleteCount === resumes.length
            ? tr("mbfb436446d5e")
            : tr("m23ed07631a58", {v0: incompleteCount})}{" "}
          {tr("m273717e5129b")}{" "}{min} {" "}{tr("m3fed0833d7c3")}{" "}
          <Link href="/dashboard/profile" className="underline">
            {tr("md696a35bdd18")}</Link>
          .
        </p>
      )}
    </>
  );
}
