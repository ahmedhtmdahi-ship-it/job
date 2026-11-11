import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { FormDialogFooter } from "../FormDialogFooter";
import { AddSummarySectionFormSchema } from "@/models/addSummaryForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { useEffect, useTransition } from "react";
import { toastSuccess, toastError } from "@/lib/toast";
import { z } from "zod";
import TiptapEditor from "../TiptapEditor";
import {
  addResumeSummary,
  updateResumeSummary,
} from "@/actions/profile.actions";
import { ResumeSection } from "@/models/profile.model";

interface AddResumeSummaryProps {
  resumeId: string | undefined;
  dialogOpen: boolean;
  setDialogOpen: (e: boolean) => void;
  summaryToEdit?: ResumeSection | null;
}

function AddResumeSummary({
  resumeId,
  dialogOpen,
  setDialogOpen,
  summaryToEdit,
}: AddResumeSummaryProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();

  const pageTitle = summaryToEdit ? uiMessage("m2d2eb4b30434") : uiMessage("md1d875005932");
  const pageDescription = summaryToEdit
    ? uiMessage("mbdf655d7f3f7")
    : uiMessage("mb88b8314e786");

  const form = useForm<z.infer<typeof AddSummarySectionFormSchema>>({
    resolver: zodResolver(AddSummarySectionFormSchema),
    defaultValues: {
      resumeId,
      sectionTitle: "",
    },
  });

  const { reset, formState } = form;

  useEffect(() => {
    if (summaryToEdit) {
      reset(
        {
          id: summaryToEdit.id,
          sectionTitle: summaryToEdit.sectionTitle,
          sectionType: summaryToEdit.sectionType,
          content: summaryToEdit.summary?.content!,
        },
        {
          keepDefaultValues: true,
        }
      );
    }
  }, [summaryToEdit, reset]);

  const onSubmit = (data: z.infer<typeof AddSummarySectionFormSchema>) => {
    startTransition(async () => {
      const res = summaryToEdit
        ? await updateResumeSummary(data)
        : await addResumeSummary(data);
      if (!res.success) {
        toastError(tr(res.message));
      } else {
        reset();
        setDialogOpen(false);
        toastSuccess(tr("m159afa2227d6", {v0: summaryToEdit ? "updated" : "created"}));
      }
    });
  };

  const closeDialog = () => setDialogOpen(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="lg:max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>{pageTitle}</DialogTitle>
          <DialogDescription>{pageDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2"
          >
            {/* SECTION TITLE */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="sectionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("mcde8d07e9b3b")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={tr("m52754e232018")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* SUMMARY CONTENT */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m18e5becfd852")}</FormLabel>
                    <FormControl>
                      <TiptapEditor field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormDialogFooter
              onCancel={closeDialog}
              isPending={isPending}
              saveDisabled={!formState.isDirty}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddResumeSummary;
