import { describe, expect, it } from "vitest";
import { classifyApiFailure } from "./apiErrors";

describe("classifyApiFailure", () => {
  it("maps 401 to invalidKey", () => {
    expect(classifyApiFailure({ status: 401, message: "invalid x-api-key" }).kind).toBe("invalidKey");
  });

  it("maps a 400 mentioning the credit balance to noCredit", () => {
    const message = "Your credit balance is too low to access the Anthropic API.";
    expect(classifyApiFailure({ status: 400, message }).kind).toBe("noCredit");
  });

  it("maps other 400 errors to badRequest and keeps the message", () => {
    expect(classifyApiFailure({ status: 400, message: "messages: bad" })).toEqual({
      kind: "badRequest",
      detail: "messages: bad",
    });
  });

  it("maps 429, 529 and 5xx to temporary", () => {
    for (const status of [429, 500, 503, 529]) {
      expect(classifyApiFailure({ status, message: "x" }).kind).toBe("temporary");
    }
  });

  it("maps failures without status to network", () => {
    expect(classifyApiFailure({ status: undefined, message: "Connection error." }).kind).toBe("network");
  });
});
