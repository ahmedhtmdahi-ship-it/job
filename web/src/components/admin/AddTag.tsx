"use client";
import {message} from "@/i18n/message";
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
import { createTag } from "@/actions/tag.actions";

const AddTagFormSchema = z.object({
  label: z
    .string({ error: message("m7791058576d6") })
    .min(1, { message: message("ma46d5ff87f5c") })
    .max(60, { message: message("ma048b584aaf2") }),
});

type AddTagProps = {
  reloadTags: () => void;
};

function AddTag({ reloadTags }: AddTagProps) {
  const tr = useT();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddTagFormSchema>>({
    resolver: zodResolver(AddTagFormSchema),
    defaultValues: { label: "" },
  });

  const { reset } = form;

  const openDialog = () => {
    reset();
    setDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof AddTagFormSchema>) => {
    startTransition(async () => {
      const result = await createTag(values.label);
      if (result?.success) {
        toastSuccess(tr("m3bd1fb161c57"));
        setDialogOpen(false);
        reset();
        reloadTags();
      } else {
        toastError(result?.message ?? message("m8cb9c68b3a31"));
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
          {tr("m7fe2a91dd453")}</span>
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("m151ebbbeafe7")}</DialogTitle>
            <DialogDescription>
              {tr("m5998a3e303f9")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m72588b0c1d10")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tr("mb0d96427bede")} {...field} />
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

export default AddTag;
