"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useEffect, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast";
import { TagInput } from "../myjobs/TagInput";
import { Tag } from "@/models/job.model";
import { ResumeSection, Skill } from "@/models/profile.model";
import { addSkillsSection, updateSkillsSection } from "@/actions/profile.actions";
import { getAllTags } from "@/actions/tag.actions";
import { APP_CONSTANTS } from "@/lib/constants";
import {
  AddSkillsFormSchema,
  UpdateSkillsFormSchema,
} from "@/models/skills.schema";
type AddSkillsProps = {
  resumeId: string | undefined;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  skillsToEdit?: ResumeSection | null;
};

function AddSkills({
  resumeId,
  dialogOpen,
  setDialogOpen,
  skillsToEdit,
}: AddSkillsProps) {
  const tr = useT();

  const isEditing = !!skillsToEdit;
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddSkillsFormSchema>>({
    resolver: zodResolver(AddSkillsFormSchema),
    defaultValues: {
      resumeId: resumeId ?? "",
      sectionTitle: uiMessage("mf0518e5e8dfc"),
      categories: [{ label: "", tagIds: [] }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  useEffect(() => {
    if (!dialogOpen) return;
    getAllTags().then((tags) => {
      if (Array.isArray(tags)) {
        setAllTags(tags);
      } else {
        toastError(tr("ma4b68f3f5999"));
      }
    });

    if (isEditing && skillsToEdit) {
      const skills = [...(skillsToEdit.skills ?? [])].sort(
        (a, b) => a.order - b.order,
      );
      // Group by category preserving insertion order
      const categoryMap = new Map<string, Skill[]>();
      for (const skill of skills) {
        const key = skill.category ?? "";
        if (!categoryMap.has(key)) categoryMap.set(key, []);
        categoryMap.get(key)!.push(skill);
      }
      const categories = Array.from(categoryMap.entries()).map(
        ([label, items]) => ({
          label,
          tagIds: items.map((s) => s.tagId),
        }),
      );
      form.reset({
        resumeId: resumeId ?? "",
        sectionTitle: skillsToEdit.sectionTitle,
        categories: categories.length > 0 ? categories : [{ label: "", tagIds: [] }],
      });
    } else {
      form.reset({
        resumeId: resumeId ?? "",
        sectionTitle: uiMessage("mf0518e5e8dfc"),
        categories: [{ label: "", tagIds: [] }],
      });
    }
  }, [dialogOpen, isEditing, skillsToEdit, resumeId, form, tr]);

  const handleTagCreated = (newTag: Tag) => {
    setAllTags((prev) =>
      prev.some((t) => t.id === newTag.id) ? prev : [...prev, newTag],
    );
  };

  const onSubmit = (data: z.infer<typeof AddSkillsFormSchema>) => {
    startTransition(async () => {
      let res;
      if (isEditing && skillsToEdit?.id) {
        res = await updateSkillsSection({
          ...data,
          sectionId: skillsToEdit.id,
        } as z.infer<typeof UpdateSkillsFormSchema>);
      } else {
        res = await addSkillsSection(data);
      }

      if (!res.success) {
        toastError(tr(res.message));
      } else {
        form.reset();
        setDialogOpen(false);
        toastSuccess(tr("md4f2776fe4f6", {v0: isEditing ? "updated" : "added"}));
      }
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-h-[85vh] md:max-w-[40rem] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? tr("m93c53917f38b") : tr("m4b6166085446")}</DialogTitle>
          <DialogDescription>
            {tr("mcd2cb44e1463")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 p-2"
          >
            <FormField
              control={form.control}
              name="sectionTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("m7ae41e8e786b")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={tr("ma533f307d781")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <hr />

            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border rounded-md p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`categories.${index}.label`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...f}
                              placeholder={tr("m76fd5ffbe52f")}
                              className="uppercase text-xs font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name={`categories.${index}.tagIds`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <TagInput
                            availableTags={allTags}
                            selectedTagIds={f.value}
                            onChange={f.onChange}
                            max={APP_CONSTANTS.MAX_SKILLS_PER_CATEGORY}
                            placeholder={tr("m0354014182ae")}
                            onTagCreated={handleTagCreated}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={fields.length >= APP_CONSTANTS.MAX_SKILL_CATEGORIES}
              onClick={() => append({ label: "", tagIds: [] })}
            >
              <PlusCircle className="h-4 w-4 me-2" />
              {tr("maafdf428fd02")}</Button>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {tr("m19766ed6ccb2")}</Button>
              <Button type="submit" disabled={isPending}>
                {tr("m1509f561f241")}{isPending && <Loader className="h-4 w-4 shrink-0 spinner ms-2" />}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddSkills;
