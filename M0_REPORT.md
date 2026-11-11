# M0 verification report

MILESTONE: M0 — partial; runtime blocked
COMMIT: see this PR history; original import 3b5f3b4

WHAT WORKS:
- All 1,218 upstream tracked files match Gsync/jobsync commit 8c20325c35dbf203334a270cef5aef446f06a774 byte for byte, including LICENSE.
- Original application code, tests and lockfile are unchanged.
- npm ci completed successfully. Only .env.example is tracked; no local environment or user data was imported.
- Existing main application files are unchanged; root .gitignore has additive privacy rules.

WHAT IS NOT VERIFIED:
- Prisma generation and migrations, fictional user, login and dashboard screenshots: blocked by the active proxy policy.
- Fresh source build and full runtime readiness.
- GitHub Actions outcome is separate from these local results; consult the PR checks.

TESTS: 3179 passed, 3 failed, 12 skipped/pending; 3194 discovered assertions. Additionally 31 test files failed collection and have no assertion counts.
Command: `cd web && npm test -- --reporter=json --outputFile=/workspace/m0-evidence/web-tests.json`
Exit status: 1. Local Node: 24.22.1. All three failed assertions and all collection failures report an uninitialized Prisma client, after generation failed with HTTP 403.

## Failed assertions

- `__tests__/telemetry/nestedGenerationSpan.spec.ts` — agent.nested span records surface, num_ctx, usage and the caller's input sizes
- `__tests__/telemetry/nestedGenerationSpan.spec.ts` — agent.nested span marks an incomplete generation as an error span
- `__tests__/telemetry/nestedGenerationSpan.spec.ts` — agent.nested span still records a span when the guard rejects the call as busy

## Files that failed collection

- `__tests__/ActivitiesContainer.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/ActivityForm.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/AddContact.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/AddJob.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/AddStageDialog.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/AdminTabsContainer.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/CompanyDetails.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/ContactsContainer.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/InterviewsContainer.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/JobContactsTab.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/JobDetails.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/JobsAppliedCard.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/JobsContainer.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/TaskForm.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/TasksContainer.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/TasksPageClient.spec.tsx`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/agentAddJobTool.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/agentChatRoute.spec.ts`: [vitest] There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://vitest.dev/api/vi.html#vi-mock
- `__tests__/agentCoverLetterTool.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/agentErrors.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/agentGetResumeTool.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/agentMatchJobTool.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/agentReviewResumeTool.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/api-auth-contract.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/backupSnapshot.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/importOrder.spec.ts`: Cannot read properties of undefined (reading 'datamodel')
- `__tests__/jobStageShared.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/lever-fetch.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/mcpUpdateJob.spec.ts`: [vitest] There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://vitest.dev/api/vi.html#vi-mock
- `__tests__/resolveJobType.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
- `__tests__/resolveWorkplaceType.spec.ts`: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.

NEW DEPENDENCIES + LICENCES: no additions to upstream package manifest or lockfile. Original JobSync MIT licence is in web/LICENSE. See THIRD_PARTY.md.

RISKS / QUESTIONS:
- `binaries.prisma.sh` is absent from the active allowlist; checksum fetch returns `403 Forbidden` and a direct connection reports `CONNECT tunnel failed, response 403`.
- The domain addition and updated setup instructions are saved in the environment draft; user review/save and Publish are required to activate them. TLS and checksum verification were not disabled.
- PR targets main; no merge performed.

SCREENSHOTS: none; the app cannot complete migrations while the Prisma download is blocked.

## Exact diagnostic/setup commands executed
```sh
cd /workspace/job/web
npm ci --strict-ssl=true
npx prisma generate
npm test -- --reporter=json --outputFile=/workspace/m0-evidence/web-tests.json
```

The earlier upstream checkout was started with `docker compose up -d`, followed by a cloud CA mount override. Postgres became healthy; the app failed during Prisma migration setup. That app was stopped to avoid repeated failed restarts. No successful login/dashboard run is claimed.
