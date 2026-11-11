"use client";
import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ComboBox";
import AddContact from "@/components/AddContact";
import { toastActionResult } from "@/lib/toast";
import { addJobContact } from "@/actions/contact.actions";
import type { ContactRef, ContactRole } from "@/models/contact.model";
import type { Company, JobLocation } from "@/models/job.model";

const LinkContactSchema = z.object({
  contact: z.string().min(1, message("m6ae9a7053cc4")),
  contactRole: z.string().min(1, message("mb592e518913f")),
});

type LinkContactValues = z.infer<typeof LinkContactSchema>;

type AddJobContactFormProps = {
  jobId: string;
  contacts: ContactRef[];
  roles: ContactRole[];
  companies: Company[];
  locations: JobLocation[];
  onCancel: () => void;
  onLinked: () => void;
  onContactCreated: (contact: ContactRef) => void;
};

export function AddJobContactForm({
  jobId,
  contacts,
  roles,
  companies,
  locations,
  onCancel,
  onLinked,
  onContactCreated,
}: AddJobContactFormProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();
  const [newContactOpen, setNewContactOpen] = useState(false);
  // What the contact picker's search box holds, so "New contact" can carry it
  const [typedName, setTypedName] = useState("");

  const form = useForm<LinkContactValues>({
    resolver: zodResolver(LinkContactSchema),
    defaultValues: { contact: "", contactRole: "" },
  });

  const onSubmit = (values: LinkContactValues) => {
    startTransition(async () => {
      const res = await addJobContact(jobId, values.contact, values.contactRole);
      toastActionResult(res, {
        success: message("mf9cae6ba195b"),
        onSuccess: () => {
          form.reset();
          onLinked();
        },
      });
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-3"
      >
        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{tr("m2b5c3d26721a")}</FormLabel>
              <Combobox
                options={contacts}
                field={field}
                label={tr("m093e7d5fdbaa")}
                onSearchChange={setTypedName}
              />
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
              <Combobox options={roles} field={field} creatable label={tr("m4b168d88dc87")} />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="cursor-pointer" disabled={isPending}>
          {tr("m1509f561f241")}</Button>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onCancel}
        >
          {tr("m19766ed6ccb2")}</Button>
        <Button
          type="button"
          variant="link"
          className="cursor-pointer"
          onClick={() => setNewContactOpen(true)}
        >
          {tr("m48a930dd9ef4")}</Button>
      </form>

      {/* A contact has a dozen fields, so the picker has no creatable path:
          the typed name carries into the full dialog instead. */}
      <AddContact
        hideTrigger
        prefillName={typedName}
        dialogOpen={newContactOpen}
        setDialogOpen={setNewContactOpen}
        companies={companies}
        locations={locations}
        roles={roles}
        reloadContacts={() => {}}
        resetEditContact={() => {}}
        onSaved={(contact) => {
          onContactCreated(contact);
          form.setValue("contact", contact.id);
        }}
      />
    </Form>
  );
}
