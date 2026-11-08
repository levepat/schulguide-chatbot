// Claude Sonnet 5.5, USD per million tokens.
// Source: https://platform.claude.com/docs/en/about-claude/pricing (as of 2026-10-12)
export const PRICE_PER_MTOK = {
  input: 2.0,
  cacheWrite5m: 2.5,
  cacheWrite1h: 4.0,
  cacheRead: 0.1,
  output: 10.0,
} as const;
