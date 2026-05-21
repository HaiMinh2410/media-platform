import { THEME_COLORS } from "../utils";

/**
 * A reusable component to display a primary statistic number with an optional label and secondary subtext.
 *
 * @param {Object} props
 * @param {number|string} props.value - The statistic number/text to show.
 * @param {string} [props.label] - Optional short label below the value.
 * @param {React.ReactNode} [props.subtext] - Optional detail or graphic shown at the bottom.
 */
export function StatBlock({ value, label, subtext }) {
  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div style={styles.container}>
      <div style={styles.valueText}>{formattedValue}</div>
      {label && <div style={styles.labelText}>{label}</div>}
      {subtext && <div style={styles.subtextContainer}>{subtext}</div>}
    </div>
  );
}

const styles = {
  container: {
    marginBottom: 16,
  },
  valueText: {
    fontSize: 36,
    fontWeight: 800,
    color: THEME_COLORS.textPrimary,
    letterSpacing: -1,
    fontFamily: "'DM Sans', sans-serif",
  },
  labelText: {
    fontSize: 13,
    color: THEME_COLORS.statLabel,
    marginTop: 2,
  },
  subtextContainer: {
    marginTop: 12,
  },
};
