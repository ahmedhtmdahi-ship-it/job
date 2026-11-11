"use client";
import {message} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useTransition, useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Loader, PlusCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { AddCompanyFormSchema } from "@/models/addCompanyForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import SelectFormCtrl from "../Select";
import { COMPANY_SIZES } from "@/lib/constants";
import { toastActionResult } from "@/lib/toast";
import { addCompany, updateCompany } from "@/actions/company.actions";
import { Company } from "@/models/job.model";

type AddCompanyProps = {
  reloadCompanies: () => void;
  editCompany?: Company | null;
  resetEditCompany: () => void;
  dialogOpen: boolean;
  setDialogOpen: (e: boolean) => void;
  hideTrigger?: boolean;
};

function AddCompany({
  reloadCompanies,
  editCompany,
  resetEditCompany,
  dialogOpen,
  setDialogOpen,
  hideTrigger,
}: AddCompanyProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();

  const pageTitle = editCompany ? message("m5b5fc3eeb5e6") : message("mcf291af13fcf");

  const form = useForm<z.infer<typeof AddCompanyFormSchema>>({
    resolver: zodResolver(AddCompanyFormSchema),
    defaultValues: {
      company: "",
      logoUrl: "",
      websiteUrl: "",
      careersUrl: "",
      industry: "",
      linkedinUrl: "",
      size: "",
      notes: "",
      id: undefined,
      createdBy: undefined,
    },
  });

  const { reset, formState } = form;

  useEffect(() => {
    if (editCompany) {
      reset(
        {
          id: editCompany?.id,
          company: editCompany?.label ?? "",
          createdBy: editCompany?.createdBy,
          logoUrl: editCompany?.logoUrl ?? "",
          websiteUrl: editCompany?.websiteUrl ?? "",
          careersUrl: editCompany?.careersUrl ?? "",
          industry: editCompany?.industry ?? "",
          linkedinUrl: editCompany?.linkedinUrl ?? "",
          size: (editCompany?.size ?? "") as z.infer<
            typeof AddCompanyFormSchema
          >["size"],
          notes: editCompany?.notes ?? "",
        },
        { keepDefaultValues: true },
      );
    }
  }, [editCompany, reset]);

  const addCompanyForm = () => {
    if (!editCompany) {
      reset();
      resetEditCompany();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const onSubmit = (data: z.infer<typeof AddCompanyFormSchema>) => {
    startTransition(async () => {
      const res = editCompany
        ? await updateCompany(data)
        : await addCompany(data);
      toastActionResult(res, {
        success: `Company has been ${editCompany ? "updated" : "created"} successfully`,
        onSuccess: () => {
          reset();
          setDialogOpen(false);
          reloadCompanies();
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
          onClick={addCompanyForm}
          data-testid="add-company-btn"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {tr("m1453775df0a7")}</span>
        </Button>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="lg:max-h-screen overflow-y-scroll">
          <DialogHeader>
            <DialogTitle>{pageTitle}</DialogTitle>
            {editCompany && (
              <DialogDescription className="text-orange-600 dark:text-orange-500">
                {tr("mb419c7fe5553")}</DialogDescription>
            )}
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2"
            >
              {/* COMPANY NAME */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr("mb48362246239")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* COMPANY LOGO URL */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr("mba668bf8125f")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* COMPANY WEBSITE */}
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("mb5a229ac8bec")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tr("m100680ad546c")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CAREERS PAGE */}
              <FormField
                control={form.control}
                name="careersUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("md8eea63ee09e")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tr("md1f158588146")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* INDUSTRY */}
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("mb44484a0fa28")}</FormLabel>
                    <FormControl>
                      <Input placeholder={tr("mfbe065970201")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SIZE */}
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{tr("m1af851907331")}</FormLabel>
                    <SelectFormCtrl
                      label={tr("mccdcbe846f3d")}
                      options={COMPANY_SIZES.map((s) => ({ id: s, label: s }))}
                      field={field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* LINKEDIN */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tr("mdd84425b72da")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tr("mcb7a0d01445a")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* NOTES */}
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
                          placeholder={tr("m502cf6b5d903")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <DialogFooter
                // className="md:col-span
                >
                  <div>
                    <Button
                      type="reset"
                      variant="outline"
                      className="mt-2 md:mt-0 w-full"
                      onClick={closeDialog}
                    >
                      {tr("m19766ed6ccb2")}</Button>
                  </div>
                  <Button type="submit" disabled={!formState.isDirty}>
                    {tr("m1509f561f241")}{isPending && (
                      <Loader className="h-4 w-4 shrink-0 spinner" />
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddCompany;
