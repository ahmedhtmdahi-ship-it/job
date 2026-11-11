"use client";

import {useT} from "@/i18n/useT";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Star } from "lucide-react";
import { AppVersionInfo } from "@/models/version.model";
import packageJson from "../../package.json";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version?: AppVersionInfo | null;
}

export function SupportDialog({
  open,
  onOpenChange,
  version,
}: SupportDialogProps) {
  const tr = useT();

  const appVersion = packageJson.version;
  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr("mbe91940b79f4")}</DialogTitle>
          <DialogDescription className="space-y-1">
            <a
              href="https://github.com/Gsync/jobsync/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary hover:underline"
            >
              {tr("m28dcef4d6f16")}</a>
            <a
              href="https://github.com/Gsync/jobsync/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary hover:underline"
            >
              {tr("m286d36372621")}</a>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <a
            href="https://github.com/Gsync/jobsync"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 transition-colors hover:bg-amber-500/20"
          >
            <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500 transition-transform group-hover:scale-110" />
            <span className="space-y-0.5">
              <span className="block text-sm font-semibold">
                {tr("mf93f4d787cd1")}</span>
              <span className="block text-xs text-muted-foreground">
                {tr("m5d6b2f527467")}</span>
            </span>
          </a>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{tr("mdd167905de0d")}</h3>
            <p className="text-sm text-muted-foreground">{tr("m4c94485e0c21")}{appVersion}</p>
            {version?.updateAvailable && (
              <p className="text-sm">
                <a
                  href={version.releaseUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {version.latest} {" "}{tr("m56e6117995b5")}</a>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{tr("m8dfc77ab4089")}</h3>
            <p className="text-sm text-muted-foreground">
              © {currentYear} {" "}{tr("m9fef97654994")}</p>
            <a
              href="https://jobsync.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {tr("m0d70584f686b")}</a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
