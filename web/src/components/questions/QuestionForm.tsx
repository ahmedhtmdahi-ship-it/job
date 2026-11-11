"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createQuestion, updateQuestion } from "@/actions/question.actions";
import { Loader } from "lucide-react";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { useEffect, useState, useTransition } from "react";
import { AddQuestionFormSchema } from "@/models/addQuestionForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Question } from "@/models/question.model";
import { Tag } from "@/models/job.model";
import { z } from "zod";
import { toastSuccess, toastError } from "@/lib/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import TiptapEditor from "../TiptapEditor";
import { TagInput } from "../myjobs/TagInput";

type QuestionFormProps = {
  availableTags: Tag[];
  editQuestion?: Question | null;
  resetEditQuestion: () => void;
  onQuestionSaved: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
};

export function QuestionForm({
  availableTags,
  editQuestion,
  resetEditQuestion,
  onQuestionSaved,
  dialogOpen,
  setDialogOpen,
}: QuestionFormProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();
  const [localAvailableTags, setLocalAvailableTags] =
    useState<Tag[]>(availableTags);
  const form = useForm<z.infer<typeof AddQuestionFormSchema>>({
    resolver: zodResolver(AddQuestionFormSchema),
    defaultValues: {
      question: "",
      answer: uiMessage("m03626549a59a"),
      tagIds: [],
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (editQuestion) {
      reset({
        id: editQuestion.id,
        question: editQuestion.question,
        answer: editQuestion.answer || "",
        tagIds: editQuestion.tags?.map((t) => t.id) || [],
      });
      // Merge the question's own tags into the local pool so they're
      // selectable/visible even if they aren't in the availableTags prop yet
      // (e.g. just created in the Add dialog earlier in this page session).
      if (editQuestion.tags && editQuestion.tags.length > 0) {
        setLocalAvailableTags((prev) => {
          const existing = new Set(prev.map((t) => t.id));
          const incoming = editQuestion.tags!.filter(
            (t) => !existing.has(t.id),
          );
          return incoming.length > 0 ? [...prev, ...incoming] : prev;
        });
      }
    } else {
      reset({
        question: "",
        answer: uiMessage("m03626549a59a"),
        tagIds: [],
      });
    }
  }, [editQuestion, reset]);

  function onSubmit(data: z.infer<typeof AddQuestionFormSchema>) {
    startTransition(async () => {
      const { success, message } = editQuestion
        ? await updateQuestion(data)
        : await createQuestion(data);

      if (success) {
        toastSuccess(tr("ma606632ef277", {v0: editQuestion ? "updated" : "created"}));
        reset();
        setDialogOpen(false);
        resetEditQuestion();
        onQuestionSaved();
      } else {
        toastError(tr(message));
      }
    });
  }

  const pageTitle = editQuestion ? uiMessage("m9e26d3777ad5") : uiMessage("m1dc7ec5f8aed");
  const pageDescription = editQuestion
    ? uiMessage("m88402768e9d2")
    : uiMessage("mc2b3662fab85");

  const closeDialog = () => {
    reset();
    resetEditQuestion();
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogOverlay>
        <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="question-form-dialog-title">
              {tr(pageTitle)}
            </DialogTitle>
            <DialogDescription>{typeof pageDescription === "string" ? tr(pageDescription) : pageDescription}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-4 p-4"
            >
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m1fde33e11c58")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tr("mf1b8f374462b")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m1f7cbb22bb10")}</FormLabel>
                    <FormControl>
                      <TagInput
                        availableTags={localAvailableTags}
                        selectedTagIds={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m2be38687608f")}</FormLabel>
                    <FormControl>
                      <TiptapEditor field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="reset"
                  variant="outline"
                  className="mt-2 md:mt-0"
                  onClick={closeDialog}
                >
                  {tr("m19766ed6ccb2")}</Button>
                <Button type="submit">
                  {tr("m1509f561f241")}{isPending && (
                    <Loader className="h-4 w-4 shrink-0 spinner ms-2" />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}
