"use client";

import {useT} from "@/i18n/useT";
import { Badge } from "@/components/ui/badge";
import { APP_CONSTANTS } from "@/lib/constants";
import type { PrerankComponents } from "@/models/ai.schemas";

interface PrerankBreakdownProps {
  prerankScore: number;
  components?: PrerankComponents;
}

// Surfaces the internal lexical pre-rank score next to the LLM match so the
// two can be compared for tuning. The lexical score is never an AI %.
export function PrerankBreakdown({
  prerankScore,
  components,
}: PrerankBreakdownProps) {
  const tr = useT();

  const rows = components
    ? [
        {
          label: tr("m7e8cd2056da7"),
          weight: APP_CONSTANTS.ATS_TITLE_WEIGHT,
          score: components.titleScore,
          hits: components.titleHits,
        },
        {
          label: tr("m8bfdb93cafaa"),
          weight: APP_CONSTANTS.ATS_SKILL_WEIGHT,
          score: components.keywordScore,
          hits: components.keywordHits,
        },
      ]
    : [];

  return (
    <div className="rounded-md border border-dashed p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{tr("m622e3e23084d")}</span>
        <span className="font-mono text-sm">
          {Math.round(prerankScore * 100)}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {tr("m9dbd1f6dc9bc")}</p>
      {rows.map((row) => (
        <div key={row.label} className="text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {row.label} <span className="opacity-60">(×{row.weight})</span>
            </span>
            <span className="font-mono">
              {row.score.toFixed(2)} → +
              {(row.score * row.weight * 100).toFixed(1)}%
            </span>
          </div>
          {row.hits.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {row.hits.map((hit) => (
                <Badge key={hit} variant="secondary" className="text-[10px]">
                  {hit}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
      {components && (
        <div className="text-xs text-muted-foreground">
          {tr("mbbdffe25dc7d")}{" "}
          {components.locScore > 0 ? tr("m06f9d729882e") : tr("m8c76ce5e65e7")}
        </div>
      )}
    </div>
  );
}
