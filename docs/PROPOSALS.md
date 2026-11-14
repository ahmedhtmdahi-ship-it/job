# M3 proposal engine

Implementation scope: profile-grounded Arabic/English proposals, a separate AI honesty review plus deterministic evidence checks, per-platform editable price floors, token accounting, and an explicit application-tracker action. No automatic submission.

The proposal engine reuses the existing Gemini / Ollama credentials and AI-call log. Gemini needs a user-configured key or GEMINI_API_KEY on the server; use a free-tier project and its quota limits. Ollama is the fallback. CI uses a deterministic mock provider, never a live model or real credentials.

The copy action must fail closed whenever review fails, claims lack profile evidence, or the draft exceeds 1,200 characters. Profile changes invalidate old approval. Opportunity content is untrusted input, never instructions.

## Evidence and review contract

M3 deliberately uses a closed sentence catalog, localized in `messages/ar.json` and `en.json`. The generation model selects/orders exact sentences and may include only skill labels stored in the owner's resume tags and matched to the advertisement. Free-form experience/client/achievement claims are not generated. This is conservative: truthful but newly worded sentences are also blocked until removed or regenerated. It avoids relying on a finite keyword blacklist to prove arbitrary language true.

An independent second model request examines the final draft. Its `unsupported_claims[]` are combined with deterministic sentence/length checks. A provider outage, malformed review, any unsupported sentence, changed evidence/ad/minimum, or unreviewed edit closes the gate. The server rechecks persisted approval and evidence before returning copy text; browser button state alone is not trusted. Draft and review requests have separate AI-call rows with reported token counts. Failed requests with no usage metadata retain unknown counts, never invented zeros.

Proposal language follows the stored advertisement language, independent of the interface locale. Score and fit/missing-skill summary reuse deterministic M2 ranking. Suggested prices are clamped to a per-owner, per-platform minimum; the initial editable suggestion is USD 20, not an official platform minimum. No currency conversion is performed. Price and review context are invalidated when preferences change.

Only explicit “I applied” creates a tracker Job and its initial applied timeline stage. The job, timestamp and proposal link are committed atomically; a row claim prevents duplicates on concurrent/repeated clicks. No application is submitted to any external service.

## Runtime configuration

Use the existing AI settings to store a Gemini key securely, or provide `GEMINI_API_KEY` to the server. `PROPOSAL_GEMINI_MODEL` defaults to `gemini-2.5-flash`; select an available free-tier model/project and enforce its quota in Google AI Studio. The application cannot determine whether a supplied project has billing enabled. There are no SDK retries; quota/transport failures fall back to Ollama. `OLLAMA_BASE_URL` uses the existing local-provider setting; `PROPOSAL_OLLAMA_MODEL` defaults to `qwen2.5:7b`, which must already be installed on that server. Each attempt has a 45-second timeout. No real key is needed or used by CI.

CI replaces only the Gemini HTTP transport with a fixed fictional response, including fixed usage metadata. The independent mock reviewer intentionally approves everything, so the browser test must still reject fabricated skills/years through deterministic rules. The mock loader is confined to CI; it blocks live external model traffic. Raw profile/prompt/proposal text is not included in usage logs.
