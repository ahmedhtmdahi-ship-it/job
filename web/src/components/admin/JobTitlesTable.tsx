"use client";
import {useT} from "@/i18n/useT";
import { useState } from "react";
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
import { JobTitle } from "@/models/job.model";
import { Briefcase, MoreVertical, Trash } from "lucide-react";
import Link from "next/link";
import { AlertDialog } from "@/models/alertDialog.model";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { deleteJobTitleById } from "@/actions/jobtitle.actions";
import { toastSuccess, toastError } from "@/lib/toast";

type JobTitlesTableProps = {
  jobTitles: JobTitle[];
  reloadJobTitles: () => void;
};

function JobTitlesTable({ jobTitles, reloadJobTitles }: JobTitlesTableProps) {
  const tr = useT();

  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  const onDeleteJobTitle = (title: JobTitle) => {
    const totalJobs = title._count?.jobsTotal ?? 0;
    if (totalJobs > 0) {
      setAlert({
        openState: true,
        title: tr("mcaedc6cab895"),
        description: tr("m0e072a9a70b8", {v0: totalJobs, v1: totalJobs === 1 ? "" : "s"}),
        deleteAction: false,
      });
    } else {
      setAlert({
        openState: true,
        deleteAction: true,
        itemId: title.id,
      });
    }
  };
  const deleteJobTitle = async (titleId: string) => {
    if (titleId) {
      const { success, message } = await deleteJobTitleById(titleId);
      if (success) {
        toastSuccess(tr(`Job title has been deleted successfully`));
        reloadJobTitles();
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
            <TableHead>{tr("mde2c88352242")}</TableHead>
            <TableHead className="hidden sm:table-cell">{tr("m8e37953d23da")}</TableHead>
            <TableHead>{tr("mfb1411144fac")}</TableHead>
            <TableHead>{tr("mefb0685ba90b")}</TableHead>
            <TableHead>{tr("mff8059dc6752")}</TableHead>
            <TableHead>
              <span className="sr-only">{tr("mff8059dc6752")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobTitles.map((title: JobTitle) => {
            return (
              <TableRow key={title.id}>
                <TableCell className="font-medium">{title.label}</TableCell>
                <TableCell className="font-medium hidden sm:table-cell">
                  {title.value}
                </TableCell>
                <TableCell className="font-medium">
                  {title._count?.jobsTotal ? (
                    <Link
                      href={`/dashboard/myjobs?title=${encodeURIComponent(title.value)}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {title._count.jobsTotal}
                    </Link>
                  ) : (
                    (title._count?.jobsTotal ?? 0)
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {title._count?.jobs ? (
                    <Link
                      href={`/dashboard/myjobs?title=${encodeURIComponent(title.value)}&applied=true`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {title._count.jobs}
                    </Link>
                  ) : (
                    (title._count?.jobs ?? 0)
                  )}
                </TableCell>
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
                      {title._count?.jobs ? (
                        <DropdownMenuItem className="cursor-pointer" asChild>
                          <Link
                            href={`/dashboard/myjobs?title=${encodeURIComponent(title.value)}&applied=true`}
                          >
                            <Briefcase className="me-2 h-4 w-4" />
                            {tr("mcf89bb5127a0")}</Link>
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteJobTitle(title)}
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
        pageTitle="title"
        open={alert.openState}
        onOpenChange={() => setAlert({ openState: false, deleteAction: false })}
        onDelete={() => deleteJobTitle(alert.itemId!)}
        alertTitle={alert.title}
        alertDescription={alert.description}
        deleteAction={alert.deleteAction}
      />
    </>
  );
}

export default JobTitlesTable;
