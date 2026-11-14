import {message as uiMessage} from "@/i18n/message";
// Own vocabulary, not telemetry's SURFACES: the two disagree on the Analyze
// button (Automations here, job.match there) and SURFACES must not grow.
export const AI_USAGE_FEATURES = {
  proposal_draft: uiMessage("m3proposaldraft"),
  proposal_review: uiMessage("m3proposalreview"),
  agent_chat: uiMessage("m3b6628926bd2"),
  job_match: uiMessage("md3f362f23515"),
  automations: uiMessage("mad1fb9ec0cb3"),
  resume_review: uiMessage("mf38927362ffa"),
  cover_letter: uiMessage("md9adba2207cb"),
  resume_import: uiMessage("mf12822f97a31"),
} as const;

export type AiUsageFeature = keyof typeof AI_USAGE_FEATURES;

export const FEATURE_BY_NESTED_LABEL: Record<string, AiUsageFeature> = {
  review_resume: "resume_review",
  match_job: "job_match",
  generate_cover_letter: "cover_letter",
};

export const AI_CALL_STATUSES = [
  "ok",
  "error",
  "truncated",
  "interrupted",
  "timed_out",
  "stopped",
] as const;

export type AiCallStatus = (typeof AI_CALL_STATUSES)[number];

// Stopped is a call but never a failure — the user chose it.
export const AI_FAILURE_STATUSES = [
  "error",
  "truncated",
  "interrupted",
  "timed_out",
] as const;

export type AiFailureStatus = (typeof AI_FAILURE_STATUSES)[number];

export const AI_PROVIDER_LABELS: Record<string, string> = {
  ollama: uiMessage("meb82ef897693"),
  openai: uiMessage("m8b7d1a3187ab"),
  deepseek: uiMessage("m0648d2111ec0"),
  gemini: uiMessage("mf6ece80b88d6"),
  openrouter: uiMessage("meb70c3bc14fa"),
};

export type AiUsageRange = 7 | 30;

export type AiCallRow = {
  id: string;
  startedAt: Date;
  feature: AiUsageFeature;
  provider: string;
  model: string;
  status: AiCallStatus;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
  firstTokenMs: number | null;
};

export type AiModelUsage = {
  model: string;
  tokens: number;
  calls: number;
  medianMs: number | null;
  p95Ms: number | null;
  medianFirstTokenMs: number | null;
  nearContextLimit: number;
};

export type AiUsageSummary = {
  rangeDays: AiUsageRange;
  totals: {
    inputTokens: number;
    outputTokens: number;
    calls: number;
    previousCalls: number;
    failures: number;
    stopped: number;
    medianMs: number | null;
    p95Ms: number | null;
    medianFirstTokenMs: number | null;
  };
  failuresByStatus: Record<AiFailureStatus, number>;
  // Oldest first; one entry per calendar day in the viewer's timezone.
  days: { date: string; tokensByProvider: Record<string, number> }[];
  providers: {
    provider: string;
    tokens: number;
    calls: number;
    models: AiModelUsage[];
  }[];
  features: {
    feature: AiUsageFeature;
    tokens: number;
    calls: number;
    medianMs: number | null;
  }[];
  recent: AiCallRow[];
};
