"use client";

import {useT} from "@/i18n/useT";
type RecordsCountProps = {
  count: number;
  total?: number;
  label?: string;
};

export function RecordsCount({
  count,
  total,
  label = "records",
}: RecordsCountProps) {
  const tr = useT();

  return (
    <div className="text-xs text-muted-foreground whitespace-nowrap">
      {tr("md604310a789a")}{" "}<strong>{tr("mb6a286a95ade")}{" "}{count}</strong>
      {total !== undefined && (
        <>
          {" "}
          {tr("m28391d3bc64e")}<strong> {total}</strong>
        </>
      )}{" "}
      {label}
    </div>
  );
}
