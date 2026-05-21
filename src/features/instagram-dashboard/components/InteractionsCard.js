import { Card } from "./Card";
import { StatBlock } from "./StatBlock";
import { ContentBar } from "./ContentBar";
import { THEME_COLORS } from "../utils";
import { styles } from "../styles";

/**
 * InteractionsCard component displaying the breakdown of accounts interaction,
 * including follower/non-follower ratio and specific type of interaction actions.
 *
 * @param {Object} props
 * @param {Object} props.interactionsData - Interactions specific metrics (total, followers_pct, nonfollowers_pct, accounts_engaged, by_content).
 */
export function InteractionsCard({ interactionsData }) {
  return (
    <Card title="Interactions" customStyle={styles.rowMargin}>
      <div style={styles.twoColumnGrid}>
        {/* Left Column: Interactions Summary */}
        <div>
          <StatBlock value={interactionsData.total} label="Interactions" />
          <div style={styles.statDetailList}>
            <div style={styles.statDetailRow}>
              <span>Followers</span>
              <span style={{ ...styles.boldText, color: THEME_COLORS.primary }}>
                {interactionsData.followers_pct}%
              </span>
            </div>
            <div style={styles.statDetailRow}>
              <span>Non-followers</span>
              <span style={{ ...styles.boldText, color: THEME_COLORS.secondary }}>
                {interactionsData.nonfollowers_pct}%
              </span>
            </div>
          </div>

          <div style={styles.stackedBarBg}>
            <div
              style={{
                width: `${interactionsData.followers_pct}%`,
                height: "100%",
                background: THEME_COLORS.primary,
                float: "left",
              }}
            />
            <div
              style={{
                width: `${interactionsData.nonfollowers_pct}%`,
                height: "100%",
                background: THEME_COLORS.secondary,
                float: "left",
              }}
            />
          </div>

          <div style={styles.dividerTop}>
            <div style={styles.statDetailRow}>
              <span style={{ color: THEME_COLORS.primary, fontWeight: 600 }}>
                Accounts engaged
              </span>
              <span style={styles.whiteBoldText}>
                {interactionsData.accounts_engaged.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactions by Content Type */}
        <div>
          <div style={styles.columnSubtitle}>By content interactions</div>
          <ContentBar
            label="Posts"
            percentage={interactionsData.by_content.posts}
            barColor={THEME_COLORS.primary}
          />
          <ContentBar
            label="Reels"
            percentage={interactionsData.by_content.reels}
            barColor={THEME_COLORS.secondary}
          />
          <ContentBar
            label="Stories"
            percentage={interactionsData.by_content.stories}
            barColor={THEME_COLORS.primary}
          />

          <div style={styles.legendContainer}>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: THEME_COLORS.primary }} />
              Followers and non-followers
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
