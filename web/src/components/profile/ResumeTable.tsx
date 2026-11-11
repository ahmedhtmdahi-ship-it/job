"use client";
import {useDateFormat} from "@/i18n/useDateFormat";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import {
  Copy,
  FileDown,
  FilePenLine,
  MoreVertical,
  Paperclip,
  Pencil,
  Star,
  Trash,
} from "lucide-react";
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
import { ProfileDocument } from "@/models/profile.model";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "../ui/button";
import { useMemo, useState } from "react";
import { toastSuccess, toastError } from "@/lib/toast";
import { deleteResumeById, setDefaultResume } from "@/actions/profile.actions";
import { deleteCoverLetterById } from "@/actions/coverLetter.actions";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { IncompleteResumeHint } from "../IncompleteResumeHint";
import { Badge } from "../ui/badge";
import { StatusBadge } from "../StatusBadge";
import { DOCUMENT_TYPE_BADGE_COLORS } from "@/lib/badge-colors";
import {
  hasMinResumeSections,
  warnInsufficientResumeSections,
} from "@/utils/resumeSections.utils";

type DocumentTableProps = {
  documents: ProfileDocument[];
  editResume: (doc: ProfileDocument) => void;
  editCoverLetter: (doc: ProfileDocument) => void;
  exportCoverLetter: (doc: ProfileDocument) => void;
  copyResume: (doc: ProfileDocument) => void;
  reloadDocuments: () => void;
  defaultResumeId?: string | null;
};

