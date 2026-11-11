"use client";
import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useTransition, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Loader } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
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
import SelectFormCtrl from "../Select";
import { toastActionResult } from "@/lib/toast";
import { JobStageTypeRef } from "@/models/jobStage.model";
import { JobStatus } from "@/models/job.model";
import {
  createJobStageType,
  updateJobStageType,
} from "@/actions/jobStageType.actions";

const AddJobStageTypeFormSchema = z.object({
  label: z
    .string({ error: message("m1c61e0ca7a15") })
    .min(1, { message: message("m215f93e1150b") })
    .max(80, { message: message("m309bb622510c") }),
  statusId: z
    .string({ error: message("m5129d03c4960") })
    .min(1, { message: message("me63ff0d44832") }),
});

type AddJobStageTypeProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: JobStageTypeRef | null;
  statuses: JobStatus[];
  reloadTypes: () => void;
};

function AddJobStageType({
  open,
  onOpenChange,
  type,
  statuses,
  reloadTypes,
}: AddJobStageTypeProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddJobStageTypeFormSchema>>({
    resolver: zodResolver(AddJobStageTypeFormSchema),
    defaultValues: { label: "", statusId: "" },
  });

  const { reset } = form;

  // A custom stage is most often an interview round, so that is the default.
  useEffect(() => {
    if (!open) return;
    reset({
      label: type?.label ?? "",
      statusId:
        type?.statusId ??
        statuses.find((s) => s.value === "interview")?.id ??
        "",
    });
  }, [open, type, statuses, reset]);

  const onSubmit = (values: z.infer<typeof AddJobStageTypeFormSchema>) => {
    startTransition(async () => {
      const res = type
        ? await updateJobStageType(
            type.id,
            values.label,
            values.statusId,
            type.sortOrder,
          )
        : await createJobStageType(values.label, values.statusId);
      toastActionResult(res, {
        success: `Stage has been ${type ? "updated" : "added"} successfully.`,
        onSuccess: () => {
          onOpenChange(false);
          reset();
          reloadTypes();
        },
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type ? tr("m4f415f933340") : tr("mf6a3f53c36ab")}
          </DialogTitle>
          <DialogDescription>
            {tr("mbfd867e245ab")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("m1f1e20e6cd8e")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tr("me215aaf161bf")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="statusId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{tr("mccf93fbd2851")}</FormLabel>
                  <SelectFormCtrl
                    label={tr("m073c1634c496")}
                    options={statuses}
                    field={field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tr("m19766ed6ccb2")}</Button>
              <Button type="submit" disabled={isPending}>
                {tr("m1509f561f241")}{isPending && (
                  <Loader className="ms-2 h-4 w-4 shrink-0 spinner" />
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddJobStageType;
