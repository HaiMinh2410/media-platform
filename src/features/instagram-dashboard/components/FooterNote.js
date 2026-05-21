import { styles } from "../styles";

/**
 * FooterNote component rendering the Instagram API information and permissions disclaimer at the bottom.
 */
export function FooterNote() {
  return (
    <footer style={styles.footerNote}>
      <span style={styles.apiNotesHeader}>API Notes: </span>
      Data fetched via Instagram Graph API — metrics include{" "}
      <code style={styles.codeSnippet}>views</code>,{" "}
      <code style={styles.codeSnippet}>reach</code>,{" "}
      <code style={styles.codeSnippet}>total_interactions</code>,{" "}
      <code style={styles.codeSnippet}>accounts_engaged</code>,{" "}
      <code style={styles.codeSnippet}>online_followers</code>,{" "}
      <code style={styles.codeSnippet}>follower_demographics</code>. Requires permissions:{" "}
      <code style={styles.codeSnippet}>instagram_manage_insights</code>,{" "}
      <code style={styles.codeSnippet}>instagram_basic</code>. Data may be delayed up to 48 hours.
    </footer>
  );
}
