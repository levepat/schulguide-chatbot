import { expect, test } from "@playwright/test";
import { tr } from "../src/i18n/locales/tr";
import { openChat, resetFake, t } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await resetFake(request);
  await openChat(page);
});

test("switching to Türkçe changes the UI and survives a reload", async ({ page }) => {
  await expect(page.getByRole("button", { name: t.chat.examples.openDay })).toBeVisible();

  await page.getByLabel(t.languageLabel).selectOption({ label: "Türkçe" });
  await expect(page.getByRole("button", { name: tr.chat.examples.openDay })).toBeVisible();
  await expect(page.getByRole("button", { name: tr.chat.send })).toBeVisible();
  await expect(page.getByRole("button", { name: t.chat.examples.openDay })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("tr");

  await page.reload();
  await expect(page.getByRole("button", { name: tr.chat.examples.design })).toBeVisible();
  await expect(page.getByLabel(tr.languageLabel)).toHaveValue("tr");
});
