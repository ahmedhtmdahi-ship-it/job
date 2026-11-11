"use client";

import {useT} from "@/i18n/useT";
import { X, Loader2, ChevronsUpDown, ExternalLink, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { APP_CONSTANTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { JobBoard, LeverCompany } from "@/models/automation.model";
import { companyBoardUrl } from "@/lib/atsBoardUrl";
import { toastInfo } from "@/lib/toast";
import { PROVIDER_META } from "./types";
import { useAtsCompanySearch } from "./useAtsCompanySearch";
import { useWatchedBoards } from "./useWatchedBoards";
import { JobBoardUrlAdd } from "@/components/JobBoardUrlAdd";

interface CompanyPickerProps {
  provider: JobBoard;
  companies: LeverCompany[];
  onAdd: (company: LeverCompany) => void;
  onAddMany: (boards: LeverCompany[]) => number;
  onRemove: (token: string) => void;
}

export function CompanyPicker({
  provider,
  companies,
  onAdd,
  onAddMany,
  onRemove,
}: CompanyPickerProps) {
  const tr = useT();

  const meta = PROVIDER_META[provider] ?? PROVIDER_META.greenhouse;
  const {
    query,
    results,
    totalCount,
    open,
    isSearching,
    handleQueryChange,
    handleOpen,
    handleListScroll,
  } = useAtsCompanySearch(provider);

  const atLimit = companies.length >= APP_CONSTANTS.ATS_MAX_COMPANIES;

  const { watched } = useWatchedBoards(provider, open);
  const resultTokens = new Set(results.map((r) => r.token));
  const watchedOnly = watched.filter((w) => !resultTokens.has(w.token));

  const addAllWatched = () => {
    const skipped = onAddMany(watched);
    if (skipped > 0) {
      toastInfo(
        `Added what fits — ${skipped} skipped at the ${APP_CONSTANTS.ATS_MAX_COMPANIES}-company limit.`,
      );
    }
  };

  const toggleCompany = (company: LeverCompany) => {
    if (companies.some((c) => c.token === company.token)) {
      onRemove(company.token);
    } else {
      onAdd(company);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        <span>
          {meta.label} {" "}{tr("m4923413b40d7")}{" "}
          <span className="font-normal text-muted-foreground">
            ({companies.length}/{APP_CONSTANTS.ATS_MAX_COMPANIES})
          </span>
        </span>
        {totalCount !== null && totalCount > 0 && (
          <span className="text-xs font-normal text-muted-foreground">
            {totalCount} {" "}{tr("mddd9818abacf")}</span>
        )}
      </Label>

      <Popover open={open} onOpenChange={handleOpen} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between font-normal text-muted-foreground",
              atLimit && "opacity-50 cursor-not-allowed",
            )}
            disabled={atLimit}
          >
            {atLimit
              ? tr("m075e6360af21", {v0: APP_CONSTANTS.ATS_MAX_COMPANIES})
              : tr("m27073b76391c", {v0: meta.searchExample})}
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-(--radix-popover-trigger-width)"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={tr("mfa6106cccb53")}
              value={query}
              onValueChange={handleQueryChange}
            />
            {/* Outside the group heading: cmdk marks headings aria-hidden, */}
            {/* which would hide this button from keyboard and screen readers. */}
            {watched.length > 0 && (
              <div className="flex items-center justify-between border-b px-3 py-1.5">
                <span className="text-xs text-muted-foreground">
                  {watched.length} {" "}{tr("mbc2549d34f77")}</span>
                <button
                  type="button"
                  disabled={atLimit}
                  onClick={addAllWatched}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {tr("mae295eef574e")}</button>
              </div>
            )}
            <CommandList onScroll={handleListScroll}>
              {isSearching && results.length === 0 && (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tr("m78c9d9f6ace0")}</div>
              )}
              {!isSearching && results.length === 0 && (
                <CommandEmpty>
                  {tr("mc2db04d46552")}</CommandEmpty>
              )}
              {watched.length > 0 && (
                <CommandGroup heading={`Watched (${watched.length})`}>
                  {watchedOnly.map((c) => {
                    const selected = companies.some(
                      (sel) => sel.token === c.token,
                    );
                    return (
                      <CommandItem
                        key={`watched-${c.token}`}
                        value={`watched-${c.token}`}
                        disabled={!selected && atLimit}
                        onSelect={() => toggleCompany(c)}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            selected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span>{c.name}</span>
                        <span className="ms-2 text-xs text-muted-foreground">
                          {c.token}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              <CommandGroup>
                {results.map((c) => {
                  const selected = companies.some(
                    (sel) => sel.token === c.token,
                  );
                  return (
                    <CommandItem
                      key={c.token}
                      value={c.token}
                      disabled={!selected && atLimit}
                      onSelect={() => toggleCompany(c)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span>{c.name}</span>
                      <span className="ms-2 text-xs text-muted-foreground">
                        {c.token}
                      </span>
                      <a
                        href={companyBoardUrl(provider, c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={tr("mbd2f0a833536", {v0: c.name})}
                        title={tr("m2381c715b663")}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="ms-auto text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {isSearching && results.length > 0 && (
                <div className="flex items-center justify-center gap-2 p-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tr("mcf635a30daae")}</div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {companies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {companies.map((c) => (
            <Badge key={c.token} variant="secondary" className="gap-1">
              {c.name}
              <button type="button" onClick={() => onRemove(c.token)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <JobBoardUrlAdd
        provider={provider}
        placeholder={meta.urlHint}
        disabled={atLimit}
        onResolved={onAdd}
      />
      <p className="text-sm text-muted-foreground">
        {tr("m2a78025de6aa")}{" "}{meta.label} {" "}{tr("m775754821735")}</p>
    </div>
  );
}
