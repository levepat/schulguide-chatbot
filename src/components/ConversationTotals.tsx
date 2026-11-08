import { cost, formatUsd, sumTokenCounts } from "../domain/costCalculator";
import type { AssistantTurn } from "../domain/types";
import { useT } from "../i18n/localeContext";
import styles from "./ConversationTotals.module.css";
import { UsageDetails } from "./UsageDetails";

interface ConversationTotalsProps {
  answers: AssistantTurn[];
}

export function ConversationTotals({ answers }: ConversationTotalsProps) {
  const t = useT();
  const counts = sumTokenCounts(answers.map((answer) => answer.usage));
  return (
    <details className={styles.totals}>
      <summary className={styles.summary}>
        <span className={styles.title}>{t.totals.title}</span>
        <span className={styles.line}>
          {t.totals.answers(answers.length)} · {formatUsd(cost(counts), t.languageTag)}
        </span>
      </summary>
      <UsageDetails counts={counts} />
    </details>
  );
}
