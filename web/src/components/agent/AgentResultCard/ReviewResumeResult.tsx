"use client";

import {useT} from "@/i18n/useT";
import { AgentReviewContent } from "@/components/agent/AgentReviewContent";
import { NoResumesNotice } from "@/components/agent/AgentResultCard/NoResumesNotice";
import { ResumeSelectionPrompt } from "@/components/agent/AgentResultCard/ResumeSelectionPrompt";
import type { AgentReviewResumeResult } from "@/models/agent.model";

// The scores and body come from the tool output, not from parsed prose — the
// review is a server-side generation now, so the card cannot disagree with
// what was saved.
export function ReviewResumeResult({ output }: { output: AgentReviewResumeResult }) {
  const tr = useT();

  if (output.status === "no_resumes") {
    return <NoResumesNotice />;
  }

  if (output.status === "needs_selection") {
    return <ResumeSelectionPrompt prompt={tr("m2d25aa1daf45")} resumes={output.resumes} />;
  }

  if (output.status === "unreadable" || output.status === "generation_failed") {
    return (
      <p className="text-sm">
        {tr("m03a90d774b1b")}{" "}<strong>{output.title}</strong> — {output.reason}
      </p>
    );
  }

  return (
    <div className="text-sm">
      <AgentReviewContent body={output.body} scores={output.scores} />
      {!output.saved && (
        <p className="mt-2 text-xs text-muted-foreground">
          {tr("md0ab85c2e8fb")}{" "}{output.saveError}
        </p>
      )}
    </div>
  );
}
