import type { ChatErrorKind } from "../api/apiErrors";

export const LOCALES = ["de", "en", "bks", "sl", "tr", "cs", "sk"] as const;

export type Locale = (typeof LOCALES)[number];

export const EXAMPLE_QUESTION_KEYS = ["openDay", "informatik", "admission", "adults", "compare", "design"] as const;

export type ExampleQuestionKey = (typeof EXAMPLE_QUESTION_KEYS)[number];

export interface UsageSummaryParts {
  cost: string;
  hitRate: string;
  effort: string;
}

export interface Translations {
  languageTag: string;
  htmlLang: string;
  languageName: string;
  appTitle: string;
  logoAlt: string;
  languageLabel: string;
  settingsButton: string;
  setup: {
    title: string;
    intro: string;
    keyLabel: string;
    showKey: string;
    save: string;
    checking: string;
    cancel: string;
    invalidKey: string;
    checkFailed: string;
  };
  chat: {
    emptyTitle: string;
    emptyIntro: string;
    examplesLabel: string;
    examples: Record<ExampleQuestionKey, string>;
    historyLabel: string;
    inputLabel: string;
    inputPlaceholder: string;
    send: string;
    newConversation: string;
    effortLabel: string;
    you: string;
    bot: string;
    writing: string;
    truncated: string;
    thinkingSummary: string;
  };
  usage: {
    title: string;
    summaryLine: (parts: UsageSummaryParts) => string;
    effort: string;
    freshInput: string;
    cacheWrite5m: string;
    cacheWrite1h: string;
    cacheRead: string;
    output: string;
    thinking: string;
    hitRate: string;
    firstToken: string;
    totalTime: string;
    cost: string;
    costWithoutCache: (cost: string) => string;
    notAvailable: string;
  };
  totals: {
    title: string;
    answers: (count: number) => string;
  };
  errors: Record<ChatErrorKind, string> & { retry: string };
  settings: {
    title: string;
    close: string;
    currentKey: string;
    shareKey: string;
    hideShare: string;
    shareHint: string;
    qrAlt: string;
    replaceKey: string;
    deleteKey: string;
    deleteConfirm: string;
    confirmDelete: string;
    cancel: string;
  };
}
