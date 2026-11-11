"use client";

import {useT} from "@/i18n/useT";
import { Button } from "@/components/ui/button";
import {
  DisclosureGroup,
  ROW,
  SelectRow,
  StepperRow,
} from "@/components/pdf-export/settings-rows";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  formatSettingValue,
  PDF_FONT_LABELS,
} from "@/models/pdfExport.model";
import {
  RESUME_LAYOUT_LABELS,
  type ResumeExportSettings,
  type ResumeNumericSetting,
} from "@/models/resumeExport.model";

type ExportSettingsPanelProps = {
  settings: ResumeExportSettings;
  onChange: (settings: ResumeExportSettings) => void;
  onReset?: () => void;
  isDefault?: boolean;
  // Hides the Footer group: a one-page resume prints no page number.
  singlePage?: boolean;
};

const ID_PREFIX = "resume-export";

export function ExportSettingsPanel({
  settings,
  onChange,
  onReset,
  isDefault,
  singlePage,
}: ExportSettingsPanelProps) {
  const tr = useT();

  const setNumber = (field: ResumeNumericSetting) => (value: number) =>
    onChange({ ...settings, [field]: value });

  const typographySummary = [
    PDF_FONT_LABELS[settings.font],
    formatSettingValue("fontSize", settings.fontSize),
    `${formatSettingValue("lineHeight", settings.lineHeight)} line`,
  ].join(" • ");

  const layoutSummary = [
    `${settings.marginVertical} × ${settings.marginHorizontal} pt margins`,
    `${settings.sectionSpacing}/${settings.entrySpacing} pt spacing`,
  ].join(" • ");

  return (
    <div className="flex flex-col gap-4">
      {/* Template reshapes everything below it, so it never folds away. */}
      <div className="rounded-lg border bg-muted/40">
        <SelectRow
          id={`${ID_PREFIX}-template`}
          label={tr("m0575f29df888")}
          value={settings.template}
          labels={RESUME_LAYOUT_LABELS}
          onSelect={(template) => onChange({ ...settings, template })}
        />
      </div>

      <DisclosureGroup title={tr("mcab94aba84f9")} summary={typographySummary}>
        <SelectRow
          id={`${ID_PREFIX}-font`}
          label={tr("m64d0b3adcd2d")}
          value={settings.font}
          labels={PDF_FONT_LABELS}
          onSelect={(font) => onChange({ ...settings, font })}
        />
        <StepperRow
          idPrefix={ID_PREFIX}
          field="fontSize"
          value={settings.fontSize}
          onCommit={setNumber("fontSize")}
        />
        <StepperRow
          idPrefix={ID_PREFIX}
          field="lineHeight"
          value={settings.lineHeight}
          onCommit={setNumber("lineHeight")}
        />
      </DisclosureGroup>

      <DisclosureGroup title={tr("ma511909161e1")} summary={layoutSummary}>
        <StepperRow
          idPrefix={ID_PREFIX}
          field="marginVertical"
          value={settings.marginVertical}
          onCommit={setNumber("marginVertical")}
        />
        <StepperRow
          idPrefix={ID_PREFIX}
          field="marginHorizontal"
          value={settings.marginHorizontal}
          onCommit={setNumber("marginHorizontal")}
        />
        <StepperRow
          idPrefix={ID_PREFIX}
          field="sectionSpacing"
          value={settings.sectionSpacing}
          onCommit={setNumber("sectionSpacing")}
        />
        <StepperRow
          idPrefix={ID_PREFIX}
          field="entrySpacing"
          value={settings.entrySpacing}
          onCommit={setNumber("entrySpacing")}
        />
      </DisclosureGroup>

      {/* Its only option does nothing on a one-page resume. */}
      {!singlePage && (
        <DisclosureGroup
          title={tr("m26c87bb51e69")}
          summary={`Page numbers ${settings.showPageNumbers ? "on" : "off"}`}
        >
          <div className={ROW}>
            <Label
              htmlFor={`${ID_PREFIX}-showPageNumbers`}
              className="cursor-pointer font-normal"
            >
              {tr("m0ce9b4c8d0a0")}</Label>
            <Switch
              id={`${ID_PREFIX}-showPageNumbers`}
              className="ms-auto"
              checked={settings.showPageNumbers}
              onCheckedChange={(showPageNumbers) =>
                onChange({ ...settings, showPageNumbers })
              }
            />
          </div>
        </DisclosureGroup>
      )}

      {onReset && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isDefault}
          >
            {tr("me240e635ff6d")}</Button>
        </div>
      )}
    </div>
  );
}
