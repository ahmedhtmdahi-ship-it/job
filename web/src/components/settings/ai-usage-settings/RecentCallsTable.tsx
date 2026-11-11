import {useT} from "@/i18n/useT";
import { cn } from "@/lib/utils";
import { AI_USAGE_CONSTANTS } from "@/lib/constants";
import { AI_USAGE_FEATURES, type AiCallRow } from "@/models/aiUsage.model";
import {
  STATUS_META,
  formatCallTime,
  formatCount,
  formatSeconds,
} from "./format";

const NUM = "text-end tabular-nums";

export default function RecentCallsTable({ recent }: { recent: AiCallRow[] }) {
  const tr = useT();

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="text-[15px] font-semibold">{tr("m22d1f21edfc3")}</h2>
        <span className="text-xs text-muted-foreground">
          {tr("m8c192d3449d2", {v0: AI_USAGE_CONSTANTS.RECENT_LIMIT, v1: AI_USAGE_CONSTANTS.RETENTION_DAYS})}
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="flex items-center gap-3 border-b px-5 py-2.5 text-xs font-medium text-muted-foreground">
            <span className="w-[104px]">{tr("m33b93476cf59")}</span>
            <span className="w-[110px]">{tr("m3d377ae910dc")}</span>
            <span className="grow">{tr("m5e2c614c23f0")}</span>
            <span className={cn("w-[60px]", NUM)}>{tr("m36ecb4f86691")}</span>
            <span className={cn("w-[60px]", NUM)}>{tr("mb2439bcb8dee")}</span>
            <span className={cn("w-[68px]", NUM)}>{tr("m4fc52a3c4c55")}</span>
            <span className={cn("w-20", NUM)}>{tr("m2b2cc212058b")}</span>
            <span className="w-24 text-end">{tr("m920e413c7d41")}</span>
          </div>
          {recent.map((r) => {
            const status = STATUS_META[r.status];
            return (
              <div
                key={r.id}
                className="flex h-10 items-center gap-3 border-b px-5 text-[13px] last:border-b-0"
              >
                <span className="w-[104px] tabular-nums text-muted-foreground">
                  {formatCallTime(new Date(r.startedAt))}
                </span>
                <span className="w-[110px]">
                  {AI_USAGE_FEATURES[r.feature] ?? r.feature}
                </span>
                <span
                  className="grow truncate font-mono text-xs text-foreground/80"
                  title={r.model}
                >
                  {r.model}
                </span>
                <span className={cn("w-[60px]", NUM)}>
                  {formatCount(r.inputTokens)}
                </span>
                <span className={cn("w-[60px]", NUM)}>
                  {formatCount(r.outputTokens)}
                </span>
                <span className={cn("w-[68px]", NUM)}>
                  {formatSeconds(r.durationMs)}
                </span>
                <span className={cn("w-20 text-muted-foreground", NUM)}>
                  {formatSeconds(r.firstTokenMs)}
                </span>
                <span className="flex w-24 justify-end">
                  <span
                    className={cn(
                      "inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-medium",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
