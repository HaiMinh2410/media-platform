import { THEME_COLORS } from "../utils";

/**
 * A horizontal bar chart row that represents a single data point.
 * Used in active times followers visualizer.
 *
 * @param {Object} props
 * @param {string} props.label - The label shown on the left (e.g. "12a").
 * @param {number} props.value - The raw value.
 * @param {number} props.maxValue - The maximum value across all hours to calculate the visual width.
 * @param {string} [props.barColor] - CSS background color for the filled portion of the bar.
 */
export function BarRow({
  label,
  value,
  maxValue,
  barColor = THEME_COLORS.primary,
}) {
  const percentage = Math.round((value / maxValue) * 100);

  const fillStyle = {
    ...styles.progressBarFill,
    width: `${percentage}%`,
    background: barColor,
  };

  return (
    <div style={styles.container}>
      <div style={styles.label}>{label}</div>
      <div style={styles.progressBarBg}>
        <div style={fillStyle} />
      </div>
      <div style={styles.valueText}>{value.toLocaleString()}</div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  label: {
    width: 32,
    color: THEME_COLORS.textMuted,
    fontSize: 12,
    textAlign: "right",
    flexShrink: 0,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    background: THEME_COLORS.barBackground,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
  },
  valueText: {
    width: 40,
    color: THEME_COLORS.textSecondary,
    fontSize: 12,
    textAlign: "right",
    flexShrink: 0,
  },
};
