import { expect, test } from "@playwright/test";
import { ask, cacheReadTokens, lastRequest, openChat, resetFake, t } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await resetFake(request);
  await openChat(page);
});

test("second question reads from the cache and the request carries both cache markers", async ({ page, request }) => {
  const first = await ask(page, t.chat.examples.informatik);
  expect(await cacheReadTokens(first)).toBe(0);

  const second = await ask(page, t.chat.examples.compare);
  await expect(second).toContainText("Fake-Antwort #2");
  expect(await cacheReadTokens(second)).toBeGreaterThan(0);

  const { body } = await lastRequest(request);
  expect(body.cache_control).toEqual({ type: "ephemeral" });
  expect(body.system[0].cache_control).toEqual({ type: "ephemeral", ttl: "1h" });
  expect(body.system[1].cache_control).toBeUndefined();
  expect(body.system[1].text).toMatch(/^Today's date: \d{4}-\d{2}-\d{2} \(\w+\)\.$/);
  expect(JSON.stringify(body.messages)).not.toContain("cache_control");
});
