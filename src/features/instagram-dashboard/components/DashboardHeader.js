import { styles } from "../styles";

/**
 * DashboardHeader component rendering the sticky top navigation header.
 */
export function DashboardHeader() {
  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <div style={styles.logoCircle} />
        <span style={styles.headerTitle}>Professional Dashboard</span>
      </div>
      <div style={styles.headerRight}>
        <button style={styles.timeframeButton}>Last 90 days ▾</button>
        <button style={styles.exportButton}>Export</button>
      </div>
    </header>
  );
}
