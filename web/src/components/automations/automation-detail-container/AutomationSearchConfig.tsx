"use client";

import {useT} from "@/i18n/useT";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobBoard, LeverSourceConfig } from "@/models/automation.model";
import { companyBoardUrl } from "@/lib/atsBoardUrl";
import { APP_CONSTANTS } from "@/lib/constants";

// Pure JSON parse (no runner dependency — this is a client component, and
// runner.ts pulls the network-calling scraper into the client bundle). The raw
// parse may be missing any field, so it's a Partial of the config shape.
function parseAtsConfig(
  sourceConfig: string | null | undefined,
  jobBoard: JobBoard,
): Partial<LeverSourceConfig> | null {
  if (!sourceConfig) return null;
  try {
    return JSON.parse(sourceConfig)?.[jobBoard] ?? null;
  } catch {
    return null;
  }
}

interface AutomationSearchConfigProps {
  sourceConfig: string | null | undefined;
  jobBoard: JobBoard;
  retired: boolean;
}

export function AutomationSearchConfig({
  sourceConfig,
  jobBoard,
  retired,
}: AutomationSearchConfigProps) {
  const tr = useT();

  const [showSearchConfig, setShowSearchConfig] = useState(false);

  const greenhouseConfig = retired
    ? null
    : parseAtsConfig(sourceConfig, jobBoard);

  if (!greenhouseConfig) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mt-4 -ms-2 text-muted-foreground"
        onClick={() => setShowSearchConfig((prev) => !prev)}
      >
        {showSearchConfig ? (
          <ChevronUp className="h-4 w-4 me-1" />
        ) : (
          <ChevronDown className="h-4 w-4 me-1" />
        )}
        {showSearchConfig ? tr("m94ea9b1d33a0") : tr("mf5c9bd131486")}
      </Button>

      {showSearchConfig && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-4">
            <p className="text-sm text-muted-foreground">{tr("m4923413b40d7")}</p>
            {greenhouseConfig.companies?.length ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {greenhouseConfig.companies.map((c) => (
                  <Badge key={c.token} variant="secondary" className="gap-1">
                    {c.name}
                    <a
                      href={companyBoardUrl(jobBoard, c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={tr("mbd2f0a833536", {v0: c.name})}
                      title={tr("m2381c715b663")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium">-</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("ma6038aca31c6")}</p>
            <p className="text-sm font-medium">
              {greenhouseConfig.targetTitles?.length
                ? greenhouseConfig.targetTitles.join(", ")
                : tr("m2b505597daa7")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m8bfdb93cafaa")}</p>
            <p className="text-sm font-medium">
              {greenhouseConfig.keywords?.length
                ? greenhouseConfig.keywords.join(", ")
                : tr("mdc937b598926")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m95c61170318a")}</p>
            <p className="text-sm font-medium">
              {greenhouseConfig.locations?.length
                ? `${greenhouseConfig.locations.join(", ")}${
                    greenhouseConfig.strictLocation ? " (strict)" : ""
                  }`
                : tr("mcaadb2786b37")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {tr("m0a7f27f90f16")}</p>
            <p className="text-sm font-medium">
              {greenhouseConfig.topK ?? APP_CONSTANTS.MAX_JOBS_PER_RUN}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tr("m83e86d827140")}</p>
            <p className="text-sm font-medium">
              {greenhouseConfig.saveUnanalyzed !== false
                ? tr("mb5c120b316c2")
                : tr("m22b3467c1ba9")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
