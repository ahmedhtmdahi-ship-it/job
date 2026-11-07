# Verification — 0.3.0 / 2026-11-04

Host: Linux x86_64, Python 3.12.14. The complete current runner evidence is in test-results.xml: 105 passed, no skipped tests. This includes portable-build safety tests and local final-submit browser fixtures.

- **105 tests passed**, including actual headless Chromium local-form tests for final approval, POST journaling, receipt verification, uncertainty, hidden-token exclusion and security pause/resume. No skipped tests in the final run. pip check passed; git diff --check passed.
- Local tests cover all implemented feed parsers, real pagination cursors across restarts, cancellation, valid zero vs blocked/parser errors, deduplication, known tracking parameters and stable platform IDs, profile edits, stale approval prevention, attachment-byte changes, exact pay/expiry rules, country-scoped answers, original-preserving CV corrections, certificates, image previews/limits, manual receipt reconciliation and CSV formula protection.
- GUI renders in Arabic RTL and persists across restarts in an Arabic path. Linux offscreen screenshots: desktop.png and search.png. This is not a Windows desktop launch test.
- Real handoff import indexed 45 outer members plus 55 portfolio members = **100 assets**. Reimport detected duplicates.
- **16/16 original input hashes** still match the supplied manifest. Separate operations, legal and master CV copies were exercised with the canonical phone; master IdeaSpace changed to Oct 2026 in the working copy only. Freelance Present stayed unchanged.
- Certificate page 11 was materialized independently without editing the original certificate name. User's same-person confirmation is recorded.
- Read-only live calls to Freelancer, Remotive, Jobicy, RemoteOK, Arbeitnow, LinkedIn, Wuzzuf, Bayt and 20four7VA all returned **blocked** from the environment proxy. The run is recorded as completed_with_errors with nine failed source reads, not zero successful jobs. No listing was fabricated.
- Required job-source domains were saved to the editable environment network draft. The running network remains unchanged. No environment publication was performed.

## Windows output

A native AMD64 Windows launcher and portable distribution have been cross-built. The bundle contains the official CPython 3.12.10 NuGet runtime, Windows dependency wheels, source, licence notices, and optional personal input ZIP. CPython's package was verified using the official NuGet SHA512 catalog hash. Every Windows wheel was checked against its PyPI SHA256 metadata.

The builder checks PE architecture, GUI subsystem, required Python/Qt/Playwright files, application source hashes and syntax, and the personal input checksum. Exact results and archive provenance are recorded in BUILD_MANIFEST.json inside the portable output. No commercial signing or installer is included.

**No real Windows kernel or clean Windows account was available.** The actual native launcher, Windows CPython and Windows Qt GUI did execute successfully under Wine 10/Xvfb, including an Arabic QA path. A separate Windows-binary functional run imported 100 assets, prepared/exported an approved fixture draft, selected a certificate and verified backup restoration and file roles. See WINE_COMPATIBILITY.md and its JSON evidence. Wine is not a substitute for Windows 10/11, browser-install or live-site tests. Reproducible Windows CI is supplied and now runs a packaged EXE smoke check when dispatched; it was not dispatched here.

## Acceptance boundaries

The provided ACCEPTANCE_TESTS.md remains the requested specification, not a completed-results claim. Local import, storage, matching, review, pre-action journaling, uncertainty/reconciliation, scoped answers, local browser fields and safe export have executable test evidence. The production path uses **manual reviewed handoff**, not an unverified automatic site adapter.

The final-submit engine is implemented and tested on intercepted local pages: visible field values, actual upload byte hashes and form/action destinations are bound to approval; the journal precedes POST; only a fresh adapter-specific receipt succeeds; generic thanks and disconnects remain uncertain. Fixture mode cannot enable real-domain submission. Live adapters default to unverified and stay manual_required. Per-platform submit/publish integration, current field/image limits, authenticated live receipt verification and packet-level auditing remain unverified. A prepared local publishing validator accepts explicit operation limits; it does not invent current site constraints. Generic custom comboboxes/consents stay manual_required.

The app requires no LLM/API key/model/hosting/paid scraper. Startup with scheduling disabled does not start source reads; scheduling only performs discovery and never submits. Browser sessions are isolated and excluded from backup/draft export. Selected external attachment files must be kept separately if outside managed imports/working CV storage.

To complete live verification in this environment, the user must review/save the prepared network draft and publish the environment, then retry affected read-only source checks. Account-dependent fill tests require the user's local browser login. A real Windows machine/runner is needed for a Windows launch claim. These are external prerequisites, not successful tests.
