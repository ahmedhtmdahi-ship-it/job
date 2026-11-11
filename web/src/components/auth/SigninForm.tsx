"use client";
import {useT} from "@/i18n/useT";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authenticate } from "@/actions/auth.actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SigninFormSchema } from "@/models/signinForm.schema";
import Loading from "../Loading";
import { Eye, EyeOff } from "lucide-react";

function SigninForm() {
  const tr = useT();

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SigninFormSchema>>({
    resolver: zodResolver(SigninFormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [errorMessage, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: z.infer<typeof SigninFormSchema>) => {
    startTransition(async () => {
      setError("");
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);
      const errorResponse = await authenticate("", formData);
      if (errorResponse) {
        setError(errorResponse);
      } else {
        router.push("/dashboard");
      }
    });
  };

  return (
    <>
      <Form {...form}>
        <form
          method="POST"
          onSubmit={form.handleSubmit(onSubmit)}
          // className="w-2/3 space-y-6"
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">{tr("m969ccbd3cf63")}</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder={tr("ma6238bfc4db6")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password">{tr("me7cf3ef4f17c")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-0 top-0 h-full px-3 text-muted-foreground"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword ? tr("ma60a56c584b3") : tr("m6aeaa6a53d09")
                          }
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Loading /> : tr("m9d6322c1f4d9")}
            </Button>
            <div
              className="flex h-8 items-end space-x-1"
              aria-live="polite"
              aria-atomic="true"
            >
              {errorMessage && (
                <>
                  <p className="text-sm text-red-500">{tr(errorMessage)}</p>
                </>
              )}
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}

export default SigninForm;
