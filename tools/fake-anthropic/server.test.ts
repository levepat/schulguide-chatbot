import Anthropic, { AuthenticationError, BadRequestError, RateLimitError } from "@anthropic-ai/sdk";
import type { MessageCreateParamsBase } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { EFFORT_BETA } from "./inspectRequest.ts";
import { createFakeServer, VALID_KEY } from "./server.ts";
import { FAKE_SIGNATURE } from "./sse.ts";

const server = createFakeServer({ chunkDelayMs: 0 });
let baseURL = "";

beforeAll(async () => {
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((done) => server.close(() => done()));
});

beforeEach(async () => {
  await fetch(`${baseURL}/__reset`, { method: "POST" });
});

const client = (apiKey = VALID_KEY) => new Anthropic({ apiKey, baseURL, maxRetries: 0 });

const params = (effort: "low" | "high"): MessageCreateParamsBase => ({
    model: "claude-sonnet-5-5",
    max_tokens: 1000,
    betas: [EFFORT_BETA],
    cache_control: { type: "ephemeral" },
    output_config: { effort },
    thinking: { type: "adaptive", display: "summarized" },
    system: [{ type: "text", text: "S".repeat(4000), cache_control: { type: "ephemeral", ttl: "1h" } }],
    messages: [{ role: "user", content: [{ type: "text", text: "Hallo" }] }],
});

describe("fake server", () => {
  it("lists models for the valid key and rejects others with 401", async () => {
    await expect(client().models.list()).resolves.toBeDefined();
    await expect(client("sk-ant-wrong").models.list()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("streams a reply the SDK can accumulate, including usage details", async () => {
    const message = await client().beta.messages.stream(params("low")).finalMessage();
    expect(message.content).toHaveLength(1);
    expect(message.content[0]).toMatchObject({ type: "text" });
    expect(message.content[0].type === "text" && message.content[0].text).toMatch(/^Fake-Antwort #1, effort=low\./);
    expect(message.stop_reason).toBe("end_turn");
    expect(message.usage.cache_creation?.ephemeral_1h_input_tokens).toBe(1000);
    expect(message.usage.output_tokens_details?.thinking_tokens).toBe(0);
  });

  it("sends a signed thinking block at high effort", async () => {
    const message = await client().beta.messages.stream(params("high")).finalMessage();
    expect(message.content[0]).toMatchObject({ type: "thinking", signature: FAKE_SIGNATURE });
    expect(message.usage.output_tokens_details?.thinking_tokens).toBeGreaterThan(0);
  });

  it("records the last request with headers and body", async () => {
    await client().beta.messages.stream(params("low")).finalMessage();
    const last = (await (await fetch(`${baseURL}/__last-request`)).json()) as {
      headers: Record<string, string>;
      body: { cache_control: unknown };
    };
    expect(last.headers["anthropic-beta"]).toContain(EFFORT_BETA);
    expect(last.body.cache_control).toEqual({ type: "ephemeral" });
  });

  it("fails the next request with the injected status", async () => {
    await fetch(`${baseURL}/__fail-next`, { method: "POST", body: JSON.stringify({ status: 429 }) });
    await expect(client().beta.messages.stream(params("low")).finalMessage()).rejects.toBeInstanceOf(RateLimitError);
    await expect(client().beta.messages.stream(params("low")).finalMessage()).resolves.toBeDefined();
  });

  it("answers CORS preflights and mirrors the requested headers", async () => {
    const response = await fetch(`${baseURL}/v1/messages`, {
      method: "OPTIONS",
      headers: { "access-control-request-headers": "x-api-key,anthropic-beta,x-stainless-os" },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-headers")).toBe("x-api-key,anthropic-beta,x-stainless-os");
  });

  it("rejects effort messages without the beta header", async () => {
    const { betas: _betas, ...rest } = params("low");
    const request: MessageCreateParamsBase = {
      ...rest,
      messages: [
        { role: "user", content: [{ type: "text", text: "a" }] },
        { role: "assistant", content: [{ type: "text", text: "b" }] },
        { role: "system", content: [], output_config: { effort: "high" } },
        { role: "user", content: [{ type: "text", text: "c" }] },
      ],
    };
    await expect(client().beta.messages.stream(request).finalMessage()).rejects.toBeInstanceOf(BadRequestError);
  });
});
