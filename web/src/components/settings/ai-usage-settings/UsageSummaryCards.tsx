import {useT} from "@/i18n/useT";
import { cn } from "@/lib/utils";
import type { AiUsageSummary } from "@/models/aiUsage.model";
import { formatChange, formatSeconds, formatTokens } from "./format";

function StatCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border px-5 py-4">
      <div className="text-[13px] font-medium text-muted-foreground">
        {label}
      </div>
      <div className="text-[26px] font-semibold tracking-tight">{value}</div>
      {children}
    </div>
  );
}

export default function UsageSummaryCards({
  totals,
  failuresByStatus,
  rangeDays,
  onShowFailures,
}: Pick<AiUsageSummary, "totals" | "failuresByStatus" | "rangeDays"> & {
  onShowFailures: () => void;
}) {
  const tr = useT();

  const change = formatChange(totals.calls, totals.previousCalls);
  const errorRate =
    totals.calls === 0 ? 0 : (totals.failures / totals.calls) * 100;
  const f = failuresByStatus;
  return (
    <div className="grid grid-cols-1 gap-4 @xl/ai-usage:grid-cols-2 @3xl/ai-usage:grid-cols-4">
      <StatCard
        label={tr("me7601ca1178a")}
        value={formatTokens(totals.inputTokens + totals.outputTokens)}
      >
        <div className="text-xs text-muted-foreground">
          {tr("mf05d5c2b9e1a", {v0: (totals.inputTokens / 1_000_000).toFixed(2), v1: (totals.outputTokens / 1_000_000).toFixed(2)})}
        </div>
      </StatCard>
      <StatCard label={tr("m3edcdf922e24")} value={totals.calls.toLocaleString("en-US")}>
        {change && (
          <div
            className={cn(
              "text-xs",
              change.up
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground",
            )}
          >
            {tr("m10376afa1d27", {v0: change.text, v1: rangeDays})}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {tr("m03bd66330e28")}</div>
      </StatCard>
      <StatCard
        label={tr("m320bffaa9ffc")}
        value={formatSeconds(totals.medianMs)}
      >
        <div className="text-xs text-muted-foreground">
          {tr("mdac0fdd3fc1b", {v0: formatSeconds(totals.p95Ms)})}
        </div>
        <div className="text-xs text-muted-foreground">
          {tr("mf8374e11e292", {v0: formatSeconds(totals.medianFirstTokenMs)})}
        </div>
      </StatCard>
      <StatCard
        label={tr("m7d047f1cf121")}
        value={totals.failures.toLocaleString("en-US")}
      >
        <div className="text-xs text-muted-foreground">
          {tr("m8962dd45d311", {v0: errorRate.toFixed(1)})}
        </div>
        <button
          type="button"
          onClick={onShowFailures}
          className="w-fit text-start text-xs text-primary hover:underline"
        >
          {tr("mb2fb3bb461a3", {v0: f.error, v1: f.truncated, v2: f.interrupted, v3: f.timed_out})}
        </button>
      </StatCard>
    </div>
  );
}
