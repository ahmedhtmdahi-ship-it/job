"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { AddExperienceFormSchema } from "@/models/addExperienceForm.schema";
import { ResumeSection, WorkExperience } from "@/models/profile.model";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import TiptapEditor from "../TiptapEditor";
import { toastSuccess, toastError } from "@/lib/toast";
import { Combobox } from "../ComboBox";
import { DatePicker } from "../DatePicker";
import { Company, JobLocation, JobTitle } from "@/models/job.model";
import { getAllCompanies } from "@/actions/company.actions";
import { getAllJobTitles } from "@/actions/jobtitle.actions";
import { getAllJobLocations } from "@/actions/jobLocation.actions";
import { Switch } from "../ui/switch";
import { addExperience, updateExperience } from "@/actions/profile.actions";

type AddExperienceProps = {
  resumeId: string | undefined;
  sectionId: string | undefined;
  dialogOpen: boolean;
  setDialogOpen: (e: boolean) => void;
  experienceToEdit?: ResumeSection;
};

function AddExperience({
  resumeId,
  sectionId,
  dialogOpen,
  setDialogOpen,
  experienceToEdit,
}: AddExperienceProps) {
  const tr = useT();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [locations, setLocations] = useState<JobLocation[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const pageTitle = experienceToEdit ? uiMessage("m7306416e8db8") : uiMessage("m6de239cb77e9");
  const pageDescription = experienceToEdit
    ? uiMessage("mf74f49a7dcfd")
    : uiMessage("m427019ffbe87");
  const [isPending, startTransition] = useTransition();
  const getTitleCompanyAndLocationData = useCallback(async () => {
    const [_companies, _titles, _locations] = await Promise.all([
      getAllCompanies(),
      getAllJobTitles(),
      getAllJobLocations(),
    ]);
    setCompanies(_companies);
    setLocations(_locations);
    setJobTitles(_titles);
  }, []);

  const form = useForm<z.infer<typeof AddExperienceFormSchema>>({
    resolver: zodResolver(AddExperienceFormSchema),
    defaultValues: {
      resumeId,
      sectionId,
      sectionTitle: "",
    },
  });

  const { watch, reset, formState, setValue } = form;

  const currentJobValue = watch("currentJob");

  useEffect(() => {
    if (!dialogOpen) return;
    getTitleCompanyAndLocationData();
    if (experienceToEdit) {
      const experience: WorkExperience =
        experienceToEdit.workExperiences?.at(0)!;
      reset({
        id: experience?.id,
        title: experience?.jobTitle.id,
        company: experience?.Company.id,
        location: experience?.location.id,
        startDate: experience?.startDate,
        endDate: experience?.endDate,
        jobDescription: experience?.description,
        currentJob: !!!experience?.endDate,
      });
    } else {
      reset(
        {
          resumeId,
          sectionId,
          sectionTitle: "",
        },
        { keepDefaultValues: true },
      );
    }
  }, [
    dialogOpen,
    getTitleCompanyAndLocationData,
    experienceToEdit,
    reset,
    resumeId,
    sectionId,
  ]);

  const onSubmit = (data: z.infer<typeof AddExperienceFormSchema>) => {
    startTransition(async () => {
      const res = experienceToEdit?.workExperiences?.length
        ? await updateExperience(data)
        : await addExperience(data);
      if (!res.success) {
        toastError(res.message);
      } else {
        reset();
        setDialogOpen(false);
        toastSuccess(`Experience has been ${
          experienceToEdit ? "updated" : "added"
        } successfully`);
      }
    });
  };

  const onCurrentJob = (current: boolean) => {
    if (current) {
      setValue("endDate", null, { shouldDirty: true });
    }
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
                          <Input {...field} placeholder={tr("mdca9c05d1868")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <hr className="md:col-span-2" />
              </>
            )}

            {/* JOB TITLE */}
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("mde2c88352242")}</FormLabel>
                    <FormControl>
                      <Combobox options={jobTitles} field={field} creatable />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* COMPANY */}
            <div>
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("mde4743c87973")}</FormLabel>
                    <FormControl>
                      <Combobox options={companies} field={field} creatable />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* LOCATION */}
            <div>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("mdc04497effc8")}</FormLabel>
                    <FormControl>
                      <Combobox options={locations!} field={field} creatable />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* START DATE */}
            <div className="flex flex-col">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m4c52faad5dc6")}</FormLabel>
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

            {/* CURRENT JOB */}
            <div className="flex items-center">
              <FormField
                control={form.control}
                name="currentJob"
                render={({ field }) => (
                  <FormItem className="flex flex-row">
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={(c) => {
                        field.onChange(c);
                        onCurrentJob(c);
                      }}
                    />
                    <FormLabel className="flex items-center ms-4 mb-2">
                      {field.value ? tr("m571d3586323e") : tr("m0fb54d3354a0")}
                    </FormLabel>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* END Date */}
            <div className="flex flex-col">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("me970951cfb6b")}</FormLabel>
                    <DatePicker
                      field={field}
                      presets={false}
                      isEnabled={!currentJobValue!}
                      captionLayout={true}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* JOB DESCRIPTION */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("meddf43c6d489")}</FormLabel>
                    <FormControl>
                      <TiptapEditor field={field} />
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

export default AddExperience;
