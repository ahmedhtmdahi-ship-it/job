"use client";

import {useT} from "@/i18n/useT";
import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  setCompanyWatched,
  watchBoardCompany,
} from "@/actions/company.actions";
import { companyBoardUrl } from "@/lib/atsBoardUrl";
import { toastError, toastSuccess } from "@/lib/toast";
import { PROVIDER_META } from "@/components/automations/ats-search-step/types";
import type { JobBoard, LeverCompany } from "@/models/automation.model";
import type { PendingMerge } from "./WatchMergeDialog";

type BoardsTableProps = {
  provider: JobBoard;
  rows: LeverCompany[];
  watchedMap: Map<string, string>;
  onWatched: (token: string, companyId: string) => void;
  onUnwatched: (token: string) => void;
  onNeedsMerge: (pending: PendingMerge) => void;
};

function BoardsTable({
  provider,
  rows,
  watchedMap,
  onWatched,
  onUnwatched,
  onNeedsMerge,
}: BoardsTableProps) {
  const tr = useT();

  const [busy, setBusy] = useState<string | null>(null);

  const watch = async (row: LeverCompany) => {
    setBusy(row.token);
    // Optimistic: the id is unknown until the write returns, so a placeholder
    // holds the cell in its watched state and is replaced on success.
    onWatched(row.token, "");
    const res = await watchBoardCompany(provider, row);
    setBusy(null);

    if (res.success) {
      onWatched(row.token, res.data.companyId);
      toastSuccess(`${row.name} added to your watchlist`);
      return;
    }
    onUnwatched(row.token);
    if ("needsConfirm" in res) {
      onNeedsMerge({ provider, board: row, existing: res.existing });
      return;
    }
    toastError(res.message);
  };

  const unwatch = async (row: LeverCompany) => {
    const companyId = watchedMap.get(row.token);
    if (!companyId) return;
    setBusy(row.token);
    onUnwatched(row.token);
    const res = await setCompanyWatched(companyId, false);
    setBusy(null);

    if (res.success) {
      toastSuccess(`${row.name} removed from your watchlist`);
    } else {
      onWatched(row.token, companyId);
      toastError(res.message);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tr("mdcd1d5223f73")}</TableHead>
          <TableHead className="hidden sm:table-cell">{tr("md2089be67295")}</TableHead>
          <TableHead className="hidden sm:table-cell">{tr("m472590ae974d")}</TableHead>
          <TableHead className="text-end">{tr("ma71e75732446")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const watched = watchedMap.has(row.token);
          return (
            <TableRow key={row.token}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-1.5">
                  {row.name}
                  <a
                    href={companyBoardUrl(provider, row)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={tr("mbd2f0a833536", {v0: row.name})}
                    title={tr("m2381c715b663")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {row.token}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {PROVIDER_META[provider].label}
              </TableCell>
              <TableCell className="text-end">
                {watched ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy === row.token}
                    aria-label={tr("mdcc09e485e49", {v0: row.name})}
                    onClick={() => unwatch(row)}
                    className="group text-emerald-600 dark:text-emerald-400"
                  >
                    <Check className="h-3.5 w-3.5 group-hover:hidden" />
                    <span className="group-hover:hidden">{tr("mfbc594054d51")}</span>
                    <span className="hidden group-hover:inline">{tr("m2aaf52f0a013")}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy === row.token}
                    aria-label={tr("mb14218ea7edf", {v0: row.name})}
                    onClick={() => watch(row)}
                  >
                    {tr("ma71e75732446")}</Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default BoardsTable;
