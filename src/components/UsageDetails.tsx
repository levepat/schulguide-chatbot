import { cacheHitRate, cost, costWithoutCache, formatUsd, type TokenCounts } from "../domain/costCalculator";
import { formatInteger, formatPercent, formatSeconds } from "../i18n/format";
import { useT } from "../i18n/localeContext";
import styles from "./UsageDetails.module.css";

interface UsageDetailsProps {
  counts: TokenCounts;
  effort?: string;
  timing?: { firstTokenMs: number | null; totalMs: number };
}

interface Row {
  id: string;
  label: string;
  value: string;
}

export function UsageDetails({ counts, effort, timing }: UsageDetailsProps) {
  const t = useT();
  const tag = t.languageTag;
  const int = (value: number) => formatInteger(value, tag);
  const seconds = (ms: number | null) => (ms === null ? t.usage.notAvailable : formatSeconds(ms, tag));

  const rows: Row[] = [];
  if (effort) rows.push({ id: "effort", label: t.usage.effort, value: effort });
  rows.push(
    { id: "input", label: t.usage.freshInput, value: int(counts.input) },
    { id: "cache-write-5m", label: t.usage.cacheWrite5m, value: int(counts.cacheWrite5m) },
    { id: "cache-write-1h", label: t.usage.cacheWrite1h, value: int(counts.cacheWrite1h) },
    { id: "cache-read", label: t.usage.cacheRead, value: int(counts.cacheRead) },
    { id: "output", label: t.usage.output, value: int(counts.output) },
    {
      id: "thinking",
      label: t.usage.thinking,
      value: counts.thinking === null ? t.usage.notAvailable : int(counts.thinking),
    },
    { id: "hit-rate", label: t.usage.hitRate, value: formatPercent(cacheHitRate(counts), tag) },
  );
  if (timing) {
    rows.push(
      { id: "first-token", label: t.usage.firstToken, value: seconds(timing.firstTokenMs) },
      { id: "total-time", label: t.usage.totalTime, value: seconds(timing.totalMs) },
    );
  }
  rows.push({ id: "cost", label: t.usage.cost, value: formatUsd(cost(counts), tag) });

  return (
    <>
      <dl className={styles.list}>
        {rows.map((row) => (
          <div key={row.id} className={styles.row}>
            <dt>{row.label}</dt>
            <dd data-testid={`usage-${row.id}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.noCache}>{t.usage.costWithoutCache(formatUsd(costWithoutCache(counts), tag))}</p>
    </>
  );
}
