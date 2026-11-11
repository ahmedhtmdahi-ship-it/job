"use client";

import {useT} from "@/i18n/useT";
import { APP_CONSTANTS } from "@/lib/constants";
import type { CreateAutomationInput } from "@/models/automation.schema";
import type { AtsConfigValue } from "../AtsSearchStep";
import type { WizardResume } from "./wizardConfig";

export function StepReview({
  formValues,
  atsConfig,
  selectedResume,
}: {
  formValues: CreateAutomationInput;
  atsConfig: AtsConfigValue;
  selectedResume?: WizardResume;
}) {
  const tr = useT();

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tr("mdcd1d5223f73")}</span>
        <span className="font-medium">{formValues.name || "-"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tr("m63d96480f475")}</span>
        <span className="font-medium capitalize">
          {formValues.jobBoard || "-"}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{tr("m4923413b40d7")}</span>
        <span className="font-medium text-end">
          {atsConfig.companies?.length
            ? atsConfig.companies.map((c) => c.name).join(", ")
            : "-"}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{tr("ma6038aca31c6")}</span>
        <span className="font-medium text-end">
          {atsConfig.targetTitles?.length
            ? atsConfig.targetTitles.join(", ")
            : tr("m2b505597daa7")}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{tr("m95c61170318a")}</span>
        <span className="font-medium text-end">
          {atsConfig.locations?.length
            ? `${atsConfig.locations.join(", ")}${
                atsConfig.strictLocation ? " (strict)" : ""
              }`
            : tr("mcaadb2786b37")}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{tr("m0a7f27f90f16")}</span>
        <span className="font-medium text-end">
          {atsConfig.topK ?? APP_CONSTANTS.MAX_JOBS_PER_RUN}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{tr("m3625c3b7e59a")}</span>
        <span className="font-medium text-end">
          {atsConfig.saveUnanalyzed !== false ? tr("m85a39ab345d6") : tr("m1ea442a134b2")}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tr("md640c7421da0")}</span>
        <span className="font-medium">
          {selectedResume?.title || tr("mdf12aeba9bb9")}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tr("mfd706e4ebf0b")}</span>
        <span className="font-medium">{formValues.matchThreshold ?? 80}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tr("mf4830a1dae29")}</span>
        <span className="font-medium">
          {tr("m7dee76af685d")}{" "}
          {(formValues.scheduleHour ?? 8).toString().padStart(2, "0")}:00
        </span>
      </div>
    </div>
  );
}
