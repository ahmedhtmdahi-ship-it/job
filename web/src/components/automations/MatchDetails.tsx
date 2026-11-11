"use client";

import {useT} from "@/i18n/useT";
import { useMemo } from "react";
import Link from "next/link";
import MarkdownIt from "markdown-it";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TipTapContentViewer } from "@/components/TipTapContentViewer";
import type { JobMatchData } from "@/models/ai.schemas";

// html:false escapes any raw HTML in the model output; TipTapContentViewer
// further strips unrecognized tags, so the rendered analysis is safe.
const md = new MarkdownIt({ html: false, linkify: false, breaks: true });

// Legacy matches saved before the markdown refactor have a structured `summary`
// instead of a `body`. Show what we can rather than rendering blank.
interface LegacyMatchData {
  summary?: string;
}

interface MatchDetailsProps {
  matchData: (JobMatchData & LegacyMatchData) | null;
  discoveredAt?: Date;
}

export function MatchDetails({ matchData, discoveredAt }: MatchDetailsProps) {
  const tr = useT();

  const html = useMemo(
    () => (matchData?.body ? md.render(matchData.body) : ""),
    [matchData?.body],
  );

  if (!matchData) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {matchData.recommendation && (
          <Badge variant="outline" className="capitalize">
            {matchData.recommendation}
          </Badge>
        )}
        {matchData.descriptionCompleteness &&
          matchData.descriptionCompleteness !== "full" && (
            <Badge
              variant="secondary"
              title={tr("mfde6d6b89d83")}
            >
              {tr("m50bfcc6e89c6")}</Badge>
          )}
      </div>

      {html ? (
        <div className="text-sm leading-relaxed [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_h2]:mt-4 [&_h2]:font-semibold">
          <TipTapContentViewer content={html} />
        </div>
      ) : matchData.summary ? (
        <div className="space-y-2">
          <p className="text-sm">{matchData.summary}</p>
          <p className="text-xs text-muted-foreground italic">
            {tr("mdd35de95767f")}</p>
        </div>
      ) : null}

      <div className="text-xs text-muted-foreground space-y-1">
        {matchData.resumeTitle && (
          <p>
            {tr("m22bbb83a31df")}{" "}
            {matchData.resumeId ? (
              <Link
                href={`/dashboard/profile/resume/${matchData.resumeId}`}
                className="font-medium underline hover:text-foreground"
              >
                {matchData.resumeTitle}
              </Link>
            ) : (
              <span className="font-medium">{matchData.resumeTitle}</span>
            )}
          </p>
        )}
        {matchData.provider && (
          <p>
            {tr("m11a931060dad")}{" "}
            <span className="font-medium">
              {matchData.provider}
              {matchData.model ? ` / ${matchData.model}` : ""}
            </span>
          </p>
        )}
        <p>
          {matchData.matchedAt
            ? tr("m54ced5722fe2", {v0: format(new Date(matchData.matchedAt), "MMM d, yyyy 'at' h:mm a")})
            : discoveredAt
              ? tr("m3554f6a1ea7b", {v0: format(new Date(discoveredAt), "MMM d, yyyy 'at' h:mm a")})
              : null}
        </p>
      </div>
    </div>
  );
}
