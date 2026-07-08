# Source

- Local source path: `skills/1000fetches`
- Source type: packaged product skill maintained with this repository
- Snapshot date: 2026-07-08
- Owner context: `AGENTS.md` describes `skills/1000fetches` as the packaged
  product skill for users and agents working with the library.
- Primary source evidence:
  - `src/client/index.ts` for `createHttpClient`, method APIs, `.contract()`,
    `.data()`, and `.void()`
  - `src/core.ts`, `src/request/defaults.ts`, and `src/request/options.ts` for
    defaults, request option merging, fetch options, and automatic `duplex`
  - `src/contract/index.ts` and `src/types.ts` for response contracts, status
    maps, public contract types, and validation errors
  - `src/utils/path.ts` for path parameter behavior
  - `src/request/retry/retry.ts` for retry defaults and replay rules
  - `src/request/middleware/middleware.ts` for middleware behavior
  - `src/request/serialization/serialization.ts` for body and query
    serialization
  - `README.md` and `docs/BEST_PRACTICES.md` for public usage examples
- Third-party provenance: Examples may mention Standard Schema-compatible
  validators such as Zod, Valibot, or ArkType, but this skill is derived from
  local 1000fetches source and docs rather than third-party guidance.
- Claims: No performance, pass-rate, benchmark, or quality-score claims are
  made by this skill.
