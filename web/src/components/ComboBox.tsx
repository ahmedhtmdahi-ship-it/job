"use client";

import {useT} from "@/i18n/useT";
import {JOB_SOURCES, CONTACT_ROLES, JOB_STATUSES} from "@/lib/constants";
import { Check, ChevronsUpDown, CirclePlus, Loader } from "lucide-react";
import { ControllerRenderProps } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useTransition } from "react";
import { delay } from "@/utils/delay";
import { createLocation } from "@/actions/job.actions";
import { JobForm } from "@/models/job.model";
import { addCompany } from "@/actions/company.actions";
import { createJobTitle } from "@/actions/jobtitle.actions";
import { toastError } from "@/lib/toast";
import { createActivityType } from "@/actions/activity.actions";
import { createJobSource } from "@/actions/job.actions";
import { createContactRole } from "@/actions/contactRole.actions";

interface ComboboxProps {
  options: any[];
  field: ControllerRenderProps<any, any>;
  creatable?: boolean;
  freeText?: boolean;
  label?: string;
  onSearchChange?: (search: string) => void;
  // Opt out of the default fixed trigger width when the field sits in a grid
  fullWidth?: boolean;
}

export function Combobox({
  options,
  field,
  creatable,
  freeText,
  label,
  onSearchChange,
  fullWidth,
}: ComboboxProps) {
  const tr = useT();

  // Placeholder text only; the accessible name comes from FormLabel/FormControl
  const displayName = tr(label ?? field.name);
  const defaults = field.name === "source" ? JOB_SOURCES : field.name === "contactRole" ? CONTACT_ROLES : field.name === "status" ? JOB_STATUSES : [];
  const optionLabel = (option: {label: string; value?: string}) => defaults.some(item => item.value === option.value && item.label === option.label) ? tr(option.label) : option.label;
  const [newOption, setNewOption] = useState<string>("");
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    // Scope to this Command; a global query matches other mounted cmdk lists
    const hasHighlightedItem = !!e.currentTarget
      .closest("[cmdk-root]")
      ?.querySelector('[cmdk-item][aria-selected="true"]');

    if (hasHighlightedItem) return;

    if (!creatable) return;

    const label = newOption.trim();
    if (!label) return;

    e.preventDefault();
    onCreateOption(label);
    setNewOption("");
  };
  const onCreateOption = (label: string) => {
    if (!label) return;
    // A free-text field has no reference record behind it — the typed text is
    // itself the stored value, so there is nothing to create server-side.
    if (freeText) {
      // CommandEmpty's onClick passes the raw input; only Enter pre-trims
      field.onChange(label.trim());
      setIsPopoverOpen(false);
      return;
    }
    startTransition(async () => {
      let response;
      switch (field.name) {
        case "company":
          const res = await addCompany({ company: label });
          response = res.data;
          break;
        case "title":
          response = await createJobTitle(label);
          break;
        case "location":
          const { data, success, message } = await createLocation(label);
          if (!success) {
            toastError(tr(message));
          }
          response = data;
          break;
        case "source":
          const sourceRes = await createJobSource(label);
          if (!sourceRes.success) {
            toastError(tr(sourceRes.message));
          }
          response = sourceRes.data;
          if (!sourceRes.success) return;
          break;
        case "workedAtCompany":
          const workedRes = await addCompany({ company: label });
          response = workedRes.data;
          break;
        case "contactRole":
          const roleRes = await createContactRole(label);
          if (!roleRes.success) {
            toastError(tr(roleRes.message));
            return;
          }
          response = roleRes.data;
          break;
        case "activityType":
          response = await createActivityType(label);
          break;
        default:
          break;
      }
      if (!response?.id) return;
      options.unshift(response);
      field.onChange(response.id);
      setIsPopoverOpen(false);
    });
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "justify-between",
              fullWidth ? "w-full" : "md:w-[240px] lg:w-[280px]",
              !field.value && "text-muted-foreground"
            )}
          >
            <span className="min-w-0 truncate">
              {field.value
                ? (options.find((option) => option.id === field.value) ? optionLabel(options.find((option) => option.id === field.value)) : (freeText ? field.value : null))
                : tr("m84805b3f51e7", {v0: displayName})}
            </span>

            {isPending ? (
              <Loader className="h-4 w-4 shrink-0 spinner" />
            ) : (
              <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0",
          fullWidth
            ? "w-(--radix-popover-trigger-width)"
            : "md:w-[240px] lg:w-[280px]"
        )}
      >
        <Command
          filter={(value, search, keywords) =>
            [value, ...(keywords ?? [])].join(" ").toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput
            value={newOption}
            onValueChange={(val: string) => {
              setNewOption(val);
              onSearchChange?.(val);
            }}
            placeholder={tr("ma4b0e8811bd6", {v0: creatable ? tr("m5a5684f36c43") : "", v1: displayName})}
            onKeyDown={(e) => handleEnterKey(e)}
          />
          <CommandList>
            <CommandEmpty
              onClick={() => {
                onCreateOption(newOption);
                setNewOption("");
              }}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-1 italic mt-2",
                !newOption && "text-muted-foreground cursor-default"
              )}
            >
              {creatable ? (
                <>
                  <CirclePlus className="h-4 w-4" />
                  <p>{tr("m02184950e3ed")}{" "}</p>
                  <p className="block max-w-48 truncate font-semibold text-primary">
                    {newOption}
                  </p>
                </>
              ) : (
                <p className="font-semibold text-primary">{tr("me28235306e05")}</p>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  value={option.value}
                  keywords={[optionLabel(option)]}
                  key={option.id}
                  onSelect={() => {
                    if (field.onChange) {
                      field.onChange(option.id);
                      setIsPopoverOpen(false);
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "me-2 h-4 w-4",
                      option.id === field.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {optionLabel(option)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
