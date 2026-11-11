"use client";

import {useDateFormat} from "@/i18n/useDateFormat";
import {useT} from "@/i18n/useT";
import { format } from "date-fns";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TipTapContentViewer } from "@/components/TipTapContentViewer";
import type { CoverLetter } from "@/models/profile.model";
import { JobTabEmptyState } from "./JobTabEmptyState";

type CoverLetterTabProps = {
  letter?: CoverLetter;
  blockedReason?: string;
  onGenerate: () => void;
};

export function CoverLetterTab({
  letter,
  blockedReason,
  onGenerate,
}: CoverLetterTabProps) {
  const formatLocalized = useDateFormat();

  const tr = useT();

  if (!letter) {
    return (
      <JobTabEmptyState
        icon={FileText}
        title={tr("m0f0ba449d458")}
        description={tr("mdf678405b117")}
        actionLabel={tr("m72fff13251e9")}
        onAction={onGenerate}
        actionDisabled={!!blockedReason}
        actionTitle={blockedReason}
      />
    );
  }

  const generatedAt = letter.updatedAt ?? letter.createdAt;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {letter.title}
          {generatedAt &&
            tr("m50c14a425436", {v0: formatLocalized(new Date(generatedAt), "PP")})}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ms-auto cursor-pointer"
          onClick={onGenerate}
          disabled={!!blockedReason}
          title={blockedReason}
        >
          <Sparkles className="h-4 w-4 me-2" />
          {tr("m1651031bf58d")}</Button>
      </div>
      <TipTapContentViewer content={letter.content} />
    </div>
  );
}
