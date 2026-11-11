"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useEffect, useState, useTransition } from "react";
import { X, ChevronsUpDown, CirclePlus, Loader } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag } from "@/models/job.model";
import { createTag } from "@/actions/tag.actions";
import { toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { APP_CONSTANTS } from "@/lib/constants";

interface TagInputProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onChange: (ids: string[]) => void;
  max?: number;
  placeholder?: string;
  noun?: string;
  onTagCreated?: (tag: Tag) => void;
}

export function TagInput({
  availableTags,
  selectedTagIds,
  onChange,
  max = APP_CONSTANTS.MAX_JOB_TAGS,
  placeholder = uiMessage("m15d1cc7d7753"),
  noun = "skills",
  onTagCreated,
}: TagInputProps) {
  const tr = useT();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [localTags, setLocalTags] = useState<Tag[]>(availableTags);
  const [isPending, startTransition] = useTransition();

  // availableTags can load after mount (e.g. fetched once the dialog opens).
  // Merge new tags into the local pool so chips and options reflect the prop,
  // while preserving tags created locally during this session.
  useEffect(() => {
    setLocalTags((prev) => {
      const ids = new Set(prev.map((t) => t.id));
      const merged = [...prev];
      for (const t of availableTags) {
        if (!ids.has(t.id)) merged.push(t);
      }
      return merged;
    });
  }, [availableTags]);

  // Map over the ids, not the pool: the pool arrives sorted by label, so
  // filtering it would render chips alphabetically instead of in the order the
  // user picked them — the order callers persist and render.
  const tagsById = new Map(localTags.map((t) => [t.id, t]));
  const selectedTags = selectedTagIds
    .map((id) => tagsById.get(id))
    .filter((t): t is Tag => !!t);
  const isMaxReached = selectedTagIds.length >= max;

  // Tags not yet selected, filtered by input
  const filteredOptions = localTags.filter(
    (t) =>
      !selectedTagIds.includes(t.id) &&
      t.label.toLowerCase().includes(inputValue.toLowerCase()),
  );

  // Whether the typed value exactly matches an existing tag (case-insensitive)
  const exactMatchExists = localTags.some(
    (t) => t.value === inputValue.trim().toLowerCase(),
  );

  const addTagById = (id: string) => {
    if (selectedTagIds.length >= max) return;
    onChange([...selectedTagIds, id]);
  };

  const removeTagById = (id: string) => {
    onChange(selectedTagIds.filter((tid) => tid !== id));
  };

  const handleCreate = () => {
    const label = inputValue.trim();
    if (!label || isMaxReached) return;

    startTransition(async () => {
      const result = await createTag(label);
      if (!result?.success) {
        toastError(result?.message ?? uiMessage("m8cb9c68b3a31"));
        return;
      }
      const newTag: Tag = result.data;
      // Add to local pool if not already there
      setLocalTags((prev) =>
        prev.some((t) => t.id === newTag.id) ? prev : [...prev, newTag],
      );
      addTagById(newTag.id);
      onTagCreated?.(newTag);
      setInputValue("");
      setOpen(false);
    });
  };

  const handleSelect = (tagId: string) => {
    addTagById(tagId);
    setInputValue("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-label={placeholder}
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              isMaxReached && "opacity-50 cursor-not-allowed",
            )}
            disabled={isMaxReached}
            type="button"
          >
            {isMaxReached ? tr("m4cea11cc012d", {v0: max, v1: noun}) : placeholder}
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={tr("m9b0854dcbeca")}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {filteredOptions.length === 0 && !inputValue && (
                <CommandEmpty>{tr("m32bddf99233e")}</CommandEmpty>
              )}
              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleSelect(tag.id)}
                    >
                      {tag.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {inputValue.trim() && !exactMatchExists && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreate}
                    disabled={isPending || isMaxReached}
                    className="text-primary"
                  >
                    {isPending ? (
                      <Loader className="me-2 h-4 w-4 spinner" />
                    ) : (
                      <CirclePlus className="me-2 h-4 w-4" />
                    )}
                    {tr("mbe47ce3c891d")}{inputValue.trim()}{tr("m497558230027")}</CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1 pe-1">
              {tag.label}
              <button
                type="button"
                onClick={() => removeTagById(tag.id)}
                className="ms-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label={tr("m9fc9271b9acf", {v0: tag.label})}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
