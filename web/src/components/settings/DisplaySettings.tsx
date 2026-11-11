"use client";
import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastSuccess, toastError } from "@/lib/toast";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import {
  getUserSettings,
  updateDisplaySettings,
} from "@/actions/userSettings.actions";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    error: uiMessage("mc67c4c3d81c5"),
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

function DisplaySettings() {
  const tr = useT();

  const { setTheme, theme, systemTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: "system",
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const result = await getUserSettings();
        if (result.success && result.data?.settings?.display?.theme) {
          const savedTheme = result.data.settings.display.theme;
          form.reset({ theme: savedTheme });
          setTheme(savedTheme);
        } else if (theme) {
          form.reset({ theme: theme as "light" | "dark" | "system" });
        }
      } catch (error) {
        console.error("Error fetching display settings:", error);
        if (theme) {
          form.reset({ theme: theme as "light" | "dark" | "system" });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: AppearanceFormValues) {
    setIsSaving(true);
    try {
      const result = await updateDisplaySettings({ theme: data.theme });
      if (result.success) {
        setTheme(data.theme);
        toastSuccess(tr("m6effb44eb3a2"));
      } else {
        toastError(result.message || uiMessage("m23349bbafc86"));
      }
    } catch (error) {
      console.error("Error saving display settings:", error);
      toastError(tr("m23349bbafc86"));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{tr("m3907fa7f8072")}</h3>
          <p className="text-sm text-muted-foreground">
            {tr("m543014d452a0")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{tr("m157fd50d1133")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{tr("m3907fa7f8072")}</h3>
        <p className="text-sm text-muted-foreground">
          {tr("m543014d452a0")}</p>
      </div>
      <div className="@container">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>{tr("mefb52e7172b7")}</FormLabel>
                  <FormDescription>
                    {tr("m476ef1fb2046")}</FormDescription>
                  <FormMessage />
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid max-w-lg @md:grid-cols-3 gap-8 pt-2"
                  >
                    <FormItem>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <FormControl>
                          <RadioGroupItem value="light" className="sr-only" />
                        </FormControl>
                        <LightThemeElement />
                        <span className="block w-full p-2 text-center font-normal">
                          {tr("mdbcd5e7bb7a0")}</span>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <FormControl>
                          <RadioGroupItem value="dark" className="sr-only" />
                        </FormControl>
                        <DarkThemeElement />
                        <span className="block w-full p-2 text-center font-normal">
                          {tr("m60acc53f13a5")}</span>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                        <FormControl>
                          <RadioGroupItem value="system" className="sr-only" />
                        </FormControl>
                        {systemTheme === "dark" ? (
                          <DarkThemeElement />
                        ) : (
                          <LightThemeElement />
                        )}
                        <span className="block w-full p-2 text-center font-normal">
                          {tr("m6725e7bbcd28")}</span>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {tr("m1509f561f241")}</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default DisplaySettings;

function LightThemeElement() {
  return (
    <div className="cursor-pointer items-center rounded-md border-2 border-muted p-1 hover:border-accent">
      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
        <div className="space-y-2 rounded-md bg-white p-2 shadow-xs">
          <div className="h-2 w-4/5 rounded-lg bg-[#ecedef]" />
          <div className="h-2 w-full rounded-lg bg-[#ecedef]" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs">
          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
          <div className="h-2 w-full rounded-lg bg-[#ecedef]" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs">
          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
          <div className="h-2 w-full rounded-lg bg-[#ecedef]" />
        </div>
      </div>
    </div>
  );
}
function DarkThemeElement() {
  return (
    <div className="cursor-pointer items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-xs">
          <div className="h-2 w-4/5 rounded-lg bg-slate-400" />
          <div className="h-2 w-full rounded-lg bg-slate-400" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs">
          <div className="h-4 w-4 rounded-full bg-slate-400" />
          <div className="h-2 w-full rounded-lg bg-slate-400" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs">
          <div className="h-4 w-4 rounded-full bg-slate-400" />
          <div className="h-2 w-full rounded-lg bg-slate-400" />
        </div>
      </div>
    </div>
  );
}
