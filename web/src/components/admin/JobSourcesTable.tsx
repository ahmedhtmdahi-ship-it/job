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
import { JobSource } from "@/models/job.model";
import { Briefcase, MoreVertical, Trash } from "lucide-react";
import Link from "next/link";
import { AlertDialog } from "@/models/alertDialog.model";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { deleteJobSourceById } from "@/actions/jobSource.actions";
import { toastSuccess, toastError } from "@/lib/toast";

type JobSourcesTableProps = {
  jobSources: JobSource[];
  reloadJobSources: () => void;
};

function JobSourcesTable({
  jobSources,
  reloadJobSources,
}: JobSourcesTableProps) {
  const tr = useT();

  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  const onDeleteJobSource = (source: JobSource) => {
    const totalJobs = source._count?.jobsTotal ?? 0;
    if (totalJobs > 0) {
      setAlert({
        openState: true,
        title: tr("mcaedc6cab895"),
        description: `This source has ${totalJobs} associated job${
          totalJobs === 1 ? "" : "s"
        } (applied or not). Remove or reassign them before deleting this source.`,
        deleteAction: false,
      });
    } else {
      setAlert({
        openState: true,
        deleteAction: true,
        itemId: source.id,
      });
    }
  };

  const deleteJobSource = async (sourceId: string) => {
    if (sourceId) {
      const { success, message } = await deleteJobSourceById(sourceId);
      if (success) {
        toastSuccess(tr(`Job source has been deleted successfully`));
        reloadJobSources();
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
            <TableHead>{tr("m0e570ca6fabe")}</TableHead>
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
          {jobSources.map((source: JobSource) => {
            return (
              <TableRow key={source.id}>
                <TableCell className="font-medium">{source.label}</TableCell>
                <TableCell className="font-medium hidden sm:table-cell">
                  {source.value}
                </TableCell>
                <TableCell className="font-medium">
                  {source._count?.jobsTotal ? (
                    <Link
                      href={`/dashboard/myjobs?source=${encodeURIComponent(source.value)}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {source._count.jobsTotal}
                    </Link>
                  ) : (
                    (source._count?.jobsTotal ?? 0)
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {source._count?.jobsApplied ? (
                    <Link
                      href={`/dashboard/myjobs?source=${encodeURIComponent(source.value)}&applied=true`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {source._count.jobsApplied}
                    </Link>
                  ) : (
                    (source._count?.jobsApplied ?? 0)
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
                      {source._count?.jobsApplied ? (
                        <DropdownMenuItem className="cursor-pointer" asChild>
                          <Link
                            href={`/dashboard/myjobs?source=${encodeURIComponent(source.value)}&applied=true`}
                          >
                            <Briefcase className="me-2 h-4 w-4" />
                            {tr("mcf89bb5127a0")}</Link>
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteJobSource(source)}
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
        pageTitle="source"
        open={alert.openState}
        onOpenChange={() => setAlert({ openState: false, deleteAction: false })}
        onDelete={() => deleteJobSource(alert.itemId!)}
        alertTitle={alert.title}
        alertDescription={alert.description}
        deleteAction={alert.deleteAction}
      />
    </>
  );
}

export default JobSourcesTable;
