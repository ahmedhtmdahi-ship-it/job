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
import { toastActionResult } from "@/lib/toast";
import { createContactRole } from "@/actions/contactRole.actions";

const AddContactRoleFormSchema = z.object({
  label: z
    .string({ error: message("mfd852f103ceb") })
    .min(1, { message: message("m1ba3f7b9039d") })
    .max(60, { message: message("m899e6a27217a") }),
});

type AddContactRoleProps = {
  reloadRoles: () => void;
};

function AddContactRole({ reloadRoles }: AddContactRoleProps) {
  const tr = useT();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddContactRoleFormSchema>>({
    resolver: zodResolver(AddContactRoleFormSchema),
    defaultValues: { label: "" },
  });

  const { reset } = form;

  const openDialog = () => {
    reset();
    setDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof AddContactRoleFormSchema>) => {
    startTransition(async () => {
      const res = await createContactRole(values.label);
      toastActionResult(res, {
        success: "Role has been added successfully.",
        onSuccess: () => {
          setDialogOpen(false);
          reset();
          reloadRoles();
        },
      });
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
          {tr("m0097c51ff978")}</span>
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("m8777ae2fbb3b")}</DialogTitle>
            <DialogDescription>
              {tr("m0564bc2b4e9a")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m1c05faf01fdb")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tr("m9db9f9ded34a")} {...field} />
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

export default AddContactRole;
