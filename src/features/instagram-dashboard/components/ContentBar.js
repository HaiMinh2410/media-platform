import { THEME_COLORS } from "../utils";

/**
 * A stylized horizontal bar displaying the percentage contribution of a content type.
 *
 * @param {Object} props
 * @param {string} props.label - Content type label (e.g. "Posts", "Reels").
 * @param {number} props.percentage - The percentage share (0 to 100).
 * @param {string} [props.barColor] - Theme color to base the bar gradient on.
 */
export function ContentBar({
  label,
  percentage,
  barColor = THEME_COLORS.primary,
}) {
  const progressFillStyle = {
    ...styles.progressFill,
    width: `${percentage}%`,
    background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)`,
  };

  return (
    <div style={styles.container}>
      <div style={styles.label}>{label}</div>
      <div style={styles.progressBarBg}>
        <div style={progressFillStyle} />
      </div>
      <div style={styles.percentageText}>{percentage}%</div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  label: {
    width: 48,
    color: THEME_COLORS.textMuted,
    fontSize: 13,
    flexShrink: 0,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    background: THEME_COLORS.barBackground,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  percentageText: {
    width: 44,
    color: THEME_COLORS.textPrimary,
    fontSize: 13,
    textAlign: "right",
    fontWeight: 600,
  },
};
