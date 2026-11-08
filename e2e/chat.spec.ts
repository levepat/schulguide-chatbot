import { expect, test } from "@playwright/test";
import { ask, botAnswers, hasNoHorizontalScroll, openChat, resetFake, t, waitForAnswer } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await resetFake(request);
  await openChat(page);
});

test("sends an example question and streams a Markdown answer", async ({ page }) => {
  await page.getByRole("button", { name: t.chat.examples.openDay }).click();

  await expect(page.getByRole("article", { name: t.chat.you })).toHaveText(t.chat.examples.openDay);
  const streaming = botAnswers(page).first();
  await expect(streaming).toHaveAttribute("aria-busy", "true");
  await expect(streaming).toContainText("Fake-Antwort #1");
  await expect(page.getByRole("button", { name: t.chat.send })).toBeDisabled();

  const answer = await waitForAnswer(page, 0);
  await expect(answer).not.toHaveAttribute("aria-busy", "true");
  await expect(answer.getByRole("listitem").first()).toBeVisible();
  await expect(answer.getByRole("table")).toBeVisible();
  await expect(answer.getByRole("cell", { name: "Datenbanken und Informationssysteme" })).toBeVisible();
  await expect(answer.getByRole("link", { name: "Link zur Schule" })).toHaveAttribute("target", "_blank");
  await expect(answer.getByText("Testantwort", { exact: true })).toBeVisible();
});

test("fits 360 px without horizontal page scroll, tables scroll inside", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  expect(await hasNoHorizontalScroll(page)).toBe(true);
  const answer = await ask(page, t.chat.examples.compare);
  expect(await hasNoHorizontalScroll(page)).toBe(true);
  const table = answer.getByRole("table");
  const tableWidth = await table.evaluate((element) => element.scrollWidth);
  const wrapperWidth = await table.evaluate((element) => element.parentElement?.clientWidth ?? 0);
  expect(tableWidth).toBeGreaterThan(wrapperWidth);
});

test("new conversation clears the history and shows the example questions", async ({ page }) => {
  await ask(page, t.chat.examples.admission);
  await expect(botAnswers(page)).toHaveCount(1);

  await page.getByRole("button", { name: t.chat.newConversation }).click();
  await expect(botAnswers(page)).toHaveCount(0);
  await expect(page.getByRole("article", { name: t.chat.you })).toHaveCount(0);
  await expect(page.getByRole("button", { name: t.chat.examples.openDay })).toBeVisible();
});
