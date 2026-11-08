import { describe, expect, it } from "vitest";
import { detectLocale, resolveInitialLocale } from "./detectLocale";

describe("detectLocale", () => {
  it("matches by language prefix", () => {
    expect(detectLocale(["en-US"])).toBe("en");
    expect(detectLocale(["tr-TR"])).toBe("tr");
    expect(detectLocale(["de-AT"])).toBe("de");
    expect(detectLocale(["SK"])).toBe("sk");
  });

  it("takes the first supported language in order", () => {
    expect(detectLocale(["fr-FR", "cs-CZ", "en"])).toBe("cs");
  });

  it("maps Bosnian, Croatian and Serbian variants to bks", () => {
    for (const language of ["bs", "bs-BA", "hr", "hr-HR", "sr", "sr-Latn", "sr-Latn-RS", "sr-Cyrl"]) {
      expect(detectLocale([language])).toBe("bks");
    }
  });

  it("falls back to de", () => {
    expect(detectLocale(["fr-FR", "it"])).toBe("de");
    expect(detectLocale([])).toBe("de");
  });
});

describe("resolveInitialLocale", () => {
  it("prefers a stored valid choice", () => {
    expect(resolveInitialLocale("sl", ["en-US"])).toBe("sl");
  });

  it("ignores an invalid stored value", () => {
    expect(resolveInitialLocale("xx", ["en-US"])).toBe("en");
  });
});
