import {useT} from "@/i18n/useT";
import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { FormControl } from "./ui/form";
import { ControllerRenderProps } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SelectProps {
  label: string;
  options: any[];
  field: ControllerRenderProps<any, any>;
  fullWidth?: boolean;
  localizeOptions?: boolean;
}

function SelectFormCtrl({ label, options, field, fullWidth, localizeOptions = false }: SelectProps) {
 const tr = useT();

  return (
    <>
      <Select
        onValueChange={field.onChange}
        value={field.value}
        name={field.name}
      >
        <FormControl>
          <SelectTrigger
            aria-label={tr("m84805b3f51e7", {v0: label})}
            className={cn(
              fullWidth ? "w-full" : "w-[200px]",
              "[&_[data-incomplete-hint]]:pointer-events-none",
            )}
          >
            <SelectValue placeholder={tr("m84805b3f51e7", {v0: label})} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectGroup>
            {options &&
              options.map((option) => {
                return (
                  <SelectItem
                    key={option.id}
                    value={option.id}
                    disabled={option.disabled}
                  >
                    {localizeOptions ? tr(option.label ?? option.value ?? option.title) : (option.label ?? option.value ?? option.title)}
                    {option.suffix}
                  </SelectItem>
                );
              })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}

export default SelectFormCtrl;
