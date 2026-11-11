"use client";

import {useT} from "@/i18n/useT";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DisclosureGroup,
  ROW,
  SelectRow,
  StepperRow,
} from "@/components/pdf-export/settings-rows";
import {
  formatSettingValue,
  PDF_FONT_LABELS,
} from "@/models/pdfExport.model";
import type {
  CoverLetterExportSettings,
  CoverLetterNumericSetting,
} from "@/models/coverLetterExport.model";

type CoverLetterSettingsPanelProps = {
  settings: CoverLetterExportSettings;
  onChange: (settings: CoverLetterExportSettings) => void;
  onReset?: () => void;
  isDefault?: boolean;
  /** False once the lookup has resolved and found no contact info. */
  hasLetterhead: boolean;
  headline: string;
  onHeadlineChange: (headline: string) => void;
};

const ID_PREFIX = "cover-letter-export";

export function CoverLetterSettingsPanel({
  settings,
  onChange,
  onReset,
  isDefault,
  hasLetterhead,
  headline,
  onHeadlineChange,
}: CoverLetterSettingsPanelProps) {
  const tr = useT();

  const setNumber = (field: CoverLetterNumericSetting) => (value: number) =>
    onChange({ ...settings, [field]: value });

  const typographySummary = [
    PDF_FONT_LABELS[settings.font],
    formatSettingValue("fontSize", settings.fontSize),
    tr("m7cf58a710a76", {v0: formatSettingValue("lineHeight", settings.lineHeight)}),
  ].join(" • ");

  const layoutSummary = [
    tr("m167a128a2d71", {v0: settings.marginVertical, v1: settings.marginHorizontal}),
    tr("m946796b88e5c", {v0: settings.paragraphSpacing}),
  ].join(" • ");

  return (
    <div className="flex flex-col gap-4">
      {hasLetterhead && (
        <DisclosureGroup
          title={tr("mcf9f77fb000e")}
          summary={headline.trim() || tr("m230d987225f7")}
        >
          <div className={ROW}>
            <Label
              htmlFor={`${ID_PREFIX}-headline`}
              className="cursor-pointer font-normal"
            >
              {tr("mc5f5a4c81575")}</Label>
            <Input
              id={`${ID_PREFIX}-headline`}
              value={headline}
              onChange={(event) => onHeadlineChange(event.target.value)}
              placeholder={tr("m210eb12744cf")}
              className="h-8 w-full text-sm"
            />
          </div>
        </DisclosureGroup>
      )}

      {/* No Template row: a cover letter has exactly one style. */}
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
          field="paragraphSpacing"
          value={settings.paragraphSpacing}
          onCommit={setNumber("paragraphSpacing")}
        />
      </DisclosureGroup>

      {/* A page with no name on it otherwise reads as a bug, and the fix is
          not discoverable from this dialog. */}
      {!hasLetterhead && (
        <p className="text-xs text-muted-foreground">
          {tr("m2b722e30b55d")}</p>
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
