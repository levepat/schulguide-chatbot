import { describe, expect, it } from "vitest";
import { EFFORT_BETA } from "../config";
import type { AssistantTurn, Conversation, Effort, UserTurn } from "../domain/types";
import { STATIC_PREFIX } from "../prompt/staticPrefix";
import { buildRequest } from "./requestBuilder";

const TODAY = "2026-11-13 (Friday)";

function user(text: string, effort: Effort): UserTurn {
  return { id: `u-${text}`, role: "user", text, effort };
}

function assistant(text: string, effort: Effort): AssistantTurn {
  return {
    id: `a-${text}`,
    role: "assistant",
    content: [
      { type: "thinking", thinking: "summary", signature: "sig-123" },
      { type: "text", text },
    ],
    usage: {
      inputTokens: 1,
      cacheCreationInputTokens: 0,
      cacheCreation: null,
      cacheReadInputTokens: 0,
      outputTokens: 1,
      thinkingTokens: null,
    },
    effort,
    timing: { firstTokenMs: 10, totalMs: 20 },
    stopReason: "end_turn",
  };
}

describe("buildRequest: cache layout", () => {
  it("puts a 1h cache marker on system block 1", () => {
    const request = buildRequest({ initialEffort: "low", turns: [user("Hallo", "low")] }, TODAY);
    expect(request.system[0]).toEqual({
      type: "text",
      text: STATIC_PREFIX,
      cache_control: { type: "ephemeral", ttl: "1h" },
    });
  });

  it("puts only the date into system block 2, without a marker", () => {
    const request = buildRequest({ initialEffort: "low", turns: [user("Hallo", "low")] }, TODAY);
    expect(request.system).toHaveLength(2);
    expect(request.system[1]).toEqual({ type: "text", text: "Today's date: 2026-11-13 (Friday)." });
  });

  it("sets top-level automatic cache_control", () => {
    const request = buildRequest({ initialEffort: "low", turns: [user("Hallo", "low")] }, TODAY);
    expect(request.cache_control).toEqual({ type: "ephemeral" });
  });

  it("places no cache markers inside messages", () => {
    const conversation: Conversation = {
      initialEffort: "low",
      turns: [user("a", "low"), assistant("b", "low"), user("c", "high")],
    };
    expect(JSON.stringify(buildRequest(conversation, TODAY).messages)).not.toContain("cache_control");
  });
});

describe("buildRequest: static prefix", () => {
  it("keeps system block 1 byte-identical across calls and dates", () => {
    const first = buildRequest({ initialEffort: "low", turns: [user("a", "low")] }, "2026-11-13 (Friday)");
    const second = buildRequest(
      { initialEffort: "max", turns: [user("b", "low"), assistant("c", "low"), user("d", "max")] },
      "2026-11-14 (Saturday)",
    );
    expect(second.system[0].text).toBe(first.system[0].text);
  });

  it("does not put the current date into system block 1", () => {
    const request = buildRequest({ initialEffort: "low", turns: [user("a", "low")] }, "2099-12-31 (Thursday)");
    expect(request.system[0].text).not.toContain("2099-12-31");
    expect(request.system[1].text).toContain("2099-12-31");
  });
});

describe("buildRequest: effort", () => {
  it("keeps top-level effort at initialEffort after effort changes", () => {
    const conversation: Conversation = {
      initialEffort: "low",
      turns: [user("a", "low"), assistant("b", "low"), user("c", "high"), assistant("d", "high"), user("e", "max")],
    };
    expect(buildRequest(conversation, TODAY).output_config).toEqual({ effort: "low" });
  });

  it("inserts an effort message directly before the user turn whose effort changed", () => {
    const first = assistant("b", "low");
    const conversation: Conversation = {
      initialEffort: "low",
      turns: [user("a", "low"), first, user("c", "high")],
    };
    expect(buildRequest(conversation, TODAY).messages).toEqual([
      { role: "user", content: [{ type: "text", text: "a" }] },
      { role: "assistant", content: first.content },
      { role: "system", content: [], output_config: { effort: "high" } },
      { role: "user", content: [{ type: "text", text: "c" }] },
    ]);
  });

  it("inserts no effort message while the effort stays the same", () => {
    const conversation: Conversation = {
      initialEffort: "high",
      turns: [user("a", "high"), assistant("b", "high"), user("c", "high")],
    };
    const roles = buildRequest(conversation, TODAY).messages.map((message) => message.role);
    expect(roles).toEqual(["user", "assistant", "user"]);
  });

  it("compares against the last effective effort, not against initialEffort", () => {
    const conversation: Conversation = {
      initialEffort: "low",
      turns: [
        user("a", "low"),
        assistant("b", "low"),
        user("c", "high"),
        assistant("d", "high"),
        user("e", "high"),
        assistant("f", "high"),
        user("g", "low"),
      ],
    };
    const efforts = buildRequest(conversation, TODAY)
      .messages.filter((message) => message.role === "system")
      .map((message) => message.output_config.effort);
    expect(efforts).toEqual(["high", "low"]);
  });
});

describe("buildRequest: assistant content", () => {
  it("passes assistant content including the thinking signature through unchanged", () => {
    const answer = assistant("b", "low");
    const conversation: Conversation = { initialEffort: "low", turns: [user("a", "low"), answer, user("c", "low")] };
    const sent = buildRequest(conversation, TODAY).messages[1];
    expect(sent).toEqual({
      role: "assistant",
      content: [
        { type: "thinking", thinking: "summary", signature: "sig-123" },
        { type: "text", text: "b" },
      ],
    });
    expect(sent.content).toBe(answer.content);
  });
});

describe("buildRequest: headers and fixed settings", () => {
  it("sets the mid-conversation effort beta header", () => {
    expect(buildRequest({ initialEffort: "low", turns: [user("a", "low")] }, TODAY).betas).toEqual([EFFORT_BETA]);
    expect(EFFORT_BETA).toBe("mid-conversation-output-config-2026-07-01");
  });

  it("uses adaptive thinking with summarized display", () => {
    expect(buildRequest({ initialEffort: "low", turns: [user("a", "low")] }, TODAY).thinking).toEqual({
      type: "adaptive",
      display: "summarized",
    });
  });
});
