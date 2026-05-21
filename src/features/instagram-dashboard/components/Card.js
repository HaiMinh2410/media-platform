import { THEME_COLORS } from "../utils";

/**
 * A styled wrapper component representing a card on the dashboard.
 * It provides a standardized background, border, padding, and layout.
 *
 * @param {Object} props
 * @param {string} props.title - The title of the card.
 * @param {React.ReactNode} props.children - The content to be rendered inside the card.
 * @param {Object} [props.customStyle] - Optional additional CSS styling.
 */
export function Card({ title, children, customStyle = {} }) {
  const cardStyle = {
    ...styles.cardContainer,
    ...customStyle,
  };

  return (
    <div style={cardStyle}>
      {title && (
        <div style={styles.headerContainer}>
          <span style={styles.titleText}>{title}</span>
          <span style={styles.infoIcon}>ⓘ</span>
        </div>
      )}
      {children}
    </div>
  );
}

const styles = {
  cardContainer: {
    background: THEME_COLORS.cardBackground,
    border: `1px solid ${THEME_COLORS.cardBorder}`,
    borderRadius: 16,
    padding: "24px",
  },
  headerContainer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 700,
    color: THEME_COLORS.textPrimary,
    fontFamily: "'DM Sans', sans-serif",
  },
  infoIcon: {
    fontSize: 14,
    color: THEME_COLORS.noteText,
  },
};
