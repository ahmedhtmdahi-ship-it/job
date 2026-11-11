"use client";

import {useT} from "@/i18n/useT";
import Link from "next/link";
import { AgentMarkdown } from "@/components/agent/AgentMarkdown";
import { NoResumesNotice } from "@/components/agent/AgentResultCard/NoResumesNotice";
import { ResumeSelectionPrompt } from "@/components/agent/AgentResultCard/ResumeSelectionPrompt";
import type { AgentCoverLetterResult } from "@/models/agent.model";

// The letter comes from the tool output, not from the streamed text: the
// stream is a progress indicator and the output is what was saved.
export function CoverLetterResult({ output }: { output: AgentCoverLetterResult }) {
  const tr = useT();

  if (output.status === "no_job") {
    return (
      <p className="text-sm">
        {tr("m9b4657b94cb7")}</p>
    );
  }

  if (output.status === "no_description") {
    return (
      <p className="text-sm">
        <strong>{output.jobTitle}</strong> {tr("m63c8858105c6")}</p>
    );
  }

  if (output.status === "no_resumes") {
    return <NoResumesNotice />;
  }

  if (output.status === "needs_selection") {
    return (
      <ResumeSelectionPrompt
        prompt={tr("mf46de24bdfa1")}
        resumes={output.resumes}
        messageFor={(title) =>
          `Write a cover letter for this job using my resume "${title}"`
        }
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
        {tr("m773f2e89eb81")}<strong>{output.jobTitle}</strong> —{" "}
        {output.reason}
      </p>
    );
  }

  return (
    <div className="text-sm">
      <AgentMarkdown text={output.body} />
      <p className="mt-2 text-xs text-muted-foreground">
        {output.jobTitle}
        {output.company ? tr("mff31d33ee656", {v0: output.company}) : ""} {tr("mf68cf7c70208")}{" "}
        {output.resumeTitle}
      </p>
      {output.saved ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {tr("me015e8849283")}{output.coverLetterTitle}” —{" "}
          <Link href="/dashboard/profile" className="underline">
            {tr("mfa012981e937")}</Link>
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          {tr("mc98b88a1fb69")}{output.saveError}
        </p>
      )}
    </div>
  );
}
