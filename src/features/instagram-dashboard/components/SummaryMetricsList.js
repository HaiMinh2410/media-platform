import { styles } from "../styles";

/**
 * SummaryMetricsList component rendering a grid of key metrics cards.
 * 
 * @param {Object} props
 * @param {Array} props.summaryMetrics - List of metrics with label, value, and accent color.
 */
export function SummaryMetricsList({ summaryMetrics }) {
  return (
    <section style={styles.summaryStrip}>
      {summaryMetrics.map((metricSummary) => (
        <div key={metricSummary.label} style={styles.summaryCard}>
          <div style={styles.summaryLabel}>{metricSummary.label}</div>
          <div
            style={{
              ...styles.summaryValue,
              color: metricSummary.accent,
            }}
          >
            {metricSummary.value}
          </div>
        </div>
      ))}
    </section>
  );
}
