"use client";

import {message as uiMessage} from "@/i18n/message";
import {useT} from "@/i18n/useT";
import { BarChart3, Bot, Database, Key, Palette, Plug } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export type SettingsSection = "ai-provider" | "ai-usage" | "api-keys" | "appearance" | "mcp-access" | "data";

const SETTINGS_SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: typeof Bot;
}[] = [
  { id: "ai-provider", label: uiMessage("m84e1ec2c5bd3"), icon: Bot },
  { id: "ai-usage", label: uiMessage("mc59713807412"), icon: BarChart3 },
  { id: "api-keys", label: uiMessage("mc08f17eb9e11"), icon: Key },
  { id: "appearance", label: uiMessage("m3907fa7f8072"), icon: Palette },
  { id: "mcp-access", label: uiMessage("m844acbf008c2"), icon: Plug },
  { id: "data", label: uiMessage("mcec3a9b89b2e"), icon: Database },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export default function SettingsSidebar({
  activeSection,
  onSectionChange,
}: SettingsSidebarProps) {
  const tr = useT();
  return (
    <nav className="flex flex-col gap-1 w-10 sm:w-48 shrink-0">
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <Button
            key={section.id}
            variant="ghost"
            title={tr(section.label)}
            aria-label={tr(section.label)}
            className={cn(
              "justify-center sm:justify-start gap-2 rounded-none border-s-2 px-0 sm:px-4",
              isActive
                ? "border-s-primary bg-muted font-medium"
                : "border-s-transparent hover:border-s-muted-foreground/25",
            )}
            onClick={() => onSectionChange(section.id)}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tr(section.label)}</span>
          </Button>
        );
      })}
    </nav>
  );
}
