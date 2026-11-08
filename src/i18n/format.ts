export function formatInteger(value: number, languageTag: string): string {
  return new Intl.NumberFormat(languageTag, { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(ratio: number, languageTag: string): string {
  return new Intl.NumberFormat(languageTag, { style: "percent", maximumFractionDigits: 0 }).format(ratio);
}

export function formatSeconds(ms: number, languageTag: string): string {
  return new Intl.NumberFormat(languageTag, {
    style: "unit",
    unit: "second",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ms / 1000);
}
