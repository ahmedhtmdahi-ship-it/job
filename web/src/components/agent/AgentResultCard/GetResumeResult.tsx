"use client";

import {useT} from "@/i18n/useT";
import { NoResumesNotice } from "@/components/agent/AgentResultCard/NoResumesNotice";
import { ResumeSelectionPrompt } from "@/components/agent/AgentResultCard/ResumeSelectionPrompt";
import type { AgentGetResumeResult } from "@/models/agent.model";

// The resume text itself is never rendered: the user is about to read the
// review, not the serialization, and the card would be a wall of text.
export function GetResumeResult({ output }: { output: AgentGetResumeResult }) {
  const tr = useT();

  if (output.status === "no_resumes") {
    return <NoResumesNotice />;
  }

  if (output.status === "unreadable") {
    return (
      <p className="text-sm">
        {tr("m030e7186c3e4")}{" "}<strong>{output.title}</strong> — {output.reason}
      </p>
    );
  }

  if (output.status === "needs_selection") {
    return <ResumeSelectionPrompt prompt={tr("m2d25aa1daf45")} resumes={output.resumes} />;
  }

  const sourceNote =
    output.source === "default"
      ? " (your default)"
      : output.source === "page"
        ? " (the one you're viewing)"
        : "";

  return (
    <div className="text-sm">
      <p>
        {tr("m9b9a8d05a7ec")}{" "}<strong>{output.title}</strong>
        {sourceNote}.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {output.chars.toLocaleString("en-US", {numberingSystem: "latn"})} {" "}{tr("m25d939ffd0d7")}{output.truncated ? tr("m0a59daa2612f") : ""}
        {output.ambiguousTitle ? tr("ma308a585ec73") : ""}
      </p>
    </div>
  );
}
