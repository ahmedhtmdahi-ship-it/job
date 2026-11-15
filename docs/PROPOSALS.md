# M3 / M3.1 proposal engine

Each opportunity has an owner-private proposal with the M2 score, fit/missing-skill summary, risks, advertisement language, editable platform minimum, suggested price, and a generated draft limited to 1,200 Unicode characters. There is no automatic submission.

## Evidence and free drafting

Evidence is read only through the owner's resumes. Skill rows, WorkExperience rows, project OtherSection rows and portfolio/معرض أعمال OtherSection rows become structured facts with stable row-derived IDs, source kind, original text, tools, employer/client roles, dates and portfolio URLs where available. An employer is not relabeled as a client. Dates are preserved; durations and achievement totals are not guessed. Portfolio links are not fetched. OtherSection entries in a project section or a portfolio-labelled other section are managed through the existing profile editor.

The model writes free sentences rather than selecting from templates. Its JSON result supplies text and factIds for each sentence. Citation IDs are internal metadata shown separately in the editor and are not pasted into the client-facing draft. No citation, an unknown/foreign ID, or a protected fact not found in the cited sources fails the deterministic gate. Citing an unrelated profile fact is insufficient.

Numbers (including Arabic digits and common number words), number/unit pairs, named organizations/tools and other content terms are compared against the **cited facts only**. A number of projects cannot be reused as years of experience. A grammar/transition vocabulary allows free composition; unknown factual/content terms are conservatively flagged. This can reject a legitimate synonym or translation: preserve the original named entity or regenerate, rather than broadening evidence silently. An independent second model request checks meaning, negation, roles, relationships and inflated claims that lexical rules cannot prove. AI approval never overrides a deterministic failure. There is no claim that a deterministic lexical checker can prove arbitrary natural-language semantics.

Internal warnings about undocumented requirements appear only in the risks/help interface, never as an automatically inserted proposal sentence.

## User writing and confirmation

The server compares edited lines with persisted AI sentences. Unchanged AI lines keep their citations and authorship; added/changed lines become “written by user”. The model cannot declare its own output user-written. User lines are allowed without profile citations only after an explicit “I confirm this is true” checkbox and a fresh save/review. Any edit resets confirmation. Confirmation is stored with the exact persisted document revision, and the server checks it again before returning copy text.

The independent reviewer still examines user text. Concerns about an exact user-written sentence remain visible as warnings after confirmation, rather than becoming profile evidence. Confirmation cannot waive an AI-origin claim, a malformed/unavailable review, excessive length or stale profile/ad/price evidence. User lines and confirmations are stored only on the proposal; **no profile data is written**. Existing pre-citation drafts migrate as unverified AI text, never silently as user-written claims.

## Tracking, providers and pricing

Only explicit “I applied” creates a tracker Job with its initial applied stage and timestamp. The job and proposal link commit atomically; row claiming prevents duplicate concurrent/repeated applications. Unknown full/part-time status remains unknown.

Gemini generation and independent review reuse encrypted AI settings or server GEMINI_API_KEY. Configure a free-tier project/model and its quota in Google AI Studio; the app cannot detect whether the supplied project has billing enabled. PROPOSAL_GEMINI_MODEL defaults to gemini-2.5-flash. Quota/transport failures fall back to existing OLLAMA_BASE_URL with PROPOSAL_OLLAMA_MODEL (default qwen2.5:7b, which must be installed). Attempts time out at 45 seconds with no SDK retries. Every attempted generation/review/fallback request has a durable AI usage row, then provider-reported input/output token counts. Failed requests without usage remain unknown, never invented zeros. Raw prompts/profile/proposal text are not stored in usage logs.

The initial editable minimum is USD 20 per owner/platform, not an official platform price. No currency conversion is performed. Scope and price require human agreement. Any relevant fact, advertisement or price-setting change invalidates previous approval.

## Verification

CI uses only fictional records and a deterministic HTTP mock. The independent mock deliberately approves AI sentences so browser tests prove deterministic rejection of an invented number with a valid citation. It reports unsupported user text so confirmation and visible warnings are exercised separately. Tests also cover real structured experience, missing skills, tools/clients/years, citation scope, provider failures, token accounting, clipboard, editing/confirmation reset, no profile writes, tracker idempotence, English ad language and owner isolation. Arabic screenshots are committed under docs/screenshots/m3/ and uploaded as a seven-day CI artifact. No real key or live model request is needed by CI.
