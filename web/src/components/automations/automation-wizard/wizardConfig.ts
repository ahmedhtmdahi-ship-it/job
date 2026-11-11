import {message} from "@/i18n/message";
import { APP_CONSTANTS } from "@/lib/constants";
import type { CreateAutomationInput } from "@/models/automation.schema";
import type { AtsConfigValue } from "../AtsSearchStep";

export type AtsKey = "greenhouse" | "lever" | "ashby";

export const EMPTY_ATS: AtsConfigValue = {
  companies: [],
  targetTitles: [],
  keywords: [],
  locations: [],
  strictLocation: false,
  topK: APP_CONSTANTS.MAX_JOBS_PER_RUN,
  saveUnanalyzed: true,
};

export const STEPS = [
  { id: "basics", title: message("m8fdd2ee8475e"), description: message("m1fde9675d953") },
  { id: "search", title: message("m49c266baaaa7"), description: message("mae1af02d2d05") },
  { id: "resume", title: message("md640c7421da0"), description: message("m372d4dda1a44") },
  { id: "matching", title: message("mf9b8704d3c81"), description: message("me56b23839daa") },
  { id: "schedule", title: message("mf4830a1dae29"), description: message("m650e508b0eb1") },
  { id: "review", title: message("maff0766a5290"), description: message("m2475563598ab") },
];

export const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, "0")}:00`,
}));

export function parseEditSourceConfig(
  sc?: string | null,
): CreateAutomationInput["sourceConfig"] | undefined {
  if (!sc) return undefined;
  try {
    const parsed = JSON.parse(sc);
    return parsed?.greenhouse || parsed?.lever || parsed?.ashby
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

export interface WizardResume {
  id: string;
  title: string;
  sectionCount: number;
}
