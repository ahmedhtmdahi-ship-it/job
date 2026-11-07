# Job & Portfolio Desktop — implementation specification

## 1. User decisions and scope
Applicant: Ahmed Hatem Dahi, not the account owner's personal profile. Windows local desktop, no hosting. Internet required for live search/action. No runtime AI, no inference endpoint, no local model, no paid scraper, no recurring fee. Development may use Codex. Minimum hourly quotation USD 5; no daily application-count cap. Every application/proposal/publication needs user review. Paid application budget and allowed Connects spend are zero by default. No activity while device is powered off. Sleep/offline must pause and resume safely.

Implement all 24 platforms as requested scope, not as promised working integrations. Separate each capability and permit manual handoff where no reliable adapter is available. Only LinkedIn profile URL is documented. Discover versus apply versus publishing a service are different operations. Imported spreadsheet notes about deletion, moving old projects to drafts, changing titles or deadlines are historical reference, not current authorization to perform those changes.

## 2. Suggested minimal architecture (engineering proposal)
Python 3.11+ / PySide6 desktop UI / SQLite with migrations / Playwright local visible browser / APScheduler / RapidFuzz. Evaluate JobSpy as optional discovery dependency, pinned to a tested release or commit. Use stdlib HTTP or a small maintained HTTP client and structured JSON-LD where available. Parse local documents with document/XML/PDF libraries; scanned certificate metadata is pre-indexed here, and manual metadata entry is acceptable. No OCR cloud service.

Use workers so the UI remains responsive. Browser sessions get separate user-owned persistent profiles, never overwrite default Chrome data. Credentials are entered directly by user in the browser, no passwords embedded in code/settings; use Windows Credential Manager only if secret storage becomes necessary. Keep sessions outside distributable exports. Store user data under LOCALAPPDATA, not Program Files or ephemeral PyInstaller temp dirs. Provide backup/restore and import preview.

Suggested modules: domain models; storage; import/export; profile/evidence; deterministic matching; templates; assets; platform adapters; browser runner; scheduler; audit log; desktop UI. Avoid unnecessary server or distributed components for first version.

## 3. Data and capabilities
Separate tables for applicant facts and provenance, CV versions, certificate pages, portfolio assets, platform accounts, source connectors, opportunities, drafts, approvals, attempts and audit events. Store UTC internally, display Africa/Cairo. Opportunity ID must preserve platform job identifiers and meaningful query parameters such as Indeed jk. Canonicalize only known tracking parameters. Exact duplicate identity prevents resubmission; fuzzy similarity flags probable cross-site duplicates for review rather than deleting legitimate posts.

Connector interface: discover(query,cursor), fetch_detail(url), prepare(draft), preview(draft), submit(approval), verify(attempt). Publishing adapters separately handle portfolio/service/certificate payloads. Unsupported capabilities return an explicit result; never generic success. Track connector version, last attempt, last successful fetch and structured failure reason. Distinguish zero results from blocked fetch or parser failure. Respect rate limits, Retry-After, bounded retries and per-domain concurrency. No CAPTCHA bypass; pause for user login/security steps.

Validate URLs, redirect destination and allowed origins before browser actions. Treat HTML/Excel strings as data: escape preview output, avoid shell execution and formula injection on CSV export. Do not log credentials, cookies or hidden form tokens. Read ZIPs safely with path/size bounds; inspect nested archives without executing contents.

## 4. Discovery and filtering
Seed career tracks from data/career_tracks.json. Normalize Arabic spelling/diacritics and English case; use token-aware phrase matching and explicit synonyms, not unbounded substring filters. Show explainable score by role, skills, location, freshness and pay with matched snippets. User can adjust weights and filters locally. A portfolio project supports demonstrated tasks but does not create employment history.

Fetch full description, salary unit/currency/range, work location, applicant restrictions, date posted, close date and apply URL where available. Remote alone does not prove Egypt eligibility. Mention of US clients is not a US-residency restriction. A law-related word in a data project must not blacklist the whole role. Do not globally exclude legal/admin, junior marketing or scraping tasks because old scripts did so. Seniority exclusions are configurable and contextual, not evidence of universal ineligibility.

Hourly USD max below 5: filter out with reason. Ranges crossing 5: retain for user review; approved quoted rate must be at least 5. Non-USD: require explicit code and dated conversion or manual user valuation; dollar sign alone is ambiguous. Unknown pay: review, never fabricate a number. Monthly salaries and fixed-price projects must not be converted to hourly using guessed hours. Do not automatically bid the platform minimum or invent delivery duration/unlimited revisions.

Support manual URL and CSV imports even when a connector breaks. Source blocks should not erase stored opportunities. Expired jobs stay in history and cannot be submitted. No default max-bid-count or application-count cap inherited from old scripts; discovery pagination/resource limits must be visible controls, separate from submission volume.

## 5. Deterministic CV and proposal preparation
No text generation model at runtime. Use reviewed role-specific CV documents and structured Arabic/English templates, deterministic selection rules and optional excerpt fields copied from job listing. Show exactly which facts, CV and projects were selected and why. Output editable documents via templates if implemented; PDF generation uses locally available renderer, with clean failure if missing.

