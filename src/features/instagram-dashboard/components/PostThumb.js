import { THEME_COLORS, GRADIENTS } from "../utils";

/**
 * Renders a visual preview card representing a top-performing social post.
 *
 * @param {Object} props
 * @param {string} props.date - The date the post was published (e.g. "Mar 7").
 * @param {string|number} props.metricValue - The highlighted performance metric (e.g. "92K" or "4.8K").
 * @param {string} [props.backgroundGradient] - Optional background gradient string.
 * @param {boolean} [props.isSmallSize=false] - Whether to render a smaller thumbnail (90px) instead of the standard 120px.
 */
export function PostThumb({
  date,
  metricValue,
  backgroundGradient,
  isSmallSize = false,
}) {
  const containerSize = isSmallSize ? 90 : 120;

  const thumbnailContainerStyle = {
    ...styles.thumbnailContainer,
    width: containerSize,
    height: containerSize,
    background: backgroundGradient || GRADIENTS[0],
  };

  return (
    <div style={styles.outerWrapper}>
      <div style={thumbnailContainerStyle}>
        <div style={styles.darkGradientOverlay} />
        <div style={styles.metricBadge}>{metricValue}</div>
      </div>
      <div style={styles.dateLabel}>{date}</div>
    </div>
  );
}

const styles = {
  outerWrapper: {
    textAlign: "center",
  },
  thumbnailContainer: {
    borderRadius: 14,
    display: "flex",
    alignItems: "flex-end",
    padding: 8,
    marginBottom: 6,
    position: "relative",
    overflow: "hidden",
  },
  darkGradientOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))",
  },
  metricBadge: {
    position: "relative",
    background: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: "3px 8px",
    fontSize: 12,
    fontWeight: 700,
    color: THEME_COLORS.textPrimary,
  },
  dateLabel: {
    fontSize: 12,
    color: THEME_COLORS.textMuted,
  },
};
