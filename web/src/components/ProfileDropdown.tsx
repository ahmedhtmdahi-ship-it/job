"use client";

import {message as uiMessage} from "@/i18n/message";
import {useLocale} from "next-intl";
import {useT} from "@/i18n/useT";
import {LanguageToggle} from "./LanguageToggle";
import { useState } from "react";
import Link from "next/link";
import {
  PowerIcon,
  Settings,
  Info,
  ArrowUpCircle,
  ExternalLink,
  Bell,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import UserAvatar from "./UserAvatar";
import { SupportDialog } from "./SupportDialog";
import { useAppVersion } from "@/hooks/useAppVersion";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

interface ProfileDropdownProps {
  user: any;
  expanded: boolean;
  signOutAction: () => void;
}

export function ProfileDropdown({
  user,
  expanded,
  signOutAction,
}: ProfileDropdownProps) {
  const tr = useT();
  const locale = useLocale();

  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const version = useAppVersion();
  const { summary } = useNotifications();
  const label = user?.email ?? uiMessage("mad0187add790");

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={tr("m6fa25be1c50b")}
                className="navlink h-10 w-full text-muted-foreground hover:text-foreground"
              >
                <span className="relative flex h-full w-14 shrink-0 items-center justify-center">
                  <UserAvatar user={user} />
                  {summary.unread > 0 ? (
                    <>
                      <span
                        aria-hidden
                        data-testid="avatar-dot"
                        className={cn(
                          "absolute end-3 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                          summary.unreadErrors > 0 ? "bg-destructive" : "bg-primary"
                        )}
                      />
                      <span className="sr-only">{tr("mb1e97dfc5eb8")}</span>
                    </>
                  ) : (
                    version?.updateAvailable && (
                      <>
                        <span
                          aria-hidden
                          data-testid="avatar-dot"
                          className="absolute end-3 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
                        />
                        <span className="sr-only">{tr("mff8b555d818f")}</span>
                      </>
                    )
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-sm transition-opacity duration-200",
                    expanded ? "opacity-100 delay-100" : "opacity-0"
                  )}
                >
                  {label}
                </span>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {!expanded && <TooltipContent side={locale === "ar" ? "left" : "right"}>{label}</TooltipContent>}
        </Tooltip>
        <DropdownMenuContent side={locale === "ar" ? "left" : "right"} align="end">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <LanguageToggle />
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <Settings className="w-5 me-2" />
              {tr("m74a883a037bc")}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/notifications" className="cursor-pointer">
              <Bell className="w-5 me-2" />
              <span className="flex-1">{tr("m788011833a5a")}</span>
              {summary.unread > 0 && (
                <span
                  className={cn(
                    "ms-2 rounded-full px-1.5 text-[11px] font-semibold text-white",
                    summary.unreadErrors > 0 ? "bg-destructive" : "bg-primary"
                  )}
                >
                  {summary.unread}
                </span>
              )}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSupportDialogOpen(true)}
            className="cursor-pointer"
          >
            <Info className="w-5 me-2" />
            {tr("mbe91940b79f4")}</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href="https://github.com/Gsync/jobsync/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <ExternalLink className="w-5 me-2" />
              {tr("m63ec69fde300")}</a>
          </DropdownMenuItem>
          {version?.updateAvailable && (
            <DropdownMenuItem
              onClick={() => setSupportDialogOpen(true)}
              className="cursor-pointer text-primary focus:text-primary"
            >
              <ArrowUpCircle className="w-5 me-2" />
              {tr("mff8b555d818f")}</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <form action={signOutAction}>
              <button type="submit" className="flex w-full items-center">
                <PowerIcon className="w-5 me-2" />
                <div className="hidden md:block">{tr("md0527e4b3d65")}</div>
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SupportDialog
        open={supportDialogOpen}
        onOpenChange={setSupportDialogOpen}
        version={version}
      />
    </>
  );
}
