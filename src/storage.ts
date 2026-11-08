export type StorageKey = "schulguide.apiKey" | "schulguide.locale";

export function readStorage(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode): keep the value in memory only
  }
}

export function removeStorage(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // storage unavailable
  }
}
