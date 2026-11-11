"use client";
import {useT} from "@/i18n/useT";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ComboBox";
import { DatePicker } from "@/components/DatePicker";
import { TimePicker } from "@/components/TimePicker";
import SelectFormCtrl from "@/components/Select";
import { toastActionResult } from "@/lib/toast";
import { STAGE_OUTCOMES } from "@/lib/constants";
import { addJobStage, updateJobStage } from "@/actions/jobStage.actions";
import {
  AddJobStageFormSchema,
  type AddJobStageValues,
  type JobStage,
  type JobStageTypeRef,
} from "@/models/jobStage.model";
import type { JobStatus } from "@/models/job.model";

type AddStageDialogProps = {
  open: boolean;
  jobId: string;
  jobLabel: string;
  stage: JobStage | null;
  stageTypes: JobStageTypeRef[];
  jobStatuses: JobStatus[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

const OUTCOME_OPTIONS = STAGE_OUTCOMES.map((o) => ({
  id: o.value,
  label: o.label,
}));

// Adding a stage is almost always recording something that just happened, so
// the pickers open on now. Clear the date (click the selected day again) for
// a stage whose date isn't known yet.
const emptyValues = (jobId: string): AddJobStageValues => ({
  jobId,
  stageTypeId: "",
  customLabel: "",
  customStatusId: "",
  date: new Date(),
  time: format(new Date(), "hh:mm a"),
  notes: "",
  outcome: null,
  durationMins: null,
  format: "",
  location: "",
  setAsCurrent: true,
});

const editValues = (jobId: string, stage: JobStage): AddJobStageValues => ({
  ...emptyValues(jobId),
  id: stage.id,
  stageTypeId: stage.stageTypeId,
  date: stage.occurredAt ?? null,
  time: stage.occurredAt ? format(stage.occurredAt, "hh:mm a") : "",
  notes: stage.notes ?? "",
  outcome: stage.outcome ?? null,
  durationMins: stage.durationMins ?? null,
  format: stage.format ?? "",
  location: stage.location ?? "",
  setAsCurrent: stage.isCurrent,
});

export function AddStageDialog({
  open,
  jobId,
  jobLabel,
  stage,
  stageTypes,
  jobStatuses,
  onOpenChange,
  onSaved,
}: AddStageDialogProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();

  const form = useForm<AddJobStageValues>({
    resolver: zodResolver(AddJobStageFormSchema) as any,
    defaultValues: emptyValues(jobId),
  });

  const { reset } = form;

  // The host renders this dialog permanently and only flips `open`, so it
  // cannot call reset() itself — the same reason AddContact resets on open.
  useEffect(() => {
    if (!open) return;
    reset(stage ? editValues(jobId, stage) : emptyValues(jobId), {
      keepDefaultValues: true,
    });
  }, [open, stage, jobId, reset]);

  const customLabel = form.watch("customLabel");
  const isCustom = !!customLabel?.trim();
  const statusValue = isCustom
    ? jobStatuses.find((s) => s.id === form.watch("customStatusId"))?.value
    : stageTypes.find((t) => t.id === form.watch("stageTypeId"))?.Status?.value;
  const showInterviewFields = statusValue === "interview";

  // Nothing demotes a stage: stageDataFrom never writes isCurrent, so an
  // unticked box here would save without error and change nothing.
  const currentLocked = !!stage?.isCurrent;

  const onSubmit = (values: AddJobStageValues) => {
    startTransition(async () => {
      const res = stage
        ? await updateJobStage({ ...values, id: stage.id })
        : await addJobStage(values);
      toastActionResult(res, {
        success: `Stage has been ${stage ? "updated" : "added"} successfully`,
        onSuccess: () => {
          onSaved();
          onOpenChange(false);
        },
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stage ? tr("m4f415f933340") : tr("mafe6f5a22533")}</DialogTitle>
          <DialogDescription>{jobLabel}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
            <FormField
              control={form.control}
              name="stageTypeId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{tr("maf90e3e0428e")}</FormLabel>
                  <div data-testid="stage-type-select">
                    <Combobox
                      options={stageTypes}
                      field={field}
                      fullWidth
                      label={tr("mc7ff6dcd94d7")}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("md057086f9723")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tr("m231b3f66af10")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCustom && (
              <FormField
                control={form.control}
                name="customStatusId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("mc1e821ab2576")}</FormLabel>
                    <SelectFormCtrl
                      label={tr("m073c1634c496")}
                      options={jobStatuses}
                      field={field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m17f9a0a512ab")}</FormLabel>
                    <DatePicker
                      field={field}
                      presets={false}
                      isEnabled
                      captionLayout
                      futureYears={10}
                      fullWidth
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m5888675d99b9")}</FormLabel>
                    <TimePicker field={field} fullWidth />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showInterviewFields && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr("m795349a1babd")}</FormLabel>
                      <FormControl>
                        <Input placeholder={tr("m4d41a686afbf")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationMins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr("m3ac94c4b23d8")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr("mec4ecc14f8b5")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={tr("mea4fc1f825b1")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {stage && (
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("mbbb4fa4eb2ae")}</FormLabel>
                    <SelectFormCtrl
                      label={tr("m25a63e52a98f")}
                      options={OUTCOME_OPTIONS}
                      field={{ ...field, value: field.value ?? "" }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("m6e884c99820c")}</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-20"
                      placeholder={tr("m13e7c85e9a80")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setAsCurrent"
              render={({ field }) => (
                <FormItem>
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0"
                      checked={!!field.value}
                      disabled={currentLocked}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="text-[13px]">{tr("me55d3e99a32c")}</span>
                  </label>
                  {currentLocked && (
                    <p className="text-xs text-muted-foreground">
                      {tr("mceee9c148872")}</p>
                  )}
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
                {stage ? tr("m35322b5bb5a2") : tr("mafe6f5a22533")}
                {isPending && <Loader className="h-4 w-4 shrink-0 spinner" />}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
