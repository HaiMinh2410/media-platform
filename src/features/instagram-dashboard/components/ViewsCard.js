import { Card } from "./Card";
import { StatBlock } from "./StatBlock";
import { ContentBar } from "./ContentBar";
import { THEME_COLORS } from "../utils";
import { styles } from "../styles";

/**
 * ViewsCard component displaying the breakdown of account views,
 * including follower/non-follower ratio and type of content viewed.
 *
 * @param {Object} props
 * @param {Object} props.viewsData - Views specific metrics (total, followers_pct, nonfollowers_pct, accounts_reached).
 * @param {string} props.activeViewTab - Currently active tab filtering content type.
 * @param {Function} props.setActiveViewTab - State setter to switch active views filter.
 * @param {Object} props.contentData - Data percentages for current content type (posts, reels, stories).
 */
export function ViewsCard({
  viewsData,
  activeViewTab,
  setActiveViewTab,
  contentData,
}) {
  return (
    <Card title="Views" customStyle={styles.rowMargin}>
      <div style={styles.twoColumnGrid}>
        {/* Left Column: View Stats & Audience Split */}
        <div>
          <StatBlock value={viewsData.total} label="Views" />
          <div style={styles.statDetailList}>
            <div style={styles.statDetailRow}>
              <span>Followers</span>
              <span style={{ ...styles.boldText, color: THEME_COLORS.primary }}>
                {viewsData.followers_pct}%
              </span>
            </div>
            <div style={styles.statDetailRow}>
              <span>Non-followers</span>
              <span style={{ ...styles.boldText, color: THEME_COLORS.secondary }}>
                {viewsData.nonfollowers_pct}%
              </span>
            </div>
          </div>

          {/* Followers vs Non-followers stacked bar chart */}
          <div style={styles.stackedBarBg}>
            <div
              style={{
                width: `${viewsData.followers_pct}%`,
                height: "100%",
                background: THEME_COLORS.primary,
                float: "left",
              }}
            />
            <div
              style={{
                width: `${viewsData.nonfollowers_pct}%`,
                height: "100%",
                background: THEME_COLORS.secondary,
                float: "left",
              }}
            />
          </div>

          <div style={styles.dividerTop}>
            <div style={styles.statDetailRow}>
              <span style={{ color: THEME_COLORS.primary, fontWeight: 600 }}>
                Accounts reached
              </span>
              <span style={styles.whiteBoldText}>
                {viewsData.accounts_reached.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Views by Content Type with filters */}
        <div>
          <div style={styles.columnSubtitle}>By content type</div>
          <div style={styles.buttonTabContainer}>
            {["all", "followers", "nonfollowers"].map((tabType) => (
              <button
                key={tabType}
                onClick={() => setActiveViewTab(tabType)}
                style={{
                  ...styles.tabButton,
                  background:
                    activeViewTab === tabType
                      ? THEME_COLORS.primary
                      : THEME_COLORS.barBackground,
                  color:
                    activeViewTab === tabType
                      ? THEME_COLORS.textPrimary
                      : THEME_COLORS.textMuted,
                }}
              >
                {tabType === "all"
                  ? "All"
                  : tabType === "followers"
                  ? "Followers"
                  : "Non-followers"}
              </button>
            ))}
          </div>

          <ContentBar
            label="Posts"
            percentage={contentData.posts}
            barColor={THEME_COLORS.primary}
          />
          <ContentBar
            label="Reels"
            percentage={contentData.reels}
            barColor={THEME_COLORS.secondary}
          />
          <ContentBar
            label="Stories"
            percentage={contentData.stories}
            barColor={THEME_COLORS.primary}
          />

          <div style={styles.legendContainer}>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: THEME_COLORS.primary }} />
              Followers
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: THEME_COLORS.secondary }} />
              Non-followers
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
