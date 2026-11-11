"use client";

import {CONTACT_ROLES} from "@/lib/constants";
import {useT} from "@/i18n/useT";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContactRole } from "@/models/contact.model";

// Select cannot hold an empty-string value, so all-roles gets a sentinel
const ALL = "all";

type Props = {
  roles: ContactRole[];
  roleId?: string;
  onRoleChange: (roleId?: string) => void;
};

export function ContactRoleFilter({ roles, roleId, onRoleChange }: Props) {
  const tr = useT();

  return (
    <Select
      value={roleId ?? ALL}
      onValueChange={(v) => onRoleChange(v === ALL ? undefined : v)}
    >
      <SelectTrigger aria-label={tr("m67fd9c1a7c7d")} className="h-8 w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{tr("m78f133afd3ec")}</SelectItem>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {CONTACT_ROLES.some(item => item.value === role.value && item.label === role.label) ? tr(role.label) : role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
