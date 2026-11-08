import { PRICE_PER_MTOK } from "./pricing";
import type { TurnUsage } from "./types";

export interface TokenCounts {
  input: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
  output: number;
  thinking: number | null;
}

export const ZERO_COUNTS: TokenCounts = {
  input: 0,
  cacheWrite5m: 0,
  cacheWrite1h: 0,
  cacheRead: 0,
  output: 0,
  thinking: null,
};

export function toTokenCounts(usage: TurnUsage): TokenCounts {
  const breakdown = usage.cacheCreation;
  return {
    input: usage.inputTokens,
    cacheWrite5m: breakdown ? breakdown.ephemeral5mInputTokens : usage.cacheCreationInputTokens,
    cacheWrite1h: breakdown ? breakdown.ephemeral1hInputTokens : 0,
    cacheRead: usage.cacheReadInputTokens,
    output: usage.outputTokens,
    thinking: usage.thinkingTokens,
  };
}

export function addTokenCounts(a: TokenCounts, b: TokenCounts): TokenCounts {
  return {
    input: a.input + b.input,
    cacheWrite5m: a.cacheWrite5m + b.cacheWrite5m,
    cacheWrite1h: a.cacheWrite1h + b.cacheWrite1h,
    cacheRead: a.cacheRead + b.cacheRead,
    output: a.output + b.output,
    thinking: a.thinking === null && b.thinking === null ? null : (a.thinking ?? 0) + (b.thinking ?? 0),
  };
}

export function sumTokenCounts(usages: readonly TurnUsage[]): TokenCounts {
  return usages.map(toTokenCounts).reduce(addTokenCounts, ZERO_COUNTS);
}

export function totalInputTokens(counts: TokenCounts): number {
  return counts.input + counts.cacheWrite5m + counts.cacheWrite1h + counts.cacheRead;
}

export function cost(counts: TokenCounts): number {
  const p = PRICE_PER_MTOK;
  return (
    (counts.input * p.input +
      counts.cacheWrite5m * p.cacheWrite5m +
      counts.cacheWrite1h * p.cacheWrite1h +
      counts.cacheRead * p.cacheRead +
      counts.output * p.output) /
    1e6
  );
}

export function costWithoutCache(counts: TokenCounts): number {
  return (totalInputTokens(counts) * PRICE_PER_MTOK.input + counts.output * PRICE_PER_MTOK.output) / 1e6;
}

export function cacheHitRate(counts: TokenCounts): number {
  const total = totalInputTokens(counts);
  return total === 0 ? 0 : counts.cacheRead / total;
}

export function formatUsd(usd: number, languageTag: string): string {
  if (usd < 1) {
    const cents = new Intl.NumberFormat(languageTag, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${cents.format(usd * 100)} ¢`;
  }
  return new Intl.NumberFormat(languageTag, { style: "currency", currency: "USD" }).format(usd);
}
