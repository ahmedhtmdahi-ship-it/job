"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useTransition } from "react";
import { Check, Loader, X } from "lucide-react";
import type { ImportCardPayload } from "@/actions/resumeImport.actions";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import type { PendingCard } from "./pendingCards";

function cardSectionLabel(type: ImportCardPayload["type"]): string {
  const map: Record<string, string> = {
    contactInfo: uiMessage("mfcf1b494db06"),
    summary: uiMessage("m8e76a94ac832"),
    experience: uiMessage("m8eab0f09df01"),
    education: uiMessage("m512ab3c6b986"),
    certification: uiMessage("m86846f67dd19"),
    skills: uiMessage("m66d0f523a379"),
  };
  return map[type] ?? type;
}

function DetailRow({ label, value }: { label: string; value?: unknown }) {
  // Streaming partials can momentarily emit a non-string (e.g. {}) for a field
  // before it resolves — never hand a non-primitive to React.
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (value === "") return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-foreground break-words min-w-0">{value}</span>
    </div>
  );
}

function PendingCardDetail({ card }: { card: ImportCardPayload }) {
  const tr = useT();

  if (card.type === "contactInfo") {
    const d = card.data;
    const name = `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
    return (
      <div className="space-y-1 mt-1">
        {name && <DetailRow label={tr("mdcd1d5223f73")} value={name} />}
        <DetailRow label={tr("mc5f5a4c81575")} value={d.headline} />
        <DetailRow label={tr("m969ccbd3cf63")} value={d.email} />
        <DetailRow label={tr("m63dceb8800b2")} value={d.phone} />
        <DetailRow label={tr("m56ef8f20955f")} value={d.address} />
      </div>
    );
  }

  if (card.type === "summary") {
    return (
      <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">
        {card.data}
      </p>
    );
  }

  if (card.type === "experience") {
    const d = card.data;
    const dates = [d.startDate, d.endDate].filter(Boolean).join(" – ");
    return (
      <div className="space-y-1 mt-1">
        <DetailRow label={tr("m7e8cd2056da7")} value={d.jobTitle} />
        <DetailRow label={tr("mde4743c87973")} value={d.company} />
        <DetailRow label={tr("m15b61974b270")} value={d.location} />
        {dates && <DetailRow label={tr("m78963905f399")} value={dates} />}
        {typeof d.description === "string" && d.description && (
          <p className="text-xs text-foreground mt-1 whitespace-pre-wrap ps-[5.5rem]">
            {d.description}
          </p>
        )}
      </div>
    );
  }

  if (card.type === "education") {
    const d = card.data;
    const dates = [d.startDate, d.endDate].filter(Boolean).join(" – ");
    return (
      <div className="space-y-1 mt-1">
        <DetailRow label={tr("m65a1553729e3")} value={d.institution} />
        <DetailRow label={tr("m719738a85289")} value={d.degree} />
        <DetailRow label={tr("mf45fc1dfdc96")} value={d.fieldOfStudy} />
        <DetailRow label={tr("m15b61974b270")} value={d.location} />
        {dates && <DetailRow label={tr("m78963905f399")} value={dates} />}
        {typeof d.description === "string" && d.description && (
          <p className="text-xs text-foreground mt-1 whitespace-pre-wrap ps-[5.5rem]">
            {d.description}
          </p>
        )}
      </div>
    );
  }

  if (card.type === "certification") {
    const d = card.data;
    return (
      <div className="space-y-1 mt-1">
        <DetailRow label={tr("m7e8cd2056da7")} value={d.title} />
        <DetailRow label={tr("m39e02c46a083")} value={d.organization} />
        <DetailRow label={tr("m0221e4875188")} value={d.issueDate} />
        <DetailRow label={tr("mf6725f3af08a")} value={d.expirationDate} />
        <DetailRow label={tr("me7a241debad5")} value={d.credentialUrl} />
      </div>
    );
  }

  if (card.type === "skills") {
    const categories = card.data.categories ?? [];
    return (
      <div className="space-y-2 mt-1">
        {categories.map((cat, i) => {
          const skills = (cat.skills ?? []).filter(
            (s): s is string => typeof s === "string" && !!s.trim(),
          );
          if (skills.length === 0) return null;
          return (
            <div key={i} className="space-y-1">
              {typeof cat.label === "string" && cat.label && (
                <span className="text-xs font-medium text-muted-foreground">
                  {cat.label}
                </span>
              )}
              <div className="flex flex-wrap gap-1">
                {skills.map((skill, j) => (
                  <Badge key={j} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

// Individual pending card row
export function PendingCardRow({
  pending,
  onAccept,
  onDiscard,
  locked,
}: {
  pending: PendingCard;
  onAccept: (id: string) => void;
  onDiscard: (id: string) => void;
  locked?: boolean;
}) {
  const tr = useT();

  const [isSaving, startSaving] = useTransition();

  return (
    <div className="border border-dashed rounded-md px-4 py-3 bg-muted/30">
      <div className="flex items-start justify-between gap-4">
        <Badge variant="outline" className="text-xs shrink-0">
          {cardSectionLabel(pending.card.type)}
        </Badge>
        <div className="flex items-center gap-1 shrink-0 ms-auto">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={isSaving || locked}
            onClick={() =>
              startSaving(async () => {
                await onAccept(pending.id);
              })
            }
          >
            {isSaving ? (
              <Loader className="h-3 w-3 spinner" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            <span className="ms-1">{tr("m89713b9c9c1b")}</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground"
            disabled={isSaving || locked}
            onClick={() => onDiscard(pending.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <PendingCardDetail card={pending.card} />
    </div>
  );
}
