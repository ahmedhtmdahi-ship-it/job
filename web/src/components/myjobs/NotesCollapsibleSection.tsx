"use client";
import {useT} from "@/i18n/useT";
import { useCallback, useEffect, useState, useTransition } from "react";
import { NoteResponse } from "@/models/note.model";
import {
  getNotesByJobId,
  deleteNote,
  addNote,
  updateNote,
} from "@/actions/note.actions";
import { NoteCard } from "./NoteCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, Loader, PlusCircle, StickyNote } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { toastError, toastSuccess } from "@/lib/toast";
import TiptapEditor from "../TiptapEditor";

type NotesCollapsibleSectionProps = {
  jobId: string;
};

export function NotesCollapsibleSection({
  jobId,
}: NotesCollapsibleSectionProps) {
  const tr = useT();

  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteResponse | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadNotes = useCallback(async () => {
    const result = await getNotesByJobId(jobId);
    if (result.success) {
      setNotes(result.data);
    }
  }, [jobId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAddNote = () => {
    setEditingNote(null);
    setEditorContent("");
    setIsAdding(true);
    setIsOpen(true);
  };

  const handleEdit = (note: NoteResponse) => {
    setIsAdding(false);
    setEditingNote(note);
    setEditorContent(note.content);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingNote(null);
    setEditorContent("");
  };

  const handleSave = () => {
    if (!editorContent.trim()) return;

    startTransition(async () => {
      const result = editingNote
        ? await updateNote({
            id: editingNote.id,
            jobId,
            content: editorContent,
          })
        : await addNote({ jobId, content: editorContent });

      if (result.success) {
        toastSuccess(`Note ${editingNote ? "updated" : "added"} successfully`);
        handleCancel();
        loadNotes();
      } else {
        toastError(result.message);
      }
    });
  };

  const handleDeleteClick = (noteId: string) => {
    setDeleteConfirmId(noteId);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;

    startTransition(async () => {
      const result = await deleteNote(deleteConfirmId);
      if (result.success) {
        toastSuccess(tr("med7194c9bf41"));
        setDeleteConfirmId(null);
        loadNotes();
      } else {
        toastError(result.message);
      }
    });
  };

  const inlineEditor = (
    <div className="border rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">
        {editingNote ? tr("mab224ee3a8e4") : tr("me30f00b3a3fd")}
      </p>
      <TiptapEditor
        field={
          {
            value: editorContent,
            onChange: (val: string) => setEditorContent(val),
            onBlur: () => {},
            name: "content" as const,
            ref: () => {},
          } as any
        }
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
        >
          {tr("m19766ed6ccb2")}</Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isPending || !editorContent.trim()}
        >
          {tr("m1509f561f241")}{isPending && <Loader className="ms-2 h-4 w-4 shrink-0 spinner" />}
        </Button>
      </div>
    </div>
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="md:col-span-2"
    >
      <div className="flex items-center gap-2">
        <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80">
          <StickyNote className="h-4 w-4" />
          <span className="text-sm font-medium">{tr("m8a7525b1492f")}</span>
          {notes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notes.length}
            </Badge>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="h-7 gap-1 ms-auto"
          onClick={handleAddNote}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          {tr("mb763c5ea3c57")}</Button>
      </div>
      <CollapsibleContent className="mt-3 space-y-3">
        {isAdding && inlineEditor}
        {notes.length === 0 && !isAdding ? (
          <p className="text-sm text-muted-foreground">{tr("m57bde4deb215")}</p>
        ) : (
          notes.map((note) =>
            editingNote?.id === note.id ? (
              <div key={note.id}>{inlineEditor}</div>
            ) : deleteConfirmId === note.id ? (
              <div
                key={note.id}
                className="border border-destructive rounded-lg p-4 space-y-3"
              >
                <p className="text-sm font-medium">
                  {tr("m00783962c5f3")}</p>
                <p className="text-sm text-muted-foreground">
                  {tr("m3d6a45267218")}</p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    {tr("m19766ed6ccb2")}</Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteConfirm}
                    disabled={isPending}
                  >
                    {tr("me2d0a54968ea")}{isPending && (
                      <Loader className="ms-2 h-4 w-4 shrink-0 spinner" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ),
          )
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
