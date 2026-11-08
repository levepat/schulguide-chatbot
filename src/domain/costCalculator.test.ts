import { describe, expect, it } from "vitest";
import {
  cacheHitRate,
  cost,
  costWithoutCache,
  formatUsd,
  sumTokenCounts,
  toTokenCounts,
} from "./costCalculator";
import type { TurnUsage } from "./types";

const million = 1_000_000;

function usage(overrides: Partial<TurnUsage>): TurnUsage {
  return {
    inputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheCreation: { ephemeral5mInputTokens: 0, ephemeral1hInputTokens: 0 },
    cacheReadInputTokens: 0,
    outputTokens: 0,
    thinkingTokens: null,
    ...overrides,
  };
}

describe("cost", () => {
  it("prices fresh input at 2.00 USD per million tokens", () => {
    expect(cost(toTokenCounts(usage({ inputTokens: million })))).toBeCloseTo(2.0);
  });

  it("prices 5-minute cache writes at 2.50 USD per million tokens", () => {
    const counts = toTokenCounts(
      usage({ cacheCreationInputTokens: million, cacheCreation: { ephemeral5mInputTokens: million, ephemeral1hInputTokens: 0 } }),
    );
    expect(cost(counts)).toBeCloseTo(2.5);
  });

  it("prices 1-hour cache writes at 4.00 USD per million tokens", () => {
    const counts = toTokenCounts(
      usage({ cacheCreationInputTokens: million, cacheCreation: { ephemeral5mInputTokens: 0, ephemeral1hInputTokens: million } }),
    );
    expect(cost(counts)).toBeCloseTo(4.0);
  });

  it("prices cache reads at 0.10 USD per million tokens", () => {
    expect(cost(toTokenCounts(usage({ cacheReadInputTokens: million })))).toBeCloseTo(0.1);
  });

  it("prices output including thinking at 10.00 USD per million tokens", () => {
    expect(cost(toTokenCounts(usage({ outputTokens: million, thinkingTokens: 400_000 })))).toBeCloseTo(10.0);
  });

  it("adds all items together", () => {
    const counts = toTokenCounts(
      usage({
        inputTokens: 100,
        cacheCreationInputTokens: 300,
        cacheCreation: { ephemeral5mInputTokens: 200, ephemeral1hInputTokens: 100 },
        cacheReadInputTokens: 30_000,
        outputTokens: 250,
      }),
    );
    expect(cost(counts)).toBeCloseTo((100 * 2 + 200 * 2.5 + 100 * 4 + 30_000 * 0.1 + 250 * 10) / million, 12);
  });

  it("treats cache_creation_input_tokens as 5-minute writes when the breakdown is missing", () => {
    const counts = toTokenCounts(usage({ cacheCreationInputTokens: 1000, cacheCreation: null }));
    expect(counts.cacheWrite5m).toBe(1000);
    expect(counts.cacheWrite1h).toBe(0);
    expect(cost(counts)).toBeCloseTo((1000 * 2.5) / million, 12);
  });
});

describe("costWithoutCache", () => {
  it("prices every input token as fresh input", () => {
    const counts = toTokenCounts(
      usage({
        inputTokens: 100,
        cacheCreationInputTokens: 300,
        cacheCreation: { ephemeral5mInputTokens: 200, ephemeral1hInputTokens: 100 },
        cacheReadInputTokens: 30_000,
        outputTokens: 250,
      }),
    );
    expect(costWithoutCache(counts)).toBeCloseTo((30_400 * 2 + 250 * 10) / million, 12);
  });

  it("is far higher than the cached cost for a typical follow-up question", () => {
    const counts = toTokenCounts(usage({ inputTokens: 50, cacheReadInputTokens: 30_000, outputTokens: 200 }));
    expect(cost(counts)).toBeLessThan(0.01);
    expect(costWithoutCache(counts)).toBeGreaterThan(10 * cost(counts));
  });
});

describe("cacheHitRate", () => {
  it("divides cache reads by all input tokens", () => {
    const counts = toTokenCounts(
      usage({
        inputTokens: 100,
        cacheCreationInputTokens: 900,
        cacheCreation: { ephemeral5mInputTokens: 900, ephemeral1hInputTokens: 0 },
        cacheReadInputTokens: 9000,
      }),
    );
    expect(cacheHitRate(counts)).toBeCloseTo(0.9);
  });

  it("is zero when there is no input", () => {
    expect(cacheHitRate(toTokenCounts(usage({})))).toBe(0);
  });
});

describe("sumTokenCounts", () => {
  it("sums all items over a conversation", () => {
    const total = sumTokenCounts([
      usage({ inputTokens: 10, cacheReadInputTokens: 100, outputTokens: 5, thinkingTokens: 3 }),
      usage({ inputTokens: 20, cacheCreationInputTokens: 7, cacheCreation: null, outputTokens: 6 }),
    ]);
    expect(total).toEqual({ input: 30, cacheWrite5m: 7, cacheWrite1h: 0, cacheRead: 100, output: 11, thinking: 3 });
  });
});

describe("formatUsd", () => {
  it("shows amounts below one dollar in cents with two decimals", () => {
    expect(formatUsd(0.0031, "de-AT")).toBe("0,31 ¢");
    expect(formatUsd(0.0031, "en-GB")).toBe("0.31 ¢");
  });

  it("shows amounts from one dollar upwards in dollars", () => {
    expect(formatUsd(1.5, "en-US")).toBe("$1.50");
  });
});
