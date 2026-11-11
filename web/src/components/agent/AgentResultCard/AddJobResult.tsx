"use client";

import {useT} from "@/i18n/useT";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AgentAddJobResult } from "@/models/agent.model";

// Composed from the tool result's STRUCTURED fields, never from
// createJobFromNames' message string — that prose is MCP-facing protocol text
// naming update_job and allowDuplicate, tools this surface does not expose.
export function AddJobResult({
  output,
  input,
}: {
  output: AgentAddJobResult;
  input: Record<string, unknown>;
}) {
  const tr = useT();

  if (output.validationError) {
    return (
      <p className="text-sm">
        {tr("m56b498ac1619")}{" "}{output.displayError ?? output.validationError}
      </p>
    );
  }

  if (output.duplicateOf) {
    return (
      <div className="text-sm">
        <p>
          {tr("m3799de13d446")}{" "}<strong>{output.duplicateOf.title}</strong> {" "}{tr("mb1d6b91b67c2")}{" "}
          <strong>{output.duplicateOf.company}</strong>{tr("mfa7f9c3d2bf7")}</p>
        <Link
          className="text-xs underline"
          href={`/dashboard/myjobs/${output.duplicateOf.id}`}
        >
          {tr("m5a6751615c90")}</Link>
      </div>
    );
  }

  const newEntities = output.resolutions
    .filter((r) => r.created)
    .map((r) => r.label);
  const jobTitle = typeof input.jobTitle === "string" ? input.jobTitle : "job";
  const company = typeof input.company === "string" ? input.company : undefined;

  return (
    <div className="text-sm">
      <p>
        {tr("m6b02e0d363a4")}{" "}<strong>{jobTitle}</strong>
        {company ? tr("mff31d33ee656", {v0: company}) : ""}.
      </p>
      {output.jobId && (
        <Link
          className="text-xs underline"
          href={`/dashboard/myjobs/${output.jobId}`}
        >
          {tr("m3303aa8c09b2")}</Link>
      )}
      {newEntities.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {tr("m46dafc1f7af9")}{" "}{newEntities.join(", ")}
        </p>
      )}
      {output.descriptionChars !== undefined && (
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {tr("ma1f73d6fdb75")}{" "}
            {output.descriptionSource === "pasted"
              ? tr("m09d6f5da8c93")
              : tr("ma15633ecdebb")}{" "}
            · {output.descriptionChars} {" "}{tr("m1ce93dacbcf4")}</span>
          {output.descriptionCompleteness && (
            <Badge variant="outline">{output.descriptionCompleteness}</Badge>
          )}
        </p>
      )}
    </div>
  );
}
