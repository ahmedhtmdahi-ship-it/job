"use client";

import {useT} from "@/i18n/useT";
import { useState } from "react";
import AiSettings from "@/components/settings/AiSettings";
import AiUsageSettings from "@/components/settings/AiUsageSettings";
import ApiKeySettings from "@/components/settings/ApiKeySettings";
import DataSettings from "@/components/settings/DataSettings";
import DisplaySettings from "@/components/settings/DisplaySettings";
import McpAccessSettings from "@/components/settings/McpAccessSettings";
import SettingsSidebar, { type SettingsSection } from "@/components/settings/SettingsSidebar";

function Settings() {
  const tr = useT();

  const [activeSection, setActiveSection] = useState<SettingsSection>("ai-provider");

  return (
    <div className="flex flex-col col-span-3">
      <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
        {tr("m74a883a037bc")}</h3>
      <p className="mb-4 text-xs text-muted-foreground" data-testid="upstream-credit">{tr("m8bb483f7be15")}</p>
      <div className="flex gap-3 sm:gap-6">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div className="flex-1 min-w-0">
          {activeSection === "ai-provider" && <AiSettings />}
          {activeSection === "ai-usage" && <AiUsageSettings />}
          {activeSection === "api-keys" && <ApiKeySettings />}
          {activeSection === "appearance" && <DisplaySettings />}
          {activeSection === "mcp-access" && <McpAccessSettings />}
          {activeSection === "data" && <DataSettings />}
        </div>
      </div>
    </div>
  );
}

export default Settings;
