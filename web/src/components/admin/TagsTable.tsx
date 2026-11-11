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
import { Tag } from "@/models/job.model";
import { MoreVertical, Trash } from "lucide-react";
import { useState } from "react";
import { deleteTagById } from "@/actions/tag.actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { AlertDialog } from "@/models/alertDialog.model";

type TagsTableProps = {
  tags: Tag[];
  reloadTags: () => void;
};

function TagsTable({ tags, reloadTags }: TagsTableProps) {
  const tr = useT();

  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  const onDeleteTag = (tag: Tag) => {
    const jobCount = tag._count?.jobs ?? 0;
    const questionCount = tag._count?.questions ?? 0;
    const skillCount = tag._count?.skills ?? 0;

    if (jobCount > 0 || questionCount > 0 || skillCount > 0) {
      const links = [
        jobCount > 0 ? `${jobCount} job(s)` : "",
        questionCount > 0 ? `${questionCount} question(s)` : "",
        skillCount > 0 ? `${skillCount} skill(s)` : "",
      ]
        .filter(Boolean)
        .join(" and ");

      setAlert({
        openState: true,
        title: tr("m1788f3b81f3b"),
        description: `This skill is linked to ${links} and cannot be deleted.`,
        deleteAction: false,
      });
    } else {
      setAlert({
        openState: true,
        deleteAction: true,
        itemId: tag.id,
      });
    }
  };

  const deleteTag = async (tagId: string | undefined) => {
    if (!tagId) return;
    const { success, message } = await deleteTagById(tagId);
    if (success) {
      toastSuccess(tr("md72e179c1f10"));
      reloadTags();
    } else {
      toastError(tr(message));
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr("m062e9e790c51")}</TableHead>
            <TableHead className="hidden sm:table-cell">{tr("m8e37953d23da")}</TableHead>
            <TableHead>{tr("mc3eb1415cba5")}</TableHead>
            <TableHead>{tr("mb24d0762aa39")}</TableHead>
            <TableHead>{tr("mff8059dc6752")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag: Tag) => (
            <TableRow key={tag.id}>
              <TableCell className="font-medium">{tag.label}</TableCell>
              <TableCell className="font-medium hidden sm:table-cell">
                {tag.value}
              </TableCell>
              <TableCell className="font-medium">
                {tag._count?.jobs ?? 0}
              </TableCell>
              <TableCell className="font-medium">
                {tag._count?.questions ?? 0}
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
                      onClick={() => onDeleteTag(tag)}
                    >
                      <Trash className="me-2 h-4 w-4" />
                      {tr("me2d0a54968ea")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DeleteAlertDialog
        pageTitle="skill"
        open={alert.openState}
        onOpenChange={() => setAlert({ openState: false, deleteAction: false })}
        onDelete={() => deleteTag(alert.itemId)}
        alertTitle={alert.title}
        alertDescription={alert.description}
        deleteAction={alert.deleteAction}
      />
    </>
  );
}

export default TagsTable;
