import { expect, test } from "@playwright/test";
import { ask, cacheReadTokens, lastRequest, openChat, resetFake, t } from "./helpers";

const FAKE_THINKING_START = "Die Frage betrifft die Schule.";

test.beforeEach(async ({ page, request }) => {
  await resetFake(request);
  await openChat(page);
});

test("switching to high effort uses an effort message and keeps the cache", async ({ page, request }) => {
  const first = await ask(page, t.chat.examples.openDay);
  await expect(first).toContainText("effort=low");
  await expect(first.getByText(t.chat.thinkingSummary)).toHaveCount(0);

  await page.getByRole("radio", { name: "high", exact: true }).check();
  const second = await ask(page, t.chat.examples.adults);
  await expect(second).toContainText("Fake-Antwort #2, effort=high.");

  const disclosure = second.getByText(t.chat.thinkingSummary);
  const thinking = second.getByText(FAKE_THINKING_START);
  await expect(disclosure).toBeVisible();
  await expect(thinking).toBeHidden();
  await disclosure.click();
  await expect(thinking).toBeVisible();
  await disclosure.click();
  await expect(thinking).toBeHidden();

  expect(await cacheReadTokens(second)).toBeGreaterThan(0);

  const { headers, body } = await lastRequest(request);
  expect(headers["anthropic-beta"]).toContain("mid-conversation-output-config-2026-07-01");
  expect(body.output_config).toEqual({ effort: "low" });
  expect(body.messages.map((message) => message.role)).toEqual(["user", "assistant", "system", "user"]);
  expect(body.messages[2]).toEqual({ role: "system", content: [], output_config: { effort: "high" } });
});
