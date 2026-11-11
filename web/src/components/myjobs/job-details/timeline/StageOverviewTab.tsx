"use client";
import {useT} from "@/i18n/useT";
import { Clock, MapPin, Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STAGE_OUTCOMES } from "@/lib/constants";
import type { JobStage } from "@/models/jobStage.model";
import { isInterviewStage } from "./stageDisplay";
import { StageNotes } from "./StageNotes";

type StageOverviewTabProps = {
  stage: JobStage;
  onChanged: () => void;
};

function StageFact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon: LucideIcon;
}) {
  const tr = useT();

  return (
    <div>
      <span className="text-[11px] font-bold tracking-wide text-muted-foreground">
        {label}
      </span>
      <p className="mt-1.5 flex items-center gap-2 text-sm">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {value ?? <span className="text-muted-foreground">{tr("m4895f73177ab")}</span>}
      </p>
    </div>
  );
}

export function StageOverviewTab({ stage, onChanged }: StageOverviewTabProps) {
  const tr = useT();

  const outcomeLabel = STAGE_OUTCOMES.find(
    (o) => o.value === stage.outcome,
  )?.label;

  return (
    <div className="space-y-4">
      <div>
        <span className="text-[11px] font-bold tracking-wide text-muted-foreground">
          {tr("mbbb4fa4eb2ae")}</span>
        <p className="mt-1.5 text-sm">
          {outcomeLabel ? (
            <Badge variant="secondary">{outcomeLabel}</Badge>
          ) : (
            <span className="text-muted-foreground">{tr("mb37c7879f6c3")}</span>
          )}
        </p>
      </div>

      {isInterviewStage(stage) && (
        <div className="grid gap-4 @lg/timeline:grid-cols-3">
          <StageFact label={tr("mec4ecc14f8b5")} value={stage.location} icon={MapPin} />
          <StageFact label={tr("m795349a1babd")} value={stage.format} icon={Monitor} />
          <StageFact
            label={tr("mebd293e02c29")}
            value={stage.durationMins ? `${stage.durationMins} min` : null}
            icon={Clock}
          />
        </div>
      )}

      <StageNotes stage={stage} onChanged={onChanged} />
    </div>
  );
}
