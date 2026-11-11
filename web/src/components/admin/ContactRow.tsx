"use client";
import {useT} from "@/i18n/useT";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { TableCell, TableRow } from "../ui/table";
import type { Contact } from "@/models/contact.model";

type ContactRowProps = {
  contact: Contact;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  hideCompanyColumn?: boolean;
};

function overlapLabel(contact: Contact) {
  if (!contact.workedFrom) return null;
  const to = contact.workedTo ? format(contact.workedTo, "MMM yyyy") : "present";
  return `${format(contact.workedFrom, "MMM yyyy")} – ${to}`;
}

function ContactRow({
  contact,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  hideCompanyColumn,
}: ContactRowProps) {
  const tr = useT();

  const links = contact.jobLinks ?? [];
  // The standing role first, then any per-job role it does not already cover
  const roles = Array.from(
    new Map([
      ...(contact.Role ? [[contact.Role.id, contact.Role.label]] : []),
      ...links.map((link) => [link.Role.id, link.Role.label]),
    ] as [string, string][]).entries(),
  );
  const overlap = overlapLabel(contact);
  const hasContactBlock =
    contact.email || contact.phone || contact.linkedinUrl || contact.Location;
  const hasHistoryBlock =
    contact.relationship || contact.WorkedAtCompany || overlap;

  return (
    <>
      <TableRow>
        <TableCell className="w-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={`${expanded ? tr("mbe6eb1fc3b05") : tr("m07548c2c6511")} ${contact.name}`}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="rtl-mirror h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{contact.name}</TableCell>
        <TableCell className="hidden sm:table-cell">
          {contact.title ?? "—"}
        </TableCell>
        {!hideCompanyColumn && (
          <TableCell>{contact.Company?.label ?? "—"}</TableCell>
        )}
        <TableCell>
          {roles.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {roles.map(([id, label]) => (
                <Badge
                  key={id}
                  variant={
                    id === contact.roleId ? "default" : "secondary"
                  }
                >
                  {label}
                </Badge>
              ))}
            </span>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell>{contact._count?.jobLinks ?? 0}</TableCell>
        <TableCell>
          {contact.lastContactedAt ? format(contact.lastContactedAt, "PP") : "—"}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">{tr("mc02651240c87")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{tr("mff8059dc6752")}</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
                <Pencil className="me-2 h-4 w-4" />
                {tr("m6b243902699b")}</DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={onDelete}
              >
                <Trash className="me-2 h-4 w-4" />
                {tr("me2d0a54968ea")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={hideCompanyColumn ? 7 : 8} className="bg-muted/40">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              {hasContactBlock && (
                <div className="space-y-1">
                  {contact.email && (
                    <div>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && <div>{contact.phone}</div>}
                  {contact.linkedinUrl && (
                    <div>
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {tr("mdd84425b72da")}</a>
                    </div>
                  )}
                  {contact.Location && <div>{contact.Location.label}</div>}
                </div>
              )}
              {hasHistoryBlock && (
                <div className="space-y-1">
                  <div className="font-medium text-muted-foreground">
                    {tr("m7b7c14ee0bc6")}</div>
                  {contact.relationship && <div>{contact.relationship}</div>}
                  {contact.WorkedAtCompany && (
                    <div>{contact.WorkedAtCompany.label}</div>
                  )}
                  {overlap && (
                    <div className="text-muted-foreground">{overlap}</div>
                  )}
                </div>
              )}
              {contact.notes && (
                <p className="sm:col-span-2 whitespace-pre-wrap">
                  {contact.notes}
                </p>
              )}
              {links.length > 0 && (
                <ul className="sm:col-span-2 space-y-1">
                  {links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={`/dashboard/myjobs/${link.Job?.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {link.Job?.JobTitle.label} {tr("mb1d6b91b67c2")}{link.Job?.Company.label}
                      </Link>
                      {" — "}
                      {link.Role.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default ContactRow;
