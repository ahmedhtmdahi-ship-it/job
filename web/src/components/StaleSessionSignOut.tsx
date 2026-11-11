"use client";

import {useT} from "@/i18n/useT";
import { useEffect } from "react";

// Clearing the cookie is the only way out of a session whose user row is
// gone: redirecting alone loops, because auth.config sends anyone holding a
// valid token back to /dashboard.
function StaleSessionSignOut({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const tr = useT();

  useEffect(() => {
    signOutAction();
  }, [signOutAction]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
      <p className="text-sm text-muted-foreground">
        {tr("m5ecf4d9891f9")}</p>
    </div>
  );
}

export default StaleSessionSignOut;
