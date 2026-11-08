---
paths:
  - "tools/**"
  - "integration-tests/**"
---

# Tooling and integration tests

- `tools/**` runs directly with Node type stripping: erasable TS only (no `enum`, `namespace`, parameter properties, decorators); relative imports end in `.ts`.
- Fake server (`tools/fake-anthropic`) has **zero dependencies** (`node:http`, `node:crypto`) and mirrors the real API's SSE events, error format and `usage` fields (SPEC §10.2).
- Keep pure logic (`cacheSimulator`, SSE encoding) separate from the HTTP layer so Vitest can test it directly (`tools/**/*.test.ts`).
- Integration tests that start the server use an ephemeral port and close it in `afterAll`.
- `fetchPages.ts` fails with a non-zero exit code on any non-200 response; never partially overwrite `context/raw/`.
