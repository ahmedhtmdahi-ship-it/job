"use client";
import {useT} from "@/i18n/useT";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import ContactRow from "./ContactRow";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { deleteContactById } from "@/actions/contact.actions";
import { toastSuccess, toastError } from "@/lib/toast";
import { AlertDialog } from "@/models/alertDialog.model";
import type { Contact } from "@/models/contact.model";

type ContactsTableProps = {
  contacts: Contact[];
  reloadContacts: () => void;
  editContact: (id: string) => void;
  hideCompanyColumn?: boolean;
};

function ContactsTable({
  contacts,
  reloadContacts,
  editContact,
  hideCompanyColumn,
}: ContactsTableProps) {
  const tr = useT();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  // A link is meaningless without the person and JobContact cascades from
  // contactId, so the dialog warns about the links rather than blocking.
  const onDeleteContact = (contact: Contact) => {
    const jobs = contact._count?.jobLinks ?? 0;
    setAlert({
      openState: true,
      deleteAction: true,
      itemId: contact.id,
      title: jobs > 0 ? "Delete this contact?" : undefined,
      description:
        jobs > 0
          ? `${contact.name} is linked to ${jobs} job${jobs === 1 ? "" : "s"}. Deleting the contact removes those links. This cannot be undone.`
          : undefined,
    });
  };

  const deleteContact = async (contactId: string | undefined) => {
    if (contactId) {
      const { success, message } = await deleteContactById(contactId);
      if (success) {
        toastSuccess(tr("m9e6643970dfd"));
        reloadContacts();
      } else {
        toastError(message);
      }
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <span className="sr-only">{tr("m07548c2c6511")}</span>
            </TableHead>
            <TableHead>{tr("mdcd1d5223f73")}</TableHead>
            <TableHead className="hidden sm:table-cell">{tr("m7e8cd2056da7")}</TableHead>
            {!hideCompanyColumn && <TableHead>{tr("mde4743c87973")}</TableHead>}
            <TableHead>{tr("mc25337055464")}</TableHead>
            <TableHead>{tr("m2f17a0f8d518")}</TableHead>
            <TableHead>{tr("m9a1027dd5b23")}</TableHead>
            <TableHead>
              <span className="sr-only">{tr("mff8059dc6752")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact: Contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              expanded={expandedId === contact.id}
              onToggle={() =>
                setExpandedId((prev) =>
                  prev === contact.id ? null : contact.id,
                )
              }
              onEdit={() => editContact(contact.id)}
              onDelete={() => onDeleteContact(contact)}
              hideCompanyColumn={hideCompanyColumn}
            />
          ))}
        </TableBody>
      </Table>
      <DeleteAlertDialog
        pageTitle="contact"
        open={alert.openState}
        onOpenChange={() => setAlert({ openState: false, deleteAction: false })}
        onDelete={() => deleteContact(alert.itemId)}
        alertTitle={alert.title}
        alertDescription={alert.description}
        deleteAction={alert.deleteAction}
      />
    </>
  );
}

export default ContactsTable;
