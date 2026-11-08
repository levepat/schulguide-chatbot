import { expect, test } from "@playwright/test";
import { openChat, resetFake, t } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await resetFake(request);
  await openChat(page);
});

test("share key shows a QR code and delete key returns to setup", async ({ page }) => {
  await page.getByRole("button", { name: t.settingsButton }).click();
  const dialog = page.getByRole("dialog", { name: t.settings.title });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("sk-ant-…alid")).toBeVisible();

  await dialog.getByRole("button", { name: t.settings.shareKey }).click();
  await expect(dialog.getByRole("img", { name: t.settings.qrAlt })).toBeVisible();
  await expect(dialog.getByText(t.settings.shareHint)).toBeVisible();

  await dialog.getByRole("button", { name: t.settings.deleteKey }).click();
  await dialog.getByRole("button", { name: t.settings.confirmDelete }).click();

  await expect(page.getByRole("heading", { name: t.setup.title })).toBeVisible();
  await expect(page.getByLabel(t.setup.keyLabel, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("schulguide.apiKey"))).toBeNull();
});
