"use client";

import {useT} from "@/i18n/useT";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InterviewFilterOption } from "@/models/interview.model";

// Select cannot hold an empty-string value, so all-of-them gets a sentinel
const ALL = "all";

type Props = {
  rounds: InterviewFilterOption[];
  companies: InterviewFilterOption[];
  stageTypeId?: string;
  companyId?: string;
  onRoundChange: (id?: string) => void;
  onCompanyChange: (id?: string) => void;
};

export function InterviewFilters({
  rounds,
  companies,
  stageTypeId,
  companyId,
  onRoundChange,
  onCompanyChange,
}: Props) {
  const tr = useT();

  return (
    <>
      <Select
        value={stageTypeId ?? ALL}
        onValueChange={(v) => onRoundChange(v === ALL ? undefined : v)}
      >
        <SelectTrigger aria-label={tr("m0921229d8330")} className="h-8 w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{tr("m3d917f8977d5")}</SelectItem>
          {rounds.map((round) => (
            <SelectItem key={round.id} value={round.id}>
              {round.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={companyId ?? ALL}
        onValueChange={(v) => onCompanyChange(v === ALL ? undefined : v)}
      >
        <SelectTrigger aria-label={tr("m749952afe989")} className="h-8 w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{tr("m39b460136cb9")}</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
