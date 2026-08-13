# AI Usage Log

AI tools are allowed and expected. This log is not a confession — it is documentation of
how you worked. Declared use costs you nothing.

What we actually read is the last column: what you changed about the output, and why.
"Accepted as-is" is a valid answer for a config file and a worrying one for the
commission calculator.

| Date | Tool | Where | What I asked for | What I changed and why |
| ---- | ---- | ----- | ---------------- | ---------------------- |
| 2026 - 08 12| ChatGpt| Project Understanding an Planing informations|Asked for help understanding the Cadence assignment, identifying today's tasks, and organizing the required documentation.|I compared the suggestions with ASSIGNMENT.md and the Universal Contracts. I decided to create the plan, questions, and first data-model ADR as the Day 1 deliverables. |
| 2026 - 08 12| ChatGpt| Authentication planning |Asked what should be included in the login requirements.|I kept email/password login, JWT authentication, password hashing, roles, and server-side authorization because they are explicitly required. I treated password reset as a clarification question because it is not listed as a MUST requirement. |
| 2026 - 08 13| ChatGpt| AI assistance was used during development to explain backend architecture, troubleshoot PostgreSQL and CORS errors, design authentication and role-based authorization, review API structure, and guide frontend-backend integration. |
| 2026 - 08 13| Gimini Ai| used to generate initial boilerplate, Zod schemas, and basic API endpoints. Every piece of code was manually reviewed and updated: native JavaScript numbers were replaced with Decimal.js to prevent precision errors in payout calculations, CSV parsing was refactored to return detailed row-by-row error logs instead of silently failing, and strict company_id filters were added across all queries to enforce multi-tenant security.|



## Anything AI got wrong

Cases where the generated output was subtly incorrect and you caught it. This section is
worth marks.

## Anything I chose not to use AI for, and why
