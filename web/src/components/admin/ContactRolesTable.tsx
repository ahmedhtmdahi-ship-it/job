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
import { ContactRole } from "@/models/contact.model";
import { MoreVertical, Trash } from "lucide-react";
import { AlertDialog } from "@/models/alertDialog.model";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { deleteContactRoleById } from "@/actions/contactRole.actions";
import { toastSuccess, toastError } from "@/lib/toast";

type ContactRolesTableProps = {
  roles: ContactRole[];
  reloadRoles: () => void;
};

function ContactRolesTable({ roles, reloadRoles }: ContactRolesTableProps) {
  const tr = useT();

  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  const onDeleteRole = (role: ContactRole) => {
    const links = role._count?.jobContacts ?? 0;
    const holders = role._count?.contacts ?? 0;
    if (links > 0 || holders > 0) {
      setAlert({
        openState: true,
        title: tr("m3ec946ac573d"),
        description: links
          ? tr("m65fb7c5621e5", {v0: links, v1: links === 1 ? "" : "s"})
          : tr("mf25a1c11b311", {v0: holders, v1: holders === 1 ? "" : "s"}),
        deleteAction: false,
      });
    } else {
      setAlert({ openState: true, deleteAction: true, itemId: role.id });
    }
  };

  const deleteRole = async (roleId: string) => {
    if (roleId) {
      const { success, message } = await deleteContactRoleById(roleId);
      if (success) {
        toastSuccess(tr("m1352fc15eac2"));
        reloadRoles();
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
            <TableHead>{tr("m14736a2eb9f4")}</TableHead>
            <TableHead className="hidden sm:table-cell">{tr("m8e37953d23da")}</TableHead>
            <TableHead>{tr("m7557025db57f")}</TableHead>
            <TableHead>
              <span className="sr-only">{tr("mff8059dc6752")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role: ContactRole) => {
            return (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.label}</TableCell>
                <TableCell className="font-medium hidden sm:table-cell">
                  {role.value}
                </TableCell>
                <TableCell className="font-medium">
                  {role._count?.jobContacts ?? 0}
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
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteRole(role)}
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
        pageTitle="role"
        open={alert.openState}
        onOpenChange={() => setAlert({ openState: false, deleteAction: false })}
        onDelete={() => deleteRole(alert.itemId!)}
        alertTitle={alert.title}
        alertDescription={alert.description}
        deleteAction={alert.deleteAction}
      />
    </>
  );
}

export default ContactRolesTable;
