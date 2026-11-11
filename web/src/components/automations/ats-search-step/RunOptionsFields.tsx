"use client";

import {useT} from "@/i18n/useT";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { APP_CONSTANTS } from "@/lib/constants";
import type { AtsConfigValue } from "./types";

interface RunOptionsFieldsProps {
  value: AtsConfigValue;
  onChange: (next: AtsConfigValue) => void;
}

export function RunOptionsFields({ value, onChange }: RunOptionsFieldsProps) {
  const tr = useT();

  return (
    <>
      <div className="space-y-2">
        <Label>
          {tr("m1c1527427892")}{value.topK ?? APP_CONSTANTS.MAX_JOBS_PER_RUN}
        </Label>
        <Slider
          min={1}
          max={APP_CONSTANTS.ATS_LISTING_CAP}
          step={1}
          value={[value.topK ?? APP_CONSTANTS.MAX_JOBS_PER_RUN]}
          onValueChange={(next) => onChange({ ...value, topK: next[0] })}
        />
        <p className="text-sm text-muted-foreground">
          {tr("m04498c1399a1")}</p>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-1">
          <Label>{tr("m4284d7b06579")}</Label>
          <p className="text-sm text-muted-foreground">
            {tr("md720fe3dd28e")}</p>
        </div>
        <Switch
          checked={value.saveUnanalyzed !== false}
          onCheckedChange={(checked) =>
            onChange({ ...value, saveUnanalyzed: checked })
          }
        />
      </div>
    </>
  );
}
