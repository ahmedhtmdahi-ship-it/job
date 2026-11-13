export interface Opportunity {
  sourceId: string; externalId: string; url: string | null; title: string; description: string;
  company?: string; budgetMin?: number; budgetMax?: number; currency?: string;
  jobType: 'freelance' | 'remote_job'; postedAt: Date | null; bidsCount?: number;
  skills: string[]; country?: string; language: 'ar' | 'en';
}
export interface SourceQuery {text?: string; url?: string; platform?: string; jobType?: "freelance" | "remote_job";}
export interface SourceAdapter {
  id: string; name: string; kind: 'api' | 'paste';
  fetch(query: SourceQuery): Promise<Opportunity[]>;
}
export type SourceStatus = 'ok' | 'blocked' | 'failed' | 'parser_error';
export class SourceError extends Error {
  constructor(public status: Exclude<SourceStatus, 'ok'>, message: string, public retryAt?: Date) {super(message);}
}
