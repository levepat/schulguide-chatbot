import { expect, test } from "@playwright/test";
import { APP_PATH, composerInput, resetFake, t, VALID_KEY } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetFake(request);
});

test("shows setup without a key, rejects a wrong key and accepts the valid one", async ({ page }) => {
  await page.goto(APP_PATH);
  await expect(page.getByRole("heading", { name: t.setup.title })).toBeVisible();

  const input = page.getByLabel(t.setup.keyLabel, { exact: true });
  await input.fill("sk-ant-wrong-key");
  await page.getByRole("button", { name: t.setup.save }).click();
  await expect(page.getByRole("alert")).toHaveText(t.setup.invalidKey);
  expect(await page.evaluate(() => localStorage.getItem("schulguide.apiKey"))).toBeNull();

  await input.fill(VALID_KEY);
  await page.getByRole("button", { name: t.setup.save }).click();
  await expect(composerInput(page)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("schulguide.apiKey"))).toBe(VALID_KEY);
});

test("stores the key from the URL fragment and removes the fragment", async ({ page }) => {
  await page.goto(`${APP_PATH}#key=${encodeURIComponent(VALID_KEY)}`);
  await expect(composerInput(page)).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  expect(await page.evaluate(() => localStorage.getItem("schulguide.apiKey"))).toBe(VALID_KEY);
});
