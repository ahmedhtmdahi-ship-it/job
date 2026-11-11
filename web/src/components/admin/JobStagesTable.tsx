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
import { JobStageTypeRef } from "@/models/jobStage.model";
import { ArrowDown, ArrowUp, MoreVertical, Pencil, Trash } from "lucide-react";
import { AlertDialog } from "@/models/alertDialog.model";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { StatusBadge } from "../StatusBadge";
import { getJobStatusBadgeColor } from "@/lib/badge-colors";
import {
  deleteJobStageTypeById,
  updateJobStageType,
} from "@/actions/jobStageType.actions";
import { toastSuccess, toastError } from "@/lib/toast";

type JobStagesTableProps = {
  types: JobStageTypeRef[];
  reloadTypes: () => void;
  onEdit: (type: JobStageTypeRef) => void;
};

function JobStagesTable({ types, reloadTypes, onEdit }: JobStagesTableProps) {
  const tr = useT();

  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  const onDeleteType = (type: JobStageTypeRef) => {
    const stages = type._count?.stages ?? 0;
    if (stages > 0) {
      setAlert({
        openState: true,
        title: tr("m87317b0c8935"),
        description: tr("m0269fbb8d610", {v0: stages, v1: stages === 1 ? "" : "s"}),
        deleteAction: false,
      });
    } else {
      setAlert({ openState: true, deleteAction: true, itemId: type.id });
    }
  };

  const deleteType = async (typeId: string) => {
    if (typeId) {
      const { success, message } = await deleteJobStageTypeById(typeId);
      if (success) {
        toastSuccess(tr("m420fdb857a73"));
        reloadTypes();
      } else {
        toastError(tr(message));
      }
    }
  };

  // Swap sortOrder with the adjacent row rather than renumbering the list:
  // a drag-and-drop reorder would need a new dependency.
  const move = async (index: number, direction: -1 | 1) => {
    const type = types[index];
    const neighbour = types[index + direction];
    if (!neighbour) return;

    const results = await Promise.all([
      updateJobStageType(
        type.id,
        type.label,
        type.statusId,
        neighbour.sortOrder,
      ),
      updateJobStageType(
        neighbour.id,
        neighbour.label,
        neighbour.statusId,
        type.sortOrder,
      ),
    ]);
    const failed = results.find((res) => !res?.success);
    if (failed) {
      toastError(tr(failed.message));
    }
    reloadTypes();
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr("mde838855e4a6")}</TableHead>
            <TableHead>{tr("mccf93fbd2851")}</TableHead>
            <TableHead className="hidden sm:table-cell">{tr("m6be090825c99")}</TableHead>
            <TableHead>{tr("m3a17aa4e4abb")}</TableHead>
            <TableHead>
              <span className="sr-only">{tr("mff8059dc6752")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.map((type: JobStageTypeRef, index: number) => {
            return (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{tr(type.label)}</TableCell>
                <TableCell>
                  {type.Status && (
                    <StatusBadge
                      label={type.Status.label}
                      color={getJobStatusBadgeColor(type.Status.value)}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium hidden sm:table-cell">
                  {type.sortOrder}
                </TableCell>
                <TableCell className="font-medium">
                  {type._count?.stages ?? 0}
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
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEdit(type)}
                      >
                        <Pencil className="me-2 h-4 w-4" />
                        {tr("m464c4ffd019e")}</DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="me-2 h-4 w-4" />
                        {tr("m1359626e7b69")}</DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={index === types.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="me-2 h-4 w-4" />
                        {tr("mb58330ac2505")}</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteType(type)}
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
        pageTitle="stage type"
        open={alert.openState}
        onOpenChange={() => setAlert({ openState: false, deleteAction: false })}
        onDelete={() => deleteType(alert.itemId!)}
        alertTitle={alert.title}
        alertDescription={alert.description}
        deleteAction={alert.deleteAction}
      />
    </>
  );
}

export default JobStagesTable;
