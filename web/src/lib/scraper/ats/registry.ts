import {message} from "@/i18n/message";
import type { JobBoard } from "@/models/automation.model";
import { searchGreenhouseJobs } from "../greenhouse";
import { searchLeverJobs } from "../lever";
import { searchAshbyJobs } from "../ashby";
import type { AtsProvider } from "./types";

// Server-only: imports the real network-calling search fns (fetch, p-limit).
// Never import this from client-bundled code — use ATS_BOARDS from
// automation.model.ts for the plain, dependency-free board list.
export const ATS_PROVIDERS: Partial<Record<JobBoard, AtsProvider>> = {
  greenhouse: {
    id: "greenhouse",
    label: message("md5150bb6c5de"),
    search: searchGreenhouseJobs,
  },
  lever: { id: "lever", label: message("m2ea541c5d4da"), search: searchLeverJobs },
  ashby: { id: "ashby", label: message("m0a1c8fde28ed"), search: searchAshbyJobs },
};
