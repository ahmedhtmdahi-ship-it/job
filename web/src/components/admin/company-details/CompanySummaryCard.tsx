"use client";

import {useT} from "@/i18n/useT";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { BoardCell } from "@/components/admin/BoardCell";
import { formatUrl } from "@/lib/utils";
import type { Company } from "@/models/job.model";
import { hostnameOf } from "./hostname";

type CompanySummaryCardProps = {
  company: Company;
  jobsCount: number;
  appliedCount: number;
  contactsCount: number;
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}

function HostLink({ url }: { url?: string | null }) {
  const host = hostnameOf(url);
  if (!url || !host) return <>—</>;
  return (
    <a
      href={formatUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline underline-offset-4"
    >
      {host}
    </a>
  );
}

export function CompanySummaryCard({
  company,
  jobsCount,
  appliedCount,
  contactsCount,
}: CompanySummaryCardProps) {
  const tr = useT();

  return (
    <Card data-testid="company-summary">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Fact label={tr("meff2ec588be1")}>
            {company.watched ? (
              <>
                {tr("m1ca8c1c0de6f")}{company.watchedAt && (
                  <span className="block text-sm font-normal text-muted-foreground">
                    {formatDistanceToNow(new Date(company.watchedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </>
            ) : (
              "Not watched"
            )}
          </Fact>
          <Fact label={tr("m4816cbfd74aa")}>
            <BoardCell company={company} />
          </Fact>
          <Fact label={tr("mb44484a0fa28")}>{company.industry || "—"}</Fact>
          <Fact label={tr("m1af851907331")}>{company.size || "—"}</Fact>
          <Fact label={tr("mb5a229ac8bec")}>
            <HostLink url={company.websiteUrl} />
          </Fact>
          <Fact label={tr("m499284bf04ae")}>
            <HostLink url={company.careersUrl} />
          </Fact>
          <Fact label={tr("mdd84425b72da")}>
            <HostLink url={company.linkedinUrl} />
          </Fact>
          <Fact label={tr("m2f17a0f8d518")}>{jobsCount}</Fact>
          <Fact label={tr("m0c79a9c22284")}>{appliedCount}</Fact>
          <Fact label={tr("mb450645debe2")}>{contactsCount}</Fact>
        </div>
        {company.notes && (
          <div className="mt-4 border-t pt-4" data-testid="company-notes">
            <p className="text-sm text-muted-foreground">{tr("m8a7525b1492f")}</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{company.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
