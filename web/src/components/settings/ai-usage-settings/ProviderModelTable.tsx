"use client";

import {useT} from "@/i18n/useT";
import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiUsageSummary } from "@/models/aiUsage.model";
import { formatSeconds, formatTokens, providerLabel } from "./format";

const NUM = "text-end tabular-nums";

export default function ProviderModelTable({
  providers,
}: Pick<AiUsageSummary, "providers">) {
  const tr = useT();

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const maxTokens = Math.max(1, ...providers.map((p) => p.tokens));
  const toggle = (provider: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
        <h2 className="text-[15px] font-semibold">{tr("m506d78acf9ba")}</h2>
        <span className="text-xs text-muted-foreground">
          {tr("mc014dafd319a")}</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="flex items-center gap-2.5 border-b px-5 py-2.5 text-xs font-medium text-muted-foreground">
            <span className="w-[204px]">{tr("m51686a90ea97")}</span>
            <span className="grow">{tr("ma86adb00560e")}</span>
            <span className={cn("w-16", NUM)}>{tr("ma039dfb9628b")}</span>
            <span className={cn("w-12", NUM)}>{tr("mb73a5e2ca645")}</span>
            <span className={cn("w-16", NUM)}>{tr("mdaab7c435134")}</span>
            <span className={cn("w-16", NUM)}>{tr("mf771f4d32eee")}</span>
            <span className={cn("w-20", NUM)}>{tr("m2b2cc212058b")}</span>
          </div>
          {providers.map((p) => {
            const open = !collapsed.has(p.provider);
            return (
              <div key={p.provider} className="border-b last:border-b-0">
                <div className="flex items-center gap-2.5 px-5 py-2.5 text-[13px]">
                  <button
                    type="button"
                    onClick={() => toggle(p.provider)}
                    aria-expanded={open}
                    className="flex w-[204px] items-center gap-2.5 text-start font-semibold"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform",
                        !open && "-rotate-90",
                      )}
                    />
                    {tr(providerLabel(p.provider))}
                  </button>
                  <span className="block h-1.5 grow overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-1.5 bg-blue-500"
                      style={{ width: `${(p.tokens / maxTokens) * 100}%` }}
                    />
                  </span>
                  <span className={cn("w-16 font-medium", NUM)}>
                    {formatTokens(p.tokens)}
                  </span>
                  <span className={cn("w-12 text-muted-foreground", NUM)}>
                    {p.calls.toLocaleString("en-US")}
                  </span>
                  <span className="w-16" />
                  <span className="w-16" />
                  <span className="w-20" />
                </div>
                {open &&
                  p.models.map((m) => (
                    <div
                      key={m.model}
                      className="flex items-center gap-2.5 pb-2.5 ps-11 pe-5 text-xs text-muted-foreground"
                    >
                      <span
                        className="w-[180px] truncate font-mono text-foreground/80"
                        title={m.model}
                      >
                        {m.model}
                      </span>
                      <span className="flex grow">
                        {m.nearContextLimit > 0 && (
                          <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-amber-100 px-2 text-[11px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {tr("m90e4ecbafeec", {v0: m.nearContextLimit, v1: m.nearContextLimit === 1 ? "call" : "calls"})}
                          </span>
                        )}
                      </span>
                      <span className={cn("w-16", NUM)}>
                        {formatTokens(m.tokens)}
                      </span>
                      <span className={cn("w-12", NUM)}>
                        {m.calls.toLocaleString("en-US")}
                      </span>
                      <span className={cn("w-16", NUM)}>
                        {formatSeconds(m.medianMs)}
                      </span>
                      <span className={cn("w-16", NUM)}>
                        {formatSeconds(m.p95Ms)}
                      </span>
                      <span className={cn("w-20", NUM)}>
                        {formatSeconds(m.medianFirstTokenMs)}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
