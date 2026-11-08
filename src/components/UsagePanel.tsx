import { cacheHitRate, cost, formatUsd, toTokenCounts } from "../domain/costCalculator";
import type { AssistantTurn } from "../domain/types";
import { formatPercent } from "../i18n/format";
import { useT } from "../i18n/localeContext";
import { UsageDetails } from "./UsageDetails";
import styles from "./UsagePanel.module.css";

interface UsagePanelProps {
  turn: AssistantTurn;
}

export function UsagePanel({ turn }: UsagePanelProps) {
  const t = useT();
  const counts = toTokenCounts(turn.usage);
  const summary = t.usage.summaryLine({
    cost: formatUsd(cost(counts), t.languageTag),
    hitRate: formatPercent(cacheHitRate(counts), t.languageTag),
    effort: turn.effort,
  });
  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        <span className={styles.title}>{t.usage.title}</span>
        <span className={styles.line}>{summary}</span>
      </summary>
      <UsageDetails counts={counts} effort={turn.effort} timing={turn.timing} />
    </details>
  );
}
