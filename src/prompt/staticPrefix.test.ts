import { describe, expect, it } from "vitest";
import { composeStaticPrefix, STATIC_PREFIX } from "./staticPrefix";

describe("composeStaticPrefix", () => {
  it("wraps the school info in <school_info> after the system prompt", () => {
    expect(composeStaticPrefix("PROMPT", "INFO")).toBe("PROMPT\n\n<school_info>\nINFO\n</school_info>\n");
  });

  it("is byte-identical for two calls with the same input", () => {
    expect(composeStaticPrefix("A", "B")).toBe(composeStaticPrefix("A", "B"));
  });
});

describe("STATIC_PREFIX", () => {
  it("starts with the system prompt and ends with the closing school_info tag", () => {
    expect(STATIC_PREFIX.startsWith("You are the visitor guide of HTL Spengergasse")).toBe(true);
    expect(STATIC_PREFIX.endsWith("\n</school_info>\n")).toBe(true);
  });
});
