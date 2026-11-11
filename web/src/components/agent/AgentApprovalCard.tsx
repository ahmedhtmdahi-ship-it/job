"use client";

import {useT} from "@/i18n/useT";
import { useEffect, useRef, useState } from "react";
import { getToolName, type ToolUIPart } from "ai";
import {
  Confirmation,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRequest,
} from "@/components/ai-elements/confirmation";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { classifyDescriptionCompleteness } from "@/lib/jobs/descriptionCompleteness";

type Respond = (r: { id: string; approved: boolean; reason?: string }) => void;

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {/* Text, never an anchor: this value came from an attacker-authorable
          posting by way of the model. */}
      <span className="break-words">{value}</span>
    </div>
  );
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function AddJobBody({
  input,
  pastedText,
}: {
  input: Record<string, unknown>;
  pastedText?: string;
}) {
  const tr = useT();

  const description = pastedText ?? text(input.jobDescription);
  const source = pastedText ? "pasted verbatim" : "model-supplied";
  const completeness = description
    ? classifyDescriptionCompleteness(description)
    : undefined;
  const tags = Array.isArray(input.tags) ? input.tags.join(", ") : undefined;

  return (
    <div>
      <Row label={tr("mde4743c87973")} value={text(input.company)} />
      <Row label={tr("m86db80a8096b")} value={text(input.jobTitle)} />
      <Row label={tr("m15b61974b270")} value={text(input.location)} />
      <Row label={tr("m0e570ca6fabe")} value={text(input.source)} />
      <Row label={tr("me7a241debad5")} value={text(input.jobUrl)} />
      <Row label={tr("m888b94f3307d")} value={text(input.salaryRange)} />
      <Row label={tr("m1331275bc537")} value={tags} />
      {description ? (
        <div className="mt-2 rounded-sm border bg-muted/20 p-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {tr("ma1f73d6fdb75")}{" "}{source} · {description.length} {" "}{tr("m1ce93dacbcf4")}</span>
            {completeness && <Badge variant="outline">{completeness}</Badge>}
          </div>
          {/* Collapsed to ~200 chars: this is verbatim third-party content
              the model did not author, so it is the least interesting thing
              on the card, and a 6KB block would push Confirm below the fold. */}
          <p className="mt-1 line-clamp-3 text-xs">
            {description.slice(0, 200)}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {tr("mdaddc7d47a4b")}</p>
      )}
    </div>
  );
}

export function AgentApprovalCard({
  part,
  pastedText,
  onRespond,
}: {
  part: ToolUIPart;
  pastedText?: string;
  onRespond: Respond;
}) {
  const tr = useT();

  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  // A blocking decision: focus moves here when it appears.
  useEffect(() => {
    if (part.state === "approval-requested") cardRef.current?.focus();
  }, [part.state]);

  if (part.state !== "approval-requested" && part.state !== "approval-responded")
    return null;

  const approvalId = part.approval?.id;
  const toolName = getToolName(part);
  const input = (part.input ?? {}) as Record<string, unknown>;

  const body = (() => {
    switch (toolName) {
      case "add_job":
        return <AddJobBody input={input} pastedText={pastedText} />;
      default:
        return null;
    }
  })();

  return (
    <Confirmation
      ref={cardRef}
      tabIndex={-1}
      approval={part.approval}
      state={part.state}
      className="rounded-sm p-3 outline-hidden"
    >
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{tr("mdb0e960b68b5")}</Badge>
        <span className="text-sm font-semibold">{toolName}</span>
      </div>

      {body}

      {part.state === "approval-responded" && (
        <p className="text-xs text-muted-foreground">{tr("m612ffc5ce9d4")}</p>
      )}

      <ConfirmationRequest>
        {declining && (
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={tr("m55f313af1016")}
              rows={2}
            />
            <div className="flex gap-2">
              <ConfirmationAction
                onClick={() =>
                  approvalId &&
                  onRespond({ id: approvalId, approved: false, reason })
                }
              >
                {tr("mf6f4688ff23d")}</ConfirmationAction>
              <ConfirmationAction
                variant="ghost"
                onClick={() =>
                  approvalId && onRespond({ id: approvalId, approved: false })
                }
              >
                {tr("m28d03596d24e")}</ConfirmationAction>
            </div>
          </div>
        )}
      </ConfirmationRequest>

      {!declining && (
        <ConfirmationActions>
          <ConfirmationAction
            onClick={() =>
              approvalId && onRespond({ id: approvalId, approved: true })
            }
          >
            {tr("meebdd24a77d9")}</ConfirmationAction>
          {/* Client-side and always available — it must not depend on a
              server round-trip succeeding. */}
          <ConfirmationAction variant="outline" onClick={() => setDeclining(true)}>
            {tr("m19766ed6ccb2")}</ConfirmationAction>
        </ConfirmationActions>
      )}
    </Confirmation>
  );
}
