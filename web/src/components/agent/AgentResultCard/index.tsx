"use client";

import {useT} from "@/i18n/useT";
import { getToolName, type ToolUIPart } from "ai";
import { AddJobResult } from "./AddJobResult";
import { GetResumeResult } from "./GetResumeResult";
import { ReviewResumeResult } from "./ReviewResumeResult";
import { MatchJobResult } from "./MatchJobResult";
import { CoverLetterResult } from "./CoverLetterResult";
import type {
  AgentAddJobResult,
  AgentCoverLetterResult,
  AgentGetResumeResult,
  AgentMatchJobResult,
  AgentReviewResumeResult,
} from "@/models/agent.model";

export function AgentResultCard({ part }: { part: ToolUIPart }) {
  const tr = useT();

  if (part.state === "output-denied") {
    return (
      <div className="rounded-sm border p-3 text-sm text-muted-foreground">
        {tr("m7e3abff3aae4")}</div>
    );
  }

  if (part.state === "output-error") {
    return (
      <div className="rounded-sm border p-3 text-sm">
        {tr("me48f639e5740")}</div>
    );
  }

  if (part.state !== "output-available") return null;

  const toolName = getToolName(part);
  const body =
    toolName === "add_job" ? (
      <AddJobResult
        output={part.output as AgentAddJobResult}
        input={(part.input ?? {}) as Record<string, unknown>}
      />
    ) : toolName === "get_resume" ? (
      <GetResumeResult output={part.output as AgentGetResumeResult} />
    ) : toolName === "review_resume" ? (
      <ReviewResumeResult output={part.output as AgentReviewResumeResult} />
    ) : toolName === "match_job" ? (
      <MatchJobResult output={part.output as AgentMatchJobResult} />
    ) : toolName === "generate_cover_letter" ? (
      <CoverLetterResult output={part.output as AgentCoverLetterResult} />
    ) : null;

  return <div className="rounded-sm border p-3">{body}</div>;
}
