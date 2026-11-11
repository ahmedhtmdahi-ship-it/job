"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { AddCertificationFormSchema } from "@/models/addCertificationForm.schema";
import { LicenseOrCertification, ResumeSection } from "@/models/profile.model";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { FormDialogFooter } from "../FormDialogFooter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { DatePicker } from "../DatePicker";
import { Switch } from "../ui/switch";
import { useEffect, useTransition } from "react";
import { toastSuccess, toastError } from "@/lib/toast";
import {
  addCertification,
  updateCertification,
} from "@/actions/profile.actions";

type AddCertificationProps = {
  resumeId: string | undefined;
  sectionId: string | undefined;
  dialogOpen: boolean;
  setDialogOpen: (e: boolean) => void;
  certificationToEdit?: ResumeSection;
};

function AddCertification({
  resumeId,
  sectionId,
  dialogOpen,
  setDialogOpen,
  certificationToEdit,
}: AddCertificationProps) {
  const tr = useT();

  const pageTitle = certificationToEdit
    ? uiMessage("m5b232c102802")
    : uiMessage("m66f8e8fe4883");
  const pageDescription = certificationToEdit
    ? uiMessage("meef81924621b")
    : uiMessage("m450126645882");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddCertificationFormSchema>>({
    resolver: zodResolver(AddCertificationFormSchema),
    defaultValues: {
      resumeId,
      sectionId,
      noExpiration: false,
    },
  });

  const { watch, reset, formState, resetField } = form;
  const noExpirationValue = watch("noExpiration");

  useEffect(() => {
    if (certificationToEdit) {
      const cert: LicenseOrCertification =
        certificationToEdit?.licenseOrCertifications?.at(0)!;
      reset(
        {
          id: cert?.id,
          title: cert?.title,
          organization: cert?.organization,
          issueDate: cert?.issueDate ? new Date(cert.issueDate) : undefined,
          expirationDate: cert?.expirationDate
            ? new Date(cert.expirationDate)
            : undefined,
          credentialUrl: cert?.credentialUrl ?? "",
          noExpiration: !cert?.expirationDate,
        },
        { keepDefaultValues: true },
      );
    } else {
      reset(
        {
          resumeId,
          sectionId,
        },
        { keepDefaultValues: true },
      );
    }
  }, [certificationToEdit, resumeId, sectionId, reset]);

  const onNoExpirationChange = (checked: boolean) => {
    if (checked) {
      resetField("expirationDate");
    }
  };

  const onSubmit = (data: z.infer<typeof AddCertificationFormSchema>) => {
    startTransition(async () => {
      const res = certificationToEdit?.licenseOrCertifications?.length
        ? await updateCertification(data)
        : await addCertification(data);
      if (!res.success) {
        toastError(tr(res.message));
      } else {
        reset();
        setDialogOpen(false);
        toastSuccess(tr("m6781bae1aba2", {v0: certificationToEdit ? "updated" : "added"}));
      }
    });
  };

  const closeDialog = () => setDialogOpen(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="h-full md:h-[85%] lg:max-h-screen md:max-w-[40rem] overflow-y-scroll">
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
            {!sectionId && (
              <>
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="sectionTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr("mcde8d07e9b3b")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder={tr("m093b26a0ea6b")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <hr className="md:col-span-2" />
              </>
            )}

            {/* CERTIFICATION TITLE */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m53abe2b20f23")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder={tr("m9f6b96c84ffe")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ORGANIZATION */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m756413902ac1")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder={tr("m82438be8d7cd")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ISSUE DATE */}
            <div className="flex flex-col">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m496372bfbc72")}</FormLabel>
                    <DatePicker
                      field={field}
                      presets={false}
                      isEnabled={true}
                      captionLayout={true}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* EXPIRATION DATE */}
            <div className="flex flex-col">
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("md93e003a1bcf")}</FormLabel>
                    <DatePicker
                      field={field}
                      presets={false}
                      isEnabled={!noExpirationValue}
                      captionLayout={true}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* NO EXPIRATION */}
            <div className="flex items-center">
              <FormField
                control={form.control}
                name="noExpiration"
                render={({ field }) => (
                  <FormItem className="flex flex-row">
                    <Switch
                      checked={field.value}
                      onCheckedChange={(c) => {
                        field.onChange(c);
                        onNoExpirationChange(c);
                      }}
                    />
                    <FormLabel className="flex items-center ms-4 mb-2">
                      {field.value ? tr("me21db2d2b84d") : tr("m4e35e338a125")}
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CREDENTIAL URL */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="credentialUrl"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("med4eee9d7295")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder={tr("m1919d6eaaab3")}
                      />
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

export default AddCertification;
