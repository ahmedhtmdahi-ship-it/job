# Opportunity sources (M2)

Only public JSON endpoints are used. No credential, login, scraper, AI call, or application submission is involved. Original source names and canonical links accompany cards. API HTML descriptions are displayed as plain text, never executed.

| Source | Endpoint | Minimum interval | Policy |
| --- | --- | --- | --- |
| Freelancer | www.freelancer.com/api/projects/0.1/projects/active/ | 1 hour | Public projects only; private/deleted projects excluded; hourly budgets are not compared with project minimums |
| Remotive | remotive.com/api/remote-jobs | 6 hours | Adapter implemented, but blocked in the authenticated feed: API notice forbids collecting signups/email addresses to show listings |
| Jobicy | jobicy.com/api/v2/remote-jobs | 1 hour | Credit source and link to original URL |
| Remote OK | remoteok.com/api | 24 hours | Credit Remote OK, link back without nofollow, no logo reuse |
| Arbeitnow | www.arbeitnow.com/api/job-board-api | 1 hour | Only remote=true records; link to original URL |

Notices inspected in public responses on 2026-11-13. HTTP 401/403/429 is blocked, other HTTP/network errors failed, malformed payloads parser_error. Retry-After is respected; no retries or access bypass. Each request times out at 15 seconds. Persistent shared cache and cooldown prevent per-user refresh buttons from multiplying requests. Existing jobs remain visible on failures. No promises of live completeness: feeds can be delayed, filtered, or unavailable.

Paste supports URLs from Khamsat, Mostaql, Kafiil, Ureed, Upwork, Wuzzuf, LinkedIn and Bayt, or text alone. Missing values remain unknown. Text-only items have no external Open button. Explicit `Skills:`/`المهارات:` and `Budget: USD 500-900`/`الميزانية: USD 500-900` lines are recognized. Pasted text is private to its owner.

Ranking weights: skills 50, recency 20 over 30 days, competition 10, matching-currency minimum budget 10, preferred language 10. Unknown dates/bids/budgets earn zero for that factor; currencies are never converted. Skills come from the logged-in user's resume skill tags. Saved/skipped state is private. Per-user canonical URL uniqueness deduplicates across sources without leaking pasted content between accounts.
