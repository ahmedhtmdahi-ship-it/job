"use client";

import {message as uiMessage} from "@/i18n/message";
import { getToolName, type ToolUIPart } from "ai";
import { AgentStatusRow } from "@/components/agent/AgentStatusRow";

// Confirmation renders null for these states, so this is not redundant with
// it. On a local 8B, deciding on a tool call is the longest phase of a turn.
export function AgentToolRunningCard({ part }: { part: ToolUIPart }) {
  const toolName = getToolName(part);
  const label =
    toolName === "add_job"
      ? uiMessage("m942a3e7e4c1d")
      : toolName === "get_resume"
        ? uiMessage("mebe74a5d22bd")
        : toolName === "review_resume"
          ? uiMessage("m8eea83ed3e4b")
          : toolName === "match_job"
            ? uiMessage("m580b64576fe9")
            : toolName === "generate_cover_letter"
              ? uiMessage("m3e4dbd08728f")
              : "Working…";

  return <AgentStatusRow label={label} />;
}
