"use client";

import {useT} from "@/i18n/useT";
import { useRouter } from "next/navigation";
import SigninForm from "./SigninForm";
import SignupForm from "./SignupForm";

type AuthMode = "signin" | "signup";

interface AuthCardProps {
  mode: AuthMode;
}

export default function AuthCard({ mode }: AuthCardProps) {
  const tr = useT();

  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-md px-4">
      {/* App branding */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{tr("m00d43de3b952")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr("m9e4f35c783a0")}</p>
      </div>

      {/* Tab toggle */}
      <div className="mb-6 flex rounded-xl border bg-muted p-1">
        <button
          onClick={() => router.push("/signin")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
            mode === "signin"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tr("mbcc0bcc9140b")}</button>
        <button
          onClick={() => router.push("/signup")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
            mode === "signup"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tr("m0dffe234b447")}</button>
      </div>

      {/* Form card */}
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        {mode === "signin" ? (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-semibold">{tr("m6621249514b7")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr("m5b7696719e52")}</p>
            </div>
            <SigninForm />
          </>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-semibold">{tr("m61e8d44ad423")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr("m2e3dad9a13e9")}</p>
            </div>
            <SignupForm />
          </>
        )}
      </div>
    </div>
  );
}
