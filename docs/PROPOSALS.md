# M3 proposal engine

Implementation scope: profile-grounded Arabic/English proposals, a separate AI honesty review plus deterministic evidence checks, per-platform editable price floors, token accounting, and an explicit application-tracker action. No automatic submission.

The proposal engine reuses the existing Gemini / Ollama credentials and AI-call log. Gemini needs a user-configured key or GEMINI_API_KEY on the server; use a free-tier project and its quota limits. Ollama is the fallback. CI uses a deterministic mock provider, never a live model or real credentials.

The copy action must fail closed whenever review fails, claims lack profile evidence, or the draft exceeds 1,200 characters. Profile changes invalidate old approval. Opportunity content is untrusted input, never instructions.
