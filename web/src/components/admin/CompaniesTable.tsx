"use client";
import {useT} from "@/i18n/useT";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Company } from "@/models/job.model";
import {
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { deleteCompanyById, setCompanyWatched } from "@/actions/company.actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { AlertDialog } from "@/models/alertDialog.model";
import { BoardCell } from "./BoardCell";

type CompaniesTableProps = {
  companies: Company[];
  reloadCompanies: () => void;
  editCompany: (id: string) => void;
  scope?: "mine" | "watchlist";
};

function CompaniesTable({
  companies,
  reloadCompanies,
  editCompany,
  scope = "mine",
}: CompaniesTableProps) {
  const tr = useT();

  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  const onDeleteCompany = (company: Company) => {
    const totalJobs = company._count?.jobsTotal ?? 0;
    if (totalJobs > 0) {
      setAlert({
        openState: true,
        title: tr("mcaedc6cab895"),
        description: `This company has ${totalJobs} associated job${
          totalJobs === 1 ? "" : "s"
        } (applied or not). Remove or reassign them before deleting this company.`,
        deleteAction: false,
      });
    } else {
      setAlert({
        openState: true,
        deleteAction: true,
        itemId: company.id,
      });
    }
  };

  const detailsHref = (id: string) =>
    `/dashboard/admin/companies/${id}${scope === "watchlist" ? "?scope=watchlist" : ""}`;

  const toggleWatch = async (company: Company) => {
    const next = !company.watched;
    const res = await setCompanyWatched(company.id, next);
    if (res.success) {
      toastSuccess(
        tr(next
          ? `${company.label} added to your watchlist`
          : `${company.label} removed from your watchlist. It stays in your Library.`),
      );
      reloadCompanies();
    } else {
      toastError(tr(res.message));
    }
  };

  const deleteCompany = async (companyId: string | undefined) => {
    if (companyId) {
      const { res, success, message } = await deleteCompanyById(companyId);
      if (success) {
        toastSuccess(tr(`Company has been deleted successfully`));
        reloadCompanies();
      } else {
        toastError(tr(message));
      }
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-[100px] sm:table-cell">
              <span className="sr-only">{tr("md6e2a199bcd7")}</span>
            </TableHead>
            <TableHead>{tr("mb48362246239")}</TableHead>
            {scope === "watchlist" ? (
              <>
                <TableHead>{tr("m4816cbfd74aa")}</TableHead>
                <TableHead>{tr("m2f17a0f8d518")}</TableHead>
                <TableHead>{tr("m1ca8c1c0de6f")}</TableHead>
              </>
            ) : (
              <>
                <TableHead className="hidden sm:table-cell">{tr("m8e37953d23da")}</TableHead>
                <TableHead>{tr("mfb1411144fac")}</TableHead>
                <TableHead>{tr("mefb0685ba90b")}</TableHead>
                <TableHead>{tr("maea4a04a8042")}</TableHead>
                <TableHead>{tr("mb450645debe2")}</TableHead>
              </>
            )}
            <TableHead>{tr("mff8059dc6752")}</TableHead>
            <TableHead>
              <span className="sr-only">{tr("mff8059dc6752")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company: Company) => {
            return (
              <TableRow key={company.id}>
                <TableCell className="hidden sm:table-cell">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={tr("m87a86135f7dc")}
                    className="w-8 h-8 rounded-md object-cover"
                    src={company.logoUrl || "/images/jobsync-logo.svg"}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/jobsync-logo.svg";
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    <Link
                      href={detailsHref(company.id)}
                      className="hover:underline underline-offset-4"
                    >
                      {company.label}
                    </Link>
                    {company.watched && (
                      <span
                        title={tr("mf2b3107637f9")}
                        className="text-emerald-600 dark:text-emerald-400"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {scope !== "watchlist" && company.atsToken && (
                      <BoardCell company={company} />
                    )}
                  </span>
                </TableCell>
                {scope === "watchlist" ? (
                  <>
                    <TableCell>
                      <BoardCell company={company} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {company._count?.jobsTotal ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.watchedAt
                        ? formatDistanceToNow(new Date(company.watchedAt), {
                            addSuffix: true,
                          })
                        : "—"}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-medium hidden sm:table-cell">
                      {company.value}
                    </TableCell>
                    <TableCell className="font-medium">
                      {company._count?.jobsTotal ? (
                        <Link
                          href={`/dashboard/myjobs?company=${encodeURIComponent(company.value)}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {company._count.jobsTotal}
                        </Link>
                      ) : (
                        (company._count?.jobsTotal ?? 0)
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {company._count?.jobsApplied ? (
                        <Link
                          href={`/dashboard/myjobs?company=${encodeURIComponent(company.value)}&applied=true`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {company._count.jobsApplied}
                        </Link>
                      ) : (
                        (company._count?.jobsApplied ?? 0)
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {company._count?.jobsRejected ?? 0}
                    </TableCell>
                    <TableCell className="font-medium">
                      {company._count?.contacts ?? 0}
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{tr("mc02651240c87")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{tr("mff8059dc6752")}</DropdownMenuLabel>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link href={detailsHref(company.id)}>
                          <Building2 className="me-2 h-4 w-4" />
                          {tr("md1bf045bb524")}</Link>
                      </DropdownMenuItem>
                      {company._count?.jobsApplied ? (
                        <DropdownMenuItem className="cursor-pointer" asChild>
                          <Link
                            href={`/dashboard/myjobs?company=${encodeURIComponent(company.value)}&applied=true`}
                          >
                            <Briefcase className="me-2 h-4 w-4" />
                            {tr("mcf89bb5127a0")}</Link>
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => editCompany(company.id)}
                      >
                        <Pencil className="me-2 h-4 w-4" />
                        {tr("m5b5fc3eeb5e6")}</DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => toggleWatch(company)}
                      >
                        {company.watched ? (
                          <EyeOff className="me-2 h-4 w-4" />
                        ) : (
                          <Eye className="me-2 h-4 w-4" />
                        )}
                        {company.watched ? tr("m2aaf52f0a013") : tr("ma71e75732446")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteCompany(company)}
                      >
                        <Trash className="me-2 h-4 w-4" />
                        {tr("me2d0a54968ea")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <DeleteAlertDialog
        pageTitle="company"
        open={alert.openState}
        onOpenChange={() => setAlert({ openState: false, deleteAction: false })}
        onDelete={() => deleteCompany(alert.itemId)}
        alertTitle={alert.title}
        alertDescription={alert.description}
        deleteAction={alert.deleteAction}
      />
    </>
  );
}

export default CompaniesTable;
