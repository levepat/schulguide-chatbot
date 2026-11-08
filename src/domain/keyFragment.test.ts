import { describe, expect, it } from "vitest";
import { buildShareUrl, maskKey, readKeyFromHash } from "./keyFragment";

describe("readKeyFromHash", () => {
  it("reads the key from the fragment", () => {
    expect(readKeyFromHash("#key=sk-ant-test-valid")).toBe("sk-ant-test-valid");
  });

  it("URL-decodes the key", () => {
    expect(readKeyFromHash("#key=sk-ant%2Babc%3D%3D")).toBe("sk-ant+abc==");
  });

  it("returns null without a fragment", () => {
    expect(readKeyFromHash("")).toBeNull();
    expect(readKeyFromHash("#")).toBeNull();
  });

  it("returns null for an empty key", () => {
    expect(readKeyFromHash("#key=")).toBeNull();
    expect(readKeyFromHash("#key=%20")).toBeNull();
  });

  it("ignores other fragment parameters", () => {
    expect(readKeyFromHash("#foo=1&key=sk-ant-x&bar=2")).toBe("sk-ant-x");
    expect(readKeyFromHash("#foo=1")).toBeNull();
  });
});

describe("buildShareUrl", () => {
  it("builds origin + BASE_URL + encoded key fragment", () => {
    expect(buildShareUrl("https://die-spengergasse.github.io", "/schulguide/", "sk-ant+a/b")).toBe(
      "https://die-spengergasse.github.io/schulguide/#key=sk-ant%2Ba%2Fb",
    );
  });

  it("round-trips through readKeyFromHash", () => {
    const url = new URL(buildShareUrl("http://localhost:4173", "/schulguide/", "sk-ant-api03-xyz_+/="));
    expect(readKeyFromHash(url.hash)).toBe("sk-ant-api03-xyz_+/=");
  });
});

describe("maskKey", () => {
  it("shows only the prefix and the last four characters", () => {
    expect(maskKey("sk-ant-api03-secretABCD")).toBe("sk-ant-…ABCD");
  });
});