function DocumentTable({
  documents,
  editResume,
  editCoverLetter,
  exportCoverLetter,
  copyResume,
  reloadDocuments,
  defaultResumeId,
}: DocumentTableProps) {
  const formatLocalized = useDateFormat();

  const tr = useT();

  const [alertOpen, setAlertOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<ProfileDocument>();
  const [setDefaultConfirmOpen, setSetDefaultConfirmOpen] = useState(false);
  const [documentToSetDefault, setDocumentToSetDefault] =
    useState<ProfileDocument>();
  const onDeleteDocument = useMemo(
    () => (doc: ProfileDocument) => {
      if (!doc.id) return;
      setAlertOpen(true);
      setDocumentToDelete(doc);
    },
    [],
  );

  // Title of the current default, if it happens to be on a loaded page — used
  // only to enrich the confirm copy. Presence of a default is decided by
  // defaultResumeId, which is reliable regardless of pagination.
  const currentDefault = useMemo(
    () => documents.find((d) => d.type === "resume" && d.isDefault),
    [documents],
  );

  const performSetDefault = async (doc: ProfileDocument) => {
    if (!doc.id) return;
    const { success, message } = await setDefaultResume(doc.id);
    if (success) {
      toastSuccess(`"${doc.title}" is now your default resume.`);
      reloadDocuments();
    } else {
      toastError(message);
    }
  };

  const onSetDefault = (doc: ProfileDocument) => {
    if (!doc.id) return;
    if (!hasMinResumeSections(doc.sectionCount)) {
      warnInsufficientResumeSections("setting this resume as default");
      return;
    }
    // Confirm whenever a different resume already holds the default. Decided by
    // defaultResumeId (not the loaded-docs lookup) so it fires even when the
    // current default lives on a not-yet-loaded page.
    if (defaultResumeId && defaultResumeId !== doc.id) {
      setDocumentToSetDefault(doc);
      setSetDefaultConfirmOpen(true);
    } else {
      performSetDefault(doc);
    }
  };

  const onCopyResume = (doc: ProfileDocument) => {
    if (!doc.id) return;
    if (!hasMinResumeSections(doc.sectionCount)) {
      warnInsufficientResumeSections("creating a copy");
      return;
    }
    copyResume(doc);
  };

  const deleteDocument = async (doc: ProfileDocument) => {
    if (!doc.id) return;
    if (doc.jobCount > 0) {
      const label = doc.type === "resume" ? "resume" : "cover letter";
      return toastError(`Number of jobs using ${label} must be 0!`);
    }

    const { success, message } =
      doc.type === "resume"
        ? await deleteResumeById(doc.id)
        : await deleteCoverLetterById(doc.id);

    if (success) {
      const label = doc.type === "resume" ? uiMessage("md640c7421da0") : uiMessage("md9adba2207cb");
      toastSuccess(`${label} has been deleted successfully`);
      reloadDocuments();
    } else {
      toastError(message);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr("m7e8cd2056da7")}</TableHead>
            <TableHead className="whitespace-nowrap">{tr("mbaaddf70fb5d")}</TableHead>
            <TableHead className="whitespace-nowrap">{tr("md70b9e24bca2")}</TableHead>
            <TableHead className="hidden md:table-cell whitespace-nowrap">
              {tr("m3a5ecca188c0")}</TableHead>
            <TableHead>{tr("m2f17a0f8d518")}</TableHead>
            <TableHead>{tr("mff8059dc6752")}</TableHead>
            <TableHead>
              <span className="sr-only">{tr("mff8059dc6752")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const isResume = doc.type === "resume";
            return (
              <TableRow key={`${doc.type}-${doc.id}`}>
                <TableCell className="font-medium">
                  {isResume ? (
                    <Link
                      href={`/dashboard/profile/resume/${doc.id}`}
                      className="flex items-center"
                    >
                      {doc.title}
                      {doc.FileId ? (
                        <Paperclip className="h-3.5 w-3.5 ms-1" />
                      ) : null}
                      {!hasMinResumeSections(doc.sectionCount) ? (
                        <IncompleteResumeHint />
                      ) : null}
                      {doc.isDefault ? (
                        <Badge className="ms-2 border-transparent bg-green-600 text-white hover:bg-green-600/90">
                          {tr("m21b111cbfe6e")}</Badge>
                      ) : null}
                    </Link>
                  ) : (
                    <button
                      className="text-start hover:underline"
                      onClick={() => editCoverLetter(doc)}
                    >
                      {doc.title}
                    </button>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <StatusBadge
                    label={isResume ? tr("md640c7421da0") : tr("m1120f0ed04fb")}
                    color={DOCUMENT_TYPE_BADGE_COLORS[doc.type]}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {doc.createdAt && formatLocalized(doc.createdAt, "PP")}
                </TableCell>
                <TableCell className="hidden md:table-cell whitespace-nowrap">
                  {doc.updatedAt && formatLocalized(doc.updatedAt, "PP")}
                </TableCell>
                <TableCell>{doc.jobCount}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                        data-testid="document-actions-menu-btn"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{tr("mc02651240c87")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{tr("mff8059dc6752")}</DropdownMenuLabel>
                      {isResume ? (
                        <>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => editResume(doc)}
                          >
                            <Pencil className="me-2 h-4 w-4" />
                            {tr("m34676bbb6a74")}</DropdownMenuItem>
                          <Link href={`/dashboard/profile/resume/${doc.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <FilePenLine className="me-2 h-4 w-4" />
                              {tr("mbc651a9d7fe4")}</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onCopyResume(doc)}
                            data-testid="copy-resume-menu-item"
                          >
                            <Copy className="me-2 h-4 w-4" />
                            {tr("m410154360a93")}</DropdownMenuItem>
                          {!doc.isDefault && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => onSetDefault(doc)}
                            >
                              <Star className="me-2 h-4 w-4" />
                              {tr("md09b4dd6265a")}</DropdownMenuItem>
                          )}
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => editCoverLetter(doc)}
                          >
                            <Pencil className="me-2 h-4 w-4" />
                            {tr("m12d3470daa0a")}</DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => exportCoverLetter(doc)}
                            data-testid="export-cover-letter-menu-item"
                          >
                            <FileDown className="me-2 h-4 w-4" />
                            {tr("mccd4fda2f607")}</DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteDocument(doc)}
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
        pageTitle={
          documentToDelete?.type === "cover-letter" ? tr("mec8b778e04b2") : tr("ma83a31320d92")
        }
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onDelete={() => deleteDocument(documentToDelete!)}
        alertDescription={
          documentToDelete?.isDefault
            ? tr("mb598caa7d56f")
            : undefined
        }
      />
      <DeleteAlertDialog
        pageTitle="resume"
        open={setDefaultConfirmOpen}
        onOpenChange={setSetDefaultConfirmOpen}
        onDelete={() => performSetDefault(documentToSetDefault!)}
        alertTitle={tr("m525c79604b21")}
        alertDescription={
          currentDefault
            ? `This will make "${documentToSetDefault?.title}" your default resume, replacing "${currentDefault.title}".`
            : `This will make "${documentToSetDefault?.title}" your default resume, replacing your current default.`
        }
        actionLabel={tr("md09b4dd6265a")}
        actionVariant="default"
      />
    </>
  );
}

export default DocumentTable;
