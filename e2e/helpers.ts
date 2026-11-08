import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { de } from "../src/i18n/locales/de";

export const FAKE_URL = "http://localhost:4010";
export const VALID_KEY = "sk-ant-test-valid";
export const APP_PATH = "/schulguide/";
export const t = de;

interface ContentBlock {
  type: string;
  text?: string;
  cache_control?: { type: string; ttl?: string };
}

export interface RecordedRequest {
  headers: Record<string, string>;
  body: {
    cache_control?: { type: string };
    output_config?: { effort: string };
    system: ContentBlock[];
    messages: { role: string; content: ContentBlock[]; output_config?: { effort: string } }[];
  };
}

export async function resetFake(request: APIRequestContext): Promise<void> {
  const response = await request.post(`${FAKE_URL}/__reset`);
  expect(response.ok()).toBe(true);
}

export async function failNext(request: APIRequestContext, status: number): Promise<void> {
  const response = await request.post(`${FAKE_URL}/__fail-next`, { data: { status } });
  expect(response.ok()).toBe(true);
}

export async function lastRequest(request: APIRequestContext): Promise<RecordedRequest> {
  return (await (await request.get(`${FAKE_URL}/__last-request`)).json()) as RecordedRequest;
}

export async function openChat(page: Page): Promise<void> {
  await page.goto(APP_PATH);
  await page.evaluate((key) => localStorage.setItem("schulguide.apiKey", key), VALID_KEY);
  await page.reload();
  await expect(composerInput(page)).toBeVisible();
}

export function composerInput(page: Page): Locator {
  return page.getByRole("textbox", { name: t.chat.inputLabel });
}

export function botAnswers(page: Page): Locator {
  return page.getByRole("article", { name: t.chat.bot });
}

export async function ask(page: Page, question: string): Promise<Locator> {
  const before = await botAnswers(page).count();
  await composerInput(page).fill(question);
  await page.getByRole("button", { name: t.chat.send }).click();
  return waitForAnswer(page, before);
}

export async function waitForAnswer(page: Page, previousCount: number): Promise<Locator> {
  const answer = botAnswers(page).nth(previousCount);
  await expect(answer.getByText(t.usage.title)).toBeVisible();
  return answer;
}

export async function cacheReadTokens(answer: Locator): Promise<number> {
  await answer.getByText(t.usage.title).click();
  const value = answer.getByTestId("usage-cache-read");
  await expect(value).toBeVisible();
  return Number((await value.innerText()).replace(/\D/g, ""));
}

export async function hasNoHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}
