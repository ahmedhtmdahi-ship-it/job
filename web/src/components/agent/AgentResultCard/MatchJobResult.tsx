"use client";

import {useT} from "@/i18n/useT";
import { AgentMatchContent } from "@/components/agent/AgentMatchContent";
import { NoResumesNotice } from "@/components/agent/AgentResultCard/NoResumesNotice";
import { ResumeSelectionPrompt } from "@/components/agent/AgentResultCard/ResumeSelectionPrompt";
import type { AgentMatchJobResult } from "@/models/agent.model";

// The score and body come from the tool output, not from parsed prose — the
// match is a server-side generation, so the card cannot disagree with what
// was saved.
export function MatchJobResult({ output }: { output: AgentMatchJobResult }) {
  const tr = useT();

  if (output.status === "no_job") {
    return (
      <p className="text-sm">
        {tr("m97f42e6d2acb")}</p>
    );
  }

  if (output.status === "no_resumes") {
    return <NoResumesNotice />;
  }

  if (output.status === "needs_selection") {
    return (
      <ResumeSelectionPrompt
        prompt="Which resume should I match against?"
        resumes={output.resumes}
        messageFor={(title) => `Match this job against my resume "${title}"`}
      />
    );
  }

  if (output.status === "unreadable") {
    return (
      <p className="text-sm">
        {tr("m030e7186c3e4")}<strong>{output.title}</strong> — {output.reason}
      </p>
    );
  }

  if (output.status === "generation_failed") {
    return (
      <p className="text-sm">
        {tr("m8195e86b166a")}<strong>{output.jobTitle}</strong> — {output.reason}
      </p>
    );
  }

  return (
    <div className="text-sm">
      <AgentMatchContent body={output.body} scores={output.scores} />
      <p className="mt-2 text-xs text-muted-foreground">
        {output.jobTitle}
        {output.company ? tr("mff31d33ee656", {v0: output.company}) : ""} {tr("m495e29baabb0")}{" "}
        {output.resumeTitle}
      </p>
      {!output.saved && (
        <p className="mt-1 text-xs text-muted-foreground">
          {tr("m9b518edbec95")}{output.saveError}
        </p>
      )}
    </div>
  );
}
