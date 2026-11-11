"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Combobox } from "./ComboBox";
import { DatePicker } from "./DatePicker";
import { FormDialogFooter } from "./FormDialogFooter";
import Loading from "./Loading";
import { toastActionResult } from "@/lib/toast";
import { createContact, updateContact } from "@/actions/contact.actions";
import {
  AddContactFormSchema,
  type ContactFormValues,
} from "@/models/addContactForm.schema";
import type { Contact, ContactRef, ContactRole } from "@/models/contact.model";
import type { Company, JobLocation } from "@/models/job.model";

type AddContactProps = {
  reloadContacts: () => void;
  editContact?: Contact | null;
  resetEditContact: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  companies: Company[];
  locations: JobLocation[];
  roles: ContactRole[];
  prefillName?: string;
  prefillCompanyId?: string;
  hideTrigger?: boolean;
  pickersLoading?: boolean;
  onSaved?: (contact: ContactRef) => void;
};

const REFERENCE_ROLE_VALUE = "reference";

const EMPTY_CONTACT: ContactFormValues = {
  name: "",
  title: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  company: "",
  location: "",
  relationship: "",
  workedAtCompany: "",
  contactRole: "",
  workedFrom: null,
  workedTo: null,
  notes: "",
  lastContactedAt: null,
};

// A labelled rule between field groups; spans both columns of the form grid
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:col-span-2 flex items-center gap-3 pt-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function AddContact({
  reloadContacts,
  editContact,
  resetEditContact,
  dialogOpen,
  setDialogOpen,
  companies,
  locations,
  roles,
  prefillName,
  prefillCompanyId,
  hideTrigger,
  pickersLoading,
  onSaved,
}: AddContactProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();

  const pageTitle = editContact ? uiMessage("m6b243902699b") : uiMessage("maeb71d6de03b");

  const prefilled: ContactFormValues = {
    ...EMPTY_CONTACT,
    ...(prefillName ? { name: prefillName } : {}),
    ...(prefillCompanyId ? { company: prefillCompanyId } : {}),
  };

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(AddContactFormSchema),
    defaultValues: prefilled,
  });

  const { reset } = form;

  // The shared-history fields only make sense for a reference
  const roleId = form.watch("contactRole");
  const isReference = roles.some(
    (role) => role.id === roleId && role.value === REFERENCE_ROLE_VALUE,
  );

  // Clear on an explicit role change only — an effect would also wipe the
  // history a non-reference contact was saved with the moment you open it
  const onRoleChange = (
    field: { onChange: (value: string) => void },
    value: string,
  ) => {
    field.onChange(value);
    const stillReference = roles.some(
      (role) => role.id === value && role.value === REFERENCE_ROLE_VALUE,
    );
    if (stillReference) return;
    form.setValue("relationship", "");
    form.setValue("workedAtCompany", "");
    form.setValue("workedFrom", null);
    form.setValue("workedTo", null);
  };

  useEffect(() => {
    if (editContact) {
      reset(
        {
          id: editContact.id,
          name: editContact.name ?? "",
          title: editContact.title ?? "",
          email: editContact.email ?? "",
          phone: editContact.phone ?? "",
          linkedinUrl: editContact.linkedinUrl ?? "",
          company: editContact.companyId ?? "",
          location: editContact.locationId ?? "",
          relationship: editContact.relationship ?? "",
          workedAtCompany: editContact.workedAtCompanyId ?? "",
          contactRole: editContact.roleId ?? "",
          workedFrom: editContact.workedFrom ?? null,
          workedTo: editContact.workedTo ?? null,
          notes: editContact.notes ?? "",
          lastContactedAt: editContact.lastContactedAt ?? null,
        },
        { keepDefaultValues: true },
      );
    } else if (dialogOpen && (prefillName || prefillCompanyId)) {
      reset(
        {
          ...EMPTY_CONTACT,
          ...(prefillName ? { name: prefillName } : {}),
          ...(prefillCompanyId ? { company: prefillCompanyId } : {}),
        },
        { keepDefaultValues: true },
      );
    }
  }, [editContact, prefillName, prefillCompanyId, dialogOpen, reset]);

  const openDialog = () => {
    if (!editContact) {
      reset();
      resetEditContact();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const onSubmit = (values: ContactFormValues) => {
    startTransition(async () => {
      const res = editContact
        ? await updateContact({ ...values, id: editContact.id })
        : await createContact(values);
      const name = values.name.trim();
      toastActionResult(res, {
        success: editContact ? tr("m7aaa00602fee") : tr("m5a4307adf00a"),
        onSuccess: () => {
          onSaved?.({ id: res.data.id, label: name, value: name.toLowerCase() });
          reset();
          setDialogOpen(false);
          resetEditContact();
          reloadContacts();
        },
      });
    });
  };

  return (
    <>
      {!hideTrigger && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={openDialog}
          data-testid="add-contact-btn"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {tr("m3fe263538d19")}</span>
        </Button>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr(pageTitle)}</DialogTitle>
          </DialogHeader>
          {pickersLoading && <Loading />}
          {!pickersLoading && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("mdcd1d5223f73")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tr("m45f92d008bfb")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m7e8cd2056da7")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tr("m9b148149d954")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m969ccbd3cf63")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={tr("m35d973d92927")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m63dceb8800b2")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tr("m84498016d1f8")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr("m8f1ce6b75bb1")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tr("m57176c8e70e7")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SectionHeading>{tr("m8477c1986efe")}</SectionHeading>

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("mde4743c87973")}</FormLabel>
                    <Combobox options={companies} field={field} creatable fullWidth />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m15b61974b270")}</FormLabel>
                    <Combobox options={locations} field={field} creatable fullWidth />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactRole"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m14736a2eb9f4")}</FormLabel>
                    <Combobox
                      options={roles}
                      field={{
                        ...field,
                        onChange: (value: string) => onRoleChange(field, value),
                      }}
                      creatable
                      fullWidth
                      label={tr("m4b168d88dc87")}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isReference && (
                <>
                  <SectionHeading>{tr("m7b7c14ee0bc6")}</SectionHeading>

                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr("m25490a10d071")}</FormLabel>
                        <FormControl>
                          <Input placeholder={tr("md455df343d79")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workedAtCompany"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{tr("m038a357b901d")}</FormLabel>
                        <Combobox
                          options={companies}
                          field={field}
                          creatable
                          fullWidth
                          label={tr("mf168ccdd9154")}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* captionLayout gives the year dropdown: a 2019 start date is
                      otherwise a lot of clicking */}
                  <FormField
                    control={form.control}
                    name="workedFrom"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{tr("m218197693424")}</FormLabel>
                        <DatePicker
                          field={field}
                          presets={false}
                          isEnabled
                          captionLayout
                          fullWidth
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workedTo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{tr("mf4b06ef6d3c8")}</FormLabel>
                        <DatePicker
                          field={field}
                          presets={false}
                          isEnabled
                          captionLayout
                          fullWidth
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <SectionHeading>{tr("m09b2d9cd1123")}</SectionHeading>

              <FormField
                control={form.control}
                name="lastContactedAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m9a1027dd5b23")}</FormLabel>
                    <DatePicker
                      field={field}
                      presets={false}
                      isEnabled
                      captionLayout
                      fullWidth
                      disableFuture
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr("m8a7525b1492f")}</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-24"
                          placeholder={tr("m03dc613fe47a")}
                          {...field}
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
                saveDisabled={isPending}
              />
            </form>
          </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddContact;
