---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Unit tests (Vitest)

- Test pure logic only: `costCalculator`, `requestBuilder`, `apiErrors`, `keyFragment`, `viennaDate`, `detectLocale`, `staticPrefix`. No network, no real timers, no SDK calls.
- Co-locate: `foo.ts` → `foo.test.ts` in the same folder.
- Inject time and environment (e.g. `viennaDate(new Date("2026-11-13T23:30:00Z"))`, `detectLocale(["sr-Latn"])`); never depend on the machine clock or locale.
- One behaviour per `it`, name it as a statement: `it("inserts an effort message only when effort changes")`.
- Assert on exact structures for request shape (`toEqual`) and byte-equality for `STATIC_PREFIX` (`toBe`).
- Cover the cases listed in SPEC §10.1 explicitly; keep a test per bullet.
- No snapshot tests for request bodies – they hide which field matters.
