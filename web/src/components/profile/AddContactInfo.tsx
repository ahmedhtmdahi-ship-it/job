"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { X } from "lucide-react";
import { Button } from "../ui/button";
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
import { AddContactInfoFormSchema } from "@/models/addContactInfoForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useTransition } from "react";
import { toastActionResult } from "@/lib/toast";
import { ContactInfo } from "@/models/profile.model";
import { addContactInfo, updateContactInfo } from "@/actions/profile.actions";

interface AddContactInfoProps {
  dialogOpen: boolean;
  setDialogOpen: (e: boolean) => void;
  contactInfoToEdit?: ContactInfo | null;
  resumeId: string | undefined;
}

function AddContactInfo({
  dialogOpen,
  setDialogOpen,
  contactInfoToEdit,
  resumeId,
}: AddContactInfoProps) {
  const tr = useT();

  const [isPending, startTransition] = useTransition();
  const [showLink2, setShowLink2] = useState(false);

  const pageTitle = contactInfoToEdit
    ? uiMessage("m0b940c7ff862")
    : uiMessage("m8a0071a9cb9e");
  const pageDescription = contactInfoToEdit
    ? uiMessage("m6f4d7048fd41")
    : uiMessage("m328c34c54414");

  const form = useForm<z.infer<typeof AddContactInfoFormSchema>>({
    resolver: zodResolver(AddContactInfoFormSchema),
    defaultValues: {
      resumeId,
      firstName: "",
      lastName: "",
      headline: "",
      email: "",
      phone: "",
      address: "",
      url1: "",
      url1Label: "",
      url2: "",
      url2Label: "",
    },
  });

  const { reset, formState } = form;

  useEffect(() => {
    if (contactInfoToEdit) {
      setShowLink2(!!contactInfoToEdit.url2);
      reset(
        {
          id: contactInfoToEdit.id,
          resumeId: contactInfoToEdit.resumeId,
          firstName: contactInfoToEdit.firstName,
          lastName: contactInfoToEdit.lastName,
          headline: contactInfoToEdit.headline,
          email: contactInfoToEdit.email,
          phone: contactInfoToEdit.phone,
          address: contactInfoToEdit.address ?? "",
          url1: contactInfoToEdit.url1 ?? "",
          url1Label: contactInfoToEdit.url1Label ?? "",
          url2: contactInfoToEdit.url2 ?? "",
          url2Label: contactInfoToEdit.url2Label ?? "",
        },
        { keepDefaultValues: true }
      );
    } else {
      reset();
    }
  }, [contactInfoToEdit, reset]);

  const onSubmit = (data: z.infer<typeof AddContactInfoFormSchema>) => {
    startTransition(async () => {
      const res = contactInfoToEdit
        ? await updateContactInfo(data)
        : await addContactInfo(data);
      toastActionResult(res, {
        success: contactInfoToEdit ? tr("m47e08d09f0f5") : tr("md0da528b4ae6"),
        onSuccess: () => {
          reset();
          setDialogOpen(false);
        },
      });
    });
  };

  const closeDialog = () => setDialogOpen(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="lg:max-h-screen overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>{tr(pageTitle)}</DialogTitle>
          <DialogDescription>{typeof pageDescription === "string" ? tr(pageDescription) : pageDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2"
          >
            {/* FIRST NAME */}
            <div>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m96ce6e6193a0")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* LAST NAME */}
            <div>
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("mf55563b386a3")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* HEADLINE */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("mc5f5a4c81575")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* EMAIL */}
            <div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m969ccbd3cf63")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PHONE */}
            <div>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m63dceb8800b2")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ADDRESS */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("m56ef8f20955f")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* LINK 1 */}
            <div className="md:col-span-2">
              <p className="text-sm font-medium mb-2">
                {tr("m6b1fbc99c408")}{" "}
                <span className="text-muted-foreground font-normal">
                  {tr("m006bb301f2e2")}</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="url1Label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">{tr("m0e66373f45dc")}</FormLabel>
                      <FormControl>
                        <Input placeholder={tr("m5447c691afda")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url1"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs text-muted-foreground">{tr("me7a241debad5")}</FormLabel>
                      <FormControl>
                        <Input placeholder={tr("m66dfeeedabf1")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* LINK 2 */}
            {showLink2 ? (
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{tr("md2df0dda487c")}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={() => {
                      form.setValue("url2", "", { shouldDirty: true });
                      form.setValue("url2Label", "");
                      setShowLink2(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="url2Label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">{tr("m0e66373f45dc")}</FormLabel>
                        <FormControl>
                          <Input placeholder={tr("mc3b23943210d")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="url2"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs text-muted-foreground">{tr("me7a241debad5")}</FormLabel>
                        <FormControl>
                          <Input placeholder={tr("m66dfeeedabf1")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground px-0 h-auto"
                  onClick={() => setShowLink2(true)}
                >
                  {tr("mf06b495678e8")}</Button>
              </div>
            )}

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

export default AddContactInfo;
