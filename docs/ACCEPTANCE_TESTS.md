# Required acceptance tests (specification, not completed results)

1. Launch on a clean Windows normal-user account with Arabic username/path; local data persists after restart/update; no model/API key prompt.
2. Import supplied DOCX/PDF/XLSX/ZIP files, detect exact duplicate archive, reject ZIP traversal/oversize and never execute embedded code.
3. Phone conflict visible; working drafts use confirmed phone; original files' SHA-256 unchanged. Conflicting title/team-size/availability facts cannot enter final answers until confirmed.
4. Exactly 24 requested platforms listed with separate search/apply/publish/cert capabilities, not all marked working. Ambiguous URLs stay needs_url.
5. Search fixtures distinguish valid zero jobs from blocked source/parser failure; pagination resumes, cancellation works, duplicate discoveries preserve past attempts.
6. USD hourly max 4 -> filtered; 5 -> reviewable; range 3–8 -> reviewable with quotation >=5; unknown pay -> review; CAD dollar sign -> ambiguous; monthly salary not divided by guessed hours; fixed price needs quote approval.
7. Remote US-only job -> ineligible; remote serving US clients worldwide -> not rejected merely due US mention; remote with no residency info -> unknown. Expired job cannot submit.
8. Role mapping handles Arabic/English synonyms; legal assistant is not globally excluded; senior data scientist not claimed eligible from junior portfolio; arbitrary age/bid-count caps visible and configurable.
9. CV, proposal and project selection are deterministic without model calls. Drafts cannot invent paid clients, outcome metrics, foreign bar admission, full Google professional certificate, work rights or availability.
10. Required unknown question blocks action. Saved answer scopes avoid reusing US work-right answer for another country. Consents are shown for review, not silently ticked.
11. Preview multi-step form: native country/email selects, custom city combobox, resume upload, cover-letter upload, radio/checkbox/select fields. Fill does not submit. Unsupported custom fields produce actionable manual_required.
12. Exact action approval required from every entry point including scheduler and CLI. Tamper text, applicant answer, attachment bytes, destination or fee -> approval invalidated. Legacy auto pathway unavailable.
13. Cost/Connects detected -> payment_required at budget zero, including already owned credits. No purchase or bid at platform minimum by assumption.
14. Record submitting before final click. Crash/network loss after click -> uncertain; restart cannot retry. Site-specific receipt -> submitted. Generic success text or opening form -> not submitted.
15. Publishing validates actual field/attachment limits and shows final preview. Repeating a published payload cannot create duplicates. New revision needs approval. Unsupported service-gallery workflow falls back explicitly.
16. Certificate pages 11/12/13 blocked pending alternate-name confirmation; pages stay unchanged. Each certificate individually selectable; no upload-all-by-default. Dataset source/licence ambiguity blocks publishing affected project.
17. Arabic RTL desktop, background search responsiveness/cancel, no UI freeze, session reset and local-data export exclude cookies/secrets by default.
18. Produce per-platform test evidence with date, version and capability. Mock successes do not count as live-platform successes. Live tests stay read-only or fill-only unless user separately executes an approved action.
19. Package EXE/installer on Windows, record exact environment, test clean launch and browser install. If no Windows runner available, label build untested and supply reproducible Windows build workflow.
20. Network audit: no runtime AI endpoints, paid scraping endpoints or telemetry required for core function; no periodic network traffic when schedule disabled.
