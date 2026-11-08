import { describe, expect, it } from "vitest";
import { createCacheSimulator, estimateTokens } from "./cacheSimulator.ts";
import type { MessagesRequest, RequestMessage } from "./requestTypes.ts";

const PREFIX = "P".repeat(40_000);
const PREFIX_TOKENS = estimateTokens(PREFIX);
const DATE = "Today's date: 2026-11-13 (Friday).";
const DATE_TOKENS = estimateTokens(DATE);

function request(messages: RequestMessage[], overrides: Partial<MessagesRequest> = {}): MessagesRequest {
  return {
    cache_control: { type: "ephemeral" },
    output_config: { effort: "low" },
    thinking: { type: "adaptive", display: "summarized" },
    system: [
      { type: "text", text: PREFIX, cache_control: { type: "ephemeral", ttl: "1h" } },
      { type: "text", text: DATE },
    ],
    messages,
    ...overrides,
  };
}

const q1: RequestMessage = { role: "user", content: [{ type: "text", text: "Wann ist der Tag der offenen Tür?" }] };
const a1: RequestMessage = { role: "assistant", content: [{ type: "text", text: "Am 13.11.2026 von 13 bis 18 Uhr." }] };
const q2: RequestMessage = { role: "user", content: [{ type: "text", text: "Und am Samstag?" }] };

describe("cacheSimulator", () => {
  it("writes block 1 as a 1h cache entry on the first request", () => {
    const usage = createCacheSimulator().simulate(request([q1]));
    expect(usage.cache_read_input_tokens).toBe(0);
    expect(usage.cache_creation.ephemeral_1h_input_tokens).toBe(PREFIX_TOKENS);
  });

  it("writes date and messages as a 5m cache entry via top-level cache_control", () => {
    const usage = createCacheSimulator().simulate(request([q1]));
    expect(usage.cache_creation.ephemeral_5m_input_tokens).toBeGreaterThan(0);
    expect(usage.input_tokens).toBe(0);
    expect(usage.cache_creation_input_tokens).toBe(
      usage.cache_creation.ephemeral_1h_input_tokens + usage.cache_creation.ephemeral_5m_input_tokens,
    );
  });

  it("reads block 1 and the date from the cache for a new conversation", () => {
    const simulator = createCacheSimulator();
    simulator.simulate(request([q1]));
    const usage = simulator.simulate(request([q2]));
    expect(usage.cache_read_input_tokens).toBe(PREFIX_TOKENS + DATE_TOKENS);
    expect(usage.cache_creation.ephemeral_1h_input_tokens).toBe(0);
  });

  it("reads the longest known message prefix on a follow-up question", () => {
    const simulator = createCacheSimulator();
    const first = simulator.simulate(request([q1]));
    const second = simulator.simulate(request([q1, a1, q2]));
    expect(second.cache_read_input_tokens).toBe(PREFIX_TOKENS + first.cache_creation.ephemeral_5m_input_tokens);
    const answerTokens = estimateTokens("Am 13.11.2026 von 13 bis 18 Uhr.");
    const questionTokens = estimateTokens("Und am Samstag?");
    expect(second.cache_creation.ephemeral_5m_input_tokens).toBe(answerTokens + questionTokens);
  });

  it("keeps the message cache when effort changes through a system message", () => {
    const simulator = createCacheSimulator();
    const first = simulator.simulate(request([q1]));
    const effortMessage: RequestMessage = { role: "system", content: [], output_config: { effort: "high" } };
    const second = simulator.simulate(request([q1, a1, effortMessage, q2]));
    expect(second.cache_read_input_tokens).toBe(PREFIX_TOKENS + first.cache_creation.ephemeral_5m_input_tokens);
  });

  it("loses the message cache but keeps block 1 when top-level effort changes", () => {
    const simulator = createCacheSimulator();
    simulator.simulate(request([q1]));
    const second = simulator.simulate(request([q1, a1, q2], { output_config: { effort: "high" } }));
    expect(second.cache_read_input_tokens).toBe(PREFIX_TOKENS + DATE_TOKENS);
  });

  it("caches nothing without any cache_control and counts everything as input", () => {
    const simulator = createCacheSimulator();
    const plain = request([q1], {
      cache_control: undefined,
      system: [{ type: "text", text: PREFIX }, { type: "text", text: DATE }],
    });
    simulator.simulate(plain);
    const usage = simulator.simulate(plain);
    expect(usage.cache_read_input_tokens).toBe(0);
    expect(usage.cache_creation_input_tokens).toBe(0);
    expect(usage.input_tokens).toBeGreaterThan(PREFIX_TOKENS);
  });

  it("counts messages after the 1h marker as input when top-level cache_control is missing", () => {
    const simulator = createCacheSimulator();
    simulator.simulate(request([q1], { cache_control: undefined }));
    const usage = simulator.simulate(request([q1, a1, q2], { cache_control: undefined }));
    expect(usage.cache_read_input_tokens).toBe(PREFIX_TOKENS);
    expect(usage.cache_creation_input_tokens).toBe(0);
    expect(usage.input_tokens).toBeGreaterThan(0);
  });

  it("forgets everything on reset", () => {
    const simulator = createCacheSimulator();
    simulator.simulate(request([q1]));
    simulator.reset();
    expect(simulator.simulate(request([q1])).cache_read_input_tokens).toBe(0);
  });
});
