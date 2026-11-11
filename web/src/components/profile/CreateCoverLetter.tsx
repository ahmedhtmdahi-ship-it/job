"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { FileDown, Loader } from "lucide-react";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { CoverLetterFormSchema } from "@/models/coverLetterForm.schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { ContactInfo, CoverLetter } from "@/models/profile.model";
import { toastSuccess, toastError } from "@/lib/toast";
import {
  createCoverLetter,
  updateCoverLetter,
} from "@/actions/coverLetter.actions";
import Tiptap from "../TiptapEditor";
import { CoverLetterExportDialog } from "./CoverLetterExportDialog";
import { canExportCoverLetter } from "./cover-letter-export-dialog/canExportCoverLetter";

type CreateCoverLetterProps = {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  coverLetterToEdit?: CoverLetter | null;
  reloadDocuments: () => void;
  contactInfo: ContactInfo | null | undefined;
};

function CreateCoverLetter({
  dialogOpen,
  setDialogOpen,
  coverLetterToEdit,
  reloadDocuments,
  contactInfo,
}: CreateCoverLetterProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();
  const [exportOpen, setExportOpen] = useState(false);

  const pageTitle = coverLetterToEdit
    ? uiMessage("m12d3470daa0a")
    : uiMessage("m9cd2d2a46d12");
  const pageDescription = coverLetterToEdit
    ? uiMessage("mda4020ca4fdf")
    : uiMessage("mde7120c10720");

  const form = useForm<z.infer<typeof CoverLetterFormSchema>>({
    resolver: zodResolver(CoverLetterFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const {
    reset,
    formState: { errors, isValid },
  } = form;

  const closeDialog = () => setDialogOpen(false);

  const watchedTitle = form.watch("title");
  const watchedContent = form.watch("content");

  // Memoized: watch() re-renders this component on every keystroke, and the
  // guard parses the whole letter.
  const canExport = useMemo(
    () => canExportCoverLetter(watchedContent),
    [watchedContent],
  );

  useEffect(() => {
    reset({
      id: coverLetterToEdit?.id ?? undefined,
      title: coverLetterToEdit?.title ?? "",
      content: coverLetterToEdit?.content ?? "",
    });
  }, [coverLetterToEdit, reset]);

  const onSubmit = (data: z.infer<typeof CoverLetterFormSchema>) => {
    startTransition(async () => {
      const { success, message } = coverLetterToEdit?.id
        ? await updateCoverLetter(data.id!, data.title, data.content)
        : await createCoverLetter(data.title, data.content);

      if (!success) {
        toastError(tr(message));
      } else {
        reset();
        setDialogOpen(false);
        reloadDocuments();
        toastSuccess(tr("m32791e02911a", {v0: coverLetterToEdit ? "updated" : "created"}));
      }
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="lg:max-w-screen-md lg:max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>{tr(pageTitle)}</DialogTitle>
          <DialogDescription>{typeof pageDescription === "string" ? tr(pageDescription) : pageDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.stopPropagation();
              form.handleSubmit(onSubmit)(event);
            }}
            className="grid grid-cols-1 gap-4 p-2"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("m0500c9fff776")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={tr("m8a0d31cf9338")}
                    />
                  </FormControl>
                  <FormMessage>
                    {errors.title && (
                      <span className="text-red-500">
                        {errors.title.message}
                      </span>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              key={coverLetterToEdit?.id ?? "new"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("m47bd29075f8b")}</FormLabel>
                  <FormControl>
                    <Tiptap field={field} />
                  </FormControl>
                  <FormMessage>
                    {errors.content && (
                      <span className="text-red-500">
                        {errors.content.message}
                      </span>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />

            <div className="mt-4">
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 md:mt-0"
                  disabled={!canExport}
                  onClick={() => setExportOpen(true)}
                >
                  <FileDown className="h-4 w-4" />
                  {tr("mccd4fda2f607")}</Button>
                <div>
                  <Button
                    type="reset"
                    variant="outline"
                    className="mt-2 md:mt-0 w-full"
                    onClick={closeDialog}
                  >
                    {tr("m19766ed6ccb2")}</Button>
                </div>
                <Button type="submit" disabled={!isValid}>
                  {tr("m1509f561f241")}{isPending && (
                    <Loader className="h-4 w-4 shrink-0 spinner" />
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
        {/* Stacked on top of the editor, so closing it returns you to your
            unsaved edits with focus restored. Exports the current form
            values, saved or not. */}
        <CoverLetterExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          letter={{ title: watchedTitle ?? "", content: watchedContent ?? "" }}
          contactInfo={contactInfo}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CreateCoverLetter;