Do not fabricate years, metrics, clients, certificates, availability, foreign work rights, relocation or salary answers. Unknown screening question blocks completion and goes to reusable answers UI with scope (global/employer/country/exact question) and last-confirmed date. Never infer legal authorization from residence. Course completion is not professional licence or full certificate programme.

Every document starts as a draft. Normalize confirmed phone in working copies only. Source claims in specialized CVs (team of 8, trainer delivery, Jan 2026 promotion, fluent English, US hours) remain review-needed unless confirmed. Legacy CV phone must never silently propagate into a submission.

## 6. Approval and execution state machine
States: discovered -> needs_review -> draft_ready -> approved -> preparing -> awaiting_final_review -> submitting -> submitted / failed / uncertain. Additional blocked states: needs_login, needs_answers, needs_url, needs_asset_review, payment_required, manual_required, unsupported. UI labels need Arabic descriptions.

User sees destination, company, role/full description, eligibility caveats, complete answers, CV and attachments, quotation/currency/duration and any platform cost. Bind approval to hash of destination, applicant facts, all answers, draft text, fees, adapter version and attachment byte hashes. Any relevant edit invalidates approval. Final review must reflect actual remote form answers and required consent fields, not merely a generic template. No hidden auto approve, CLI bypass or scheduler submit. User may queue approved actions, but each exact request must have been reviewed; no blanket approval of future unknown opportunities.

Journal attempt and acquire single-instance lock before outbound submission. Record submitting before click. If network timeout/crash follows click, mark uncertain and prevent auto retry until reconciled with site. Require site-specific confirmation URL/reference or unambiguous visible receipt to record submitted/published. Opened page, uploaded file, disappearance of button or generic thank-you is not sufficient. Keep failures distinct from uncertainty. Paid credits/Connects are monetary costs even if already owned: block at zero budget.

## 7. Portfolio and certificates
13 candidate projects from public batches 2/3/4 plus standalone OULAD workbook are catalogued. Earlier 3 BI projects and 6 generic analysis projects remain references until provenance/content review. Exact duplicate batch 2 archive omitted. Missing batches 0/1 must not be invented. Excel and PNG attachments do not become PBIX or a deployed automated system merely because titles mention BI/automation.

Read supplied upload descriptions as claims, not verified analytical findings. Require source reference, actual dataset licence/attribution, truthful case-study framing and asset review before publication. Some descriptions claim MIT for Olist; do not propagate that licence without verification. A public-data analysis is not a client engagement or realised client revenue improvement. Do not automatically add Real public data to legacy projects without evidence.

Maintain title/description/skills in Arabic and English and per-platform field limits. Validate accepted file types, sizes and image dimensions at execution time; show preview before crop/resize, preserve originals. Do not share datasets or workbooks if their source licence disallows it. Attach only explicitly selected relevant files; never all CVs/certificates to every application. Avoid accidentally uploading this private handoff ZIP, manifests or source code as portfolio assets.

Certificate catalog points to 14 pages. Split pages preserving original content if needed, generate safe filenames and let user review title, issuer, date, ID/link and name. Pages 11/12/13 show Ahmed Hatem Saad; require confirmation of relationship before upload under Dahi. Do not alter names on the certificates. Google pages are two standalone courses, not evidence of a complete professional certificate. Verification links are extracted evidence, not proof that the issuer was contacted.

## 8. UI
Arabic-first desktop with English job content preserved, RTL forms and selectable text. Tabs: overview, sources/accounts, opportunities, review queue, CVs/facts, portfolio, certificates, answers, history, settings. Main review allows edit, approve, reject/ignore and browser handoff. Source failures and manual tasks must be visible. Search progress/cancel, resumable jobs and offline history. No marketing claims of full coverage.

## 9. Build and validation
Deliver source, dependency lockfile, licence notices, migrations, fixtures, tests, Windows build script and either tested executable/installer or explicitly untested build workflow. Prefer PyInstaller on Windows and optional installer. Browser binaries downloaded at initial setup with visible progress, or documented offline bundle. Handle Unicode Windows usernames/paths and normal-user installation without admin requirement. No unnecessary network calls at startup; search network traffic only after explicit action/schedule.

Acceptance tests in ACCEPTANCE_TESTS.md are required. Verify on Windows in addition to Linux unit tests. Signed binaries, hosting and paid services are not assumed or purchased. Document limitations and site-specific results honestly.

## 10. Milestones
A: working UI, safe import, applicant profile, asset catalog, conflict review, SQLite and manual URL import; no external send.
B: deterministic matching/templates and discovery connectors validated on fixtures plus read-only live checks where permitted.
C: browser sessions, form preview and submission state machine verified on local mock multi-step forms.
D: individual platform adapters and publishing capabilities; final actions only through the review UI, with explicit user approval outside development tests.
E: Windows build, clean-machine smoke test, user guide, coverage matrix and reproducible verification report.
