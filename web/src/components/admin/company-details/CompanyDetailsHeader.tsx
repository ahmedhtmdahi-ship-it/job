"use client";

import {useT} from "@/i18n/useT";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyLogo } from "@/components/myjobs/CompanyLogo";
import { companyBoardUrl } from "@/lib/atsBoardUrl";
import { formatUrl } from "@/lib/utils";
import type { Company } from "@/models/job.model";
import type { LeverHost } from "@/models/automation.model";
import { hostnameOf } from "./hostname";

type CompanyDetailsHeaderProps = {
  company: Company;
  onBack: () => void;
  onToggleWatch: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function CompanyDetailsHeader({
  company,
  onBack,
  onToggleWatch,
  onEdit,
  onDelete,
}: CompanyDetailsHeaderProps) {
  const tr = useT();

  const subtitle = [company.industry, hostnameOf(company.websiteUrl)]
    .filter(Boolean)
    .join(" · ");

  const boardUrl =
    company.atsProvider && company.atsToken
      ? companyBoardUrl(company.atsProvider, {
          token: company.atsToken,
          host: (company.atsHost as LeverHost) ?? undefined,
        })
      : null;
  const links = [
    { label: tr("m345173567bc6"), href: company.websiteUrl ? formatUrl(company.websiteUrl) : null },
    { label: tr("mdb0f789ba056"), href: company.careersUrl ? formatUrl(company.careersUrl) : null },
    { label: tr("mb7f7e84d2d99"), href: company.linkedinUrl ? formatUrl(company.linkedinUrl) : null },
    { label: tr("m2381c715b663"), href: boardUrl },
  ].filter((link): link is { label: string; href: string } => !!link.href);

  return (
    <div className="flex flex-col gap-4 @5xl/main:flex-row @5xl/main:items-center">
      <div className="flex flex-1 min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          title={tr("mb8d99df1066e")}
          aria-label={tr("mc1e6bdefe8ab")}
          onClick={onBack}
        >
          <ArrowLeft className="rtl-mirror h-4 w-4" />
        </Button>
        <CompanyLogo
          logoUrl={company.logoUrl}
          className="h-8 w-8 min-w-8"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">{company.label}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" className="cursor-pointer" onClick={onToggleWatch}>
          {company.watched ? (
            <EyeOff className="h-4 w-4 sm:me-2" />
          ) : (
            <Eye className="h-4 w-4 sm:me-2" />
          )}
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {company.watched ? tr("m2aaf52f0a013") : tr("ma71e75732446")}
          </span>
        </Button>
        <Button variant="outline" className="cursor-pointer" onClick={onEdit}>
          <Pencil className="h-4 w-4 sm:me-2" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {tr("m464c4ffd019e")}</span>
        </Button>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive cursor-pointer"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 sm:me-2" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {tr("me2d0a54968ea")}</span>
        </Button>
        {links.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">{tr("m18c67781bdf7")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>{tr("m9024c197d849")}</DropdownMenuLabel>
              {links.map((link) => (
                <DropdownMenuItem key={link.label} className="cursor-pointer" asChild>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="me-2 h-4 w-4" />
                    {link.label}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
