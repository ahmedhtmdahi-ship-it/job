"use client";

import {useDateFormat} from "@/i18n/useDateFormat";
import {useT} from "@/i18n/useT";
import { useMemo, useState } from "react";
import MarkdownIt from "markdown-it";
import { format } from "date-fns";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BADGE_COLORS } from "@/lib/badge-colors";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TipTapContentViewer } from "@/components/TipTapContentViewer";
import { AgentReviewScoreCard } from "@/components/agent/AgentReviewScoreCard";
import type { ResumeReviewData } from "@/models/ai.schemas";

// html:false escapes any raw HTML in the model output; TipTapContentViewer
// further strips unrecognized tags, so the rendered review is safe.
const md = new MarkdownIt({ html: false, linkify: false, breaks: true });

interface ReviewDetailsProps {
  reviewData: ResumeReviewData | null;
}

export function ReviewDetails({ reviewData }: ReviewDetailsProps) {
  const formatLocalized = useDateFormat();

  const tr = useT();

  const [expanded, setExpanded] = useState(false);
  const html = useMemo(
    () => (reviewData?.body ? md.render(reviewData.body) : ""),
    [reviewData?.body],
  );

  if (!reviewData) return null;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="space-y-3">
        <AgentReviewScoreCard scores={reviewData} size={130} />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {reviewData.reviewedAt ? (
            <span>
              {tr("m5a5f02c1b10c")}{" "}
              {formatLocalized(
                new Date(reviewData.reviewedAt),
                "MMM d, yyyy 'at' h:mm a",
              )}
            </span>
          ) : null}
          {reviewData.provider === "mcp"
            ? reviewData.model && (
                <Badge
                  variant="outline"
                  className={cn("gap-1", BADGE_COLORS.violet)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {tr("m4d327af41f96")}{" "}{reviewData.model}
                </Badge>
              )
            : reviewData.provider
              ? tr("md2c992b0c361", {v0: reviewData.provider, v1: reviewData.model ? ` / ${reviewData.model}` : ""})
              : null}
        </div>
      </div>

      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
          {expanded ? tr("me30aedf1487b") : tr("m9a93acec2b4a")}
          <ChevronDown
            className={`ms-1 h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {html && (
          <div className="mt-3 text-sm leading-relaxed [&_p]:mt-2 [&_ul]:mt-2 [&_ol]:mt-2 [&_h2]:mt-4 [&_h2]:font-semibold">
            <TipTapContentViewer content={html} />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
