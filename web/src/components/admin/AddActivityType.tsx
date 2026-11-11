"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useTransition, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Loader, PlusCircle } from "lucide-react";
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
import { toastSuccess, toastError } from "@/lib/toast";
import { createActivityType } from "@/actions/activity.actions";

const AddActivityTypeFormSchema = z.object({
  label: z
    .string({ error: uiMessage("m9a9f9fcee0e6") })
    .min(1, { message: uiMessage("m127a317e31d5") })
    .max(60, {
      message: uiMessage("mbbb9fc69a5b0"),
    }),
});

type AddActivityTypeProps = {
  reloadActivityTypes: () => void;
};

function AddActivityType({ reloadActivityTypes }: AddActivityTypeProps) {
  const tr = useT();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddActivityTypeFormSchema>>({
    resolver: zodResolver(AddActivityTypeFormSchema),
    defaultValues: { label: "" },
  });

  const { reset } = form;

  const openDialog = () => {
    reset();
    setDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof AddActivityTypeFormSchema>) => {
    startTransition(async () => {
      try {
        await createActivityType(values.label);
        toastSuccess(tr("m38c787276a6c"));
        setDialogOpen(false);
        reset();
        reloadActivityTypes();
      } catch {
        toastError(tr("mec99a299236f"));
      }
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1"
        onClick={openDialog}
      >
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          {tr("m40ef457705ab")}</span>
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("m164d6fa1a353")}</DialogTitle>
            <DialogDescription>
              {tr("mff94695d69ba")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("md56238f52ac9")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tr("m462e0336abd2")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
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
    </>
  );
}

export default AddActivityType;
