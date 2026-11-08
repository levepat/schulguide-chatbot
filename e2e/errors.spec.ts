import { expect, test } from "@playwright/test";
import { ask, botAnswers, composerInput, failNext, openChat, resetFake, t, waitForAnswer } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await resetFake(request);
  await openChat(page);
});

test("a 401 during chat returns to setup with a notice", async ({ page, request }) => {
  await failNext(request, 401);
  await composerInput(page).fill(t.chat.examples.openDay);
  await page.getByRole("button", { name: t.chat.send }).click();

  await expect(page.getByRole("heading", { name: t.setup.title })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(t.setup.invalidKey);
  expect(await page.evaluate(() => localStorage.getItem("schulguide.apiKey"))).toBeNull();
});

test("a 529 shows a retry button that works afterwards", async ({ page, request }) => {
  await failNext(request, 529);
  await composerInput(page).fill(t.chat.examples.openDay);
  await page.getByRole("button", { name: t.chat.send }).click();

  const alert = page.getByRole("alert");
  await expect(alert).toContainText(t.errors.temporary);
  await alert.getByRole("button", { name: t.errors.retry }).click();

  const answer = await waitForAnswer(page, 0);
  await expect(answer).toContainText("Fake-Antwort #1");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(botAnswers(page)).toHaveCount(1);
  await ask(page, t.chat.examples.admission);
  await expect(botAnswers(page)).toHaveCount(2);
});
