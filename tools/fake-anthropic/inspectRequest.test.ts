import { describe, expect, it } from "vitest";
import { countUserTurns, EFFORT_BETA, effectiveEffort, validationError } from "./inspectRequest.ts";
import type { MessagesRequest } from "./requestTypes.ts";

const user = (text: string) => ({ role: "user", content: [{ type: "text", text }] });
const assistant = (text: string) => ({ role: "assistant", content: [{ type: "text", text }] });
const effort = (value: string) => ({ role: "system", content: [], output_config: { effort: value } });

describe("effectiveEffort", () => {
  it("uses top-level effort without effort messages", () => {
    expect(effectiveEffort({ output_config: { effort: "low" }, messages: [user("a")] })).toBe("low");
  });

  it("uses the last effort message before the last user turn", () => {
    const request: MessagesRequest = {
      output_config: { effort: "low" },
      messages: [user("a"), assistant("b"), effort("max"), user("c"), assistant("d"), effort("high"), user("e")],
    };
    expect(effectiveEffort(request)).toBe("high");
  });
});

describe("countUserTurns", () => {
  it("counts only user messages", () => {
    expect(countUserTurns({ messages: [user("a"), assistant("b"), effort("high"), user("c")] })).toBe(2);
  });
});

describe("validationError", () => {
  it("rejects system messages without the effort beta header", () => {
    expect(validationError({ messages: [user("a"), effort("high"), user("b")] }, undefined)).toContain(EFFORT_BETA);
  });

  it("accepts system messages with the effort beta header among others", () => {
    expect(validationError({ messages: [user("a"), effort("high"), user("b")] }, `foo-1, ${EFFORT_BETA}`)).toBeNull();
  });

  it("rejects thinking blocks without signature", () => {
    const request: MessagesRequest = {
      messages: [user("a"), { role: "assistant", content: [{ type: "thinking", thinking: "x" }] }, user("b")],
    };
    expect(validationError(request, EFFORT_BETA)).toContain("signature");
  });
});
