import { useInstagramDashboard } from "./hooks/useInstagramDashboard";
import { Card } from "./components/Card";
import { StatBlock } from "./components/StatBlock";
import { BarRow } from "./components/BarRow";
import { ContentBar } from "./components/ContentBar";
import { PostThumb } from "./components/PostThumb";
import { THEME_COLORS, GRADIENTS } from "./utils";

/**
 * Main Professional Instagram Dashboard component.
 * Integrates sub-components, helper functions and states using the custom hook.
 */
export default function InstagramDashboard() {
  const {
    activeViewTab,
    setActiveViewTab,
    selectedDay,
    setSelectedDay,
    contentData,
    maxActiveFollowers,
    summaryMetrics,
    instagramData,
  } = useInstagramDashboard();

  return (
    <div style={styles.dashboardWrapper}>
      {/* Top sticky Navigation Header */}
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

      {/* Main dashboard content */}
      <main style={styles.mainContent}>
        {/* Summary metrics strip */}
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

        {/* Section title */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Account insights</h2>
        </div>

        {/* Views Breakdown Card */}
        <Card title="Views" customStyle={styles.rowMargin}>
          <div style={styles.twoColumnGrid}>
            {/* Left Column: View Stats & Audience Split */}
            <div>
              <StatBlock value={instagramData.views.total} label="Views" />
              <div style={styles.statDetailList}>
                <div style={styles.statDetailRow}>
                  <span>Followers</span>
                  <span style={{ ...styles.boldText, color: THEME_COLORS.primary }}>
                    {instagramData.views.followers_pct}%
                  </span>
                </div>
                <div style={styles.statDetailRow}>
                  <span>Non-followers</span>
                  <span style={{ ...styles.boldText, color: THEME_COLORS.secondary }}>
                    {instagramData.views.nonfollowers_pct}%
                  </span>
                </div>
              </div>

              {/* Followers vs Non-followers stacked bar chart */}
              <div style={styles.stackedBarBg}>
                <div
                  style={{
                    width: `${instagramData.views.followers_pct}%`,
                    height: "100%",
                    background: THEME_COLORS.primary,
                    float: "left",
                  }}
                />
                <div
                  style={{
                    width: `${instagramData.views.nonfollowers_pct}%`,
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
                    {instagramData.views.accounts_reached.toLocaleString()}
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

        {/* Top views content thumbs Card */}
        <Card title="Top content based on views" customStyle={styles.rowMargin}>
          <div style={styles.horizontalThumbList}>
            {instagramData.top_views.map((post, index) => (
              <PostThumb
                key={index}
                date={post.date}
                metricValue={post.views}
                backgroundGradient={GRADIENTS[index % GRADIENTS.length]}
              />
            ))}
          </div>
        </Card>

        {/* Interactions Breakdown Card */}
        <Card title="Interactions" customStyle={styles.rowMargin}>
          <div style={styles.twoColumnGrid}>
            {/* Left Column: Interactions Summary */}
            <div>
              <StatBlock value={instagramData.interactions.total} label="Interactions" />
              <div style={styles.statDetailList}>
                <div style={styles.statDetailRow}>
                  <span>Followers</span>
                  <span style={{ ...styles.boldText, color: THEME_COLORS.primary }}>
                    {instagramData.interactions.followers_pct}%
                  </span>
                </div>
                <div style={styles.statDetailRow}>
                  <span>Non-followers</span>
                  <span style={{ ...styles.boldText, color: THEME_COLORS.secondary }}>
                    {instagramData.interactions.nonfollowers_pct}%
                  </span>
                </div>
              </div>

              <div style={styles.stackedBarBg}>
                <div
                  style={{
                    width: `${instagramData.interactions.followers_pct}%`,
                    height: "100%",
                    background: THEME_COLORS.primary,
                    float: "left",
                  }}
                />
                <div
                  style={{
                    width: `${instagramData.interactions.nonfollowers_pct}%`,
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
                    {instagramData.interactions.accounts_engaged.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactions by Content Type */}
            <div>
              <div style={styles.columnSubtitle}>By content interactions</div>
              <ContentBar
                label="Posts"
                percentage={instagramData.interactions.by_content.posts}
                barColor={THEME_COLORS.primary}
              />
              <ContentBar
                label="Reels"
                percentage={instagramData.interactions.by_content.reels}
                barColor={THEME_COLORS.secondary}
              />
              <ContentBar
                label="Stories"
                percentage={instagramData.interactions.by_content.stories}
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

        {/* Top interactions content thumbs Card */}
        <Card title="Top content based on interactions" customStyle={styles.rowMargin}>
          <div style={styles.horizontalThumbList}>
            {instagramData.top_interactions.map((post, index) => (
              <PostThumb
                key={index}
                date={post.date}
                metricValue={post.count}
                backgroundGradient={GRADIENTS[(index + 2) % GRADIENTS.length]}
              />
            ))}
          </div>
        </Card>

        {/* Profile Stats and Followers Distribution Grid */}
        <div style={styles.splitGrid}>
          {/* Left Split Card: Profile Activity */}
          <Card title="Profile">
            <StatBlock value={instagramData.profile.activity} label="Profile activity" />
            <div style={styles.dividerTop}>
              <div style={styles.statDetailRow}>
                <span>Profile visits</span>
                <span style={styles.whiteBoldText}>
                  {instagramData.profile.visits.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Right Split Card: Followers Activity Graph */}
          <Card title="Followers">
            <div style={styles.twoColumnGrid}>
              <div>
                <StatBlock value={instagramData.followers.total} label="Total followers" />
              </div>
              <div>
                <div style={styles.columnSubtitle}>Most active times</div>

                {/* Day of week selector tab */}
                <div style={styles.buttonTabContainer}>
                  {["M", "Tu", "W", "Th", "F", "Sa", "Su"].map((dayOfWeek) => (
                    <button
                      key={dayOfWeek}
                      onClick={() => setSelectedDay(dayOfWeek)}
                      style={{
                        ...styles.dayButton,
                        background:
                          selectedDay === dayOfWeek
                            ? THEME_COLORS.primary
                            : THEME_COLORS.barBackground,
                        color:
                          selectedDay === dayOfWeek
                            ? THEME_COLORS.textPrimary
                            : THEME_COLORS.textMuted,
                      }}
                    >
                      {dayOfWeek}
                    </button>
                  ))}
                </div>

                {/* Active followers graph rows */}
                {instagramData.followers.hours.map((hourLabel, hourIndex) => (
                  <BarRow
                    key={hourLabel}
                    label={hourLabel}
                    value={instagramData.followers.active_times[selectedDay][hourIndex]}
                    maxValue={maxActiveFollowers}
                    barColor={THEME_COLORS.primary}
                  />
                ))}

                <div style={styles.legendContainer}>
                  <div style={styles.legendItem}>
                    <div style={{ ...styles.legendDot, background: THEME_COLORS.primary }} />
                    Followers
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Technical Instagram API note */}
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
      </main>
    </div>
  );
}

const styles = {
  dashboardWrapper: {
    minHeight: "100vh",
    background: THEME_COLORS.background,
    color: THEME_COLORS.textPrimary,
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    padding: "0 0 60px",
  },
  header: {
    borderBottom: `1px solid ${THEME_COLORS.borderMuted}`,
    padding: "20px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    background: THEME_COLORS.background,
    zIndex: 100,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: THEME_COLORS.primaryGradient,
  },
  headerTitle: {
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  headerRight: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  timeframeButton: {
    background: THEME_COLORS.controlBackground,
    border: `1px solid ${THEME_COLORS.cardBorder}`,
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    color: THEME_COLORS.textMuted,
    cursor: "pointer",
  },
  exportButton: {
    background: THEME_COLORS.primaryGradient,
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: THEME_COLORS.textPrimary,
    cursor: "pointer",
  },
  mainContent: {
    padding: "32px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  summaryStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 28,
  },
  summaryCard: {
    background: THEME_COLORS.cardBackground,
    border: `1px solid ${THEME_COLORS.cardBorder}`,
    borderRadius: 12,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME_COLORS.noteText,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: -1,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 16,
    color: THEME_COLORS.textPrimary,
  },
  rowMargin: {
    marginBottom: 16,
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 32,
  },
  statDetailList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 16,
  },
  statDetailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  boldText: {
    fontWeight: 700,
  },
  stackedBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    background: THEME_COLORS.barBackground,
    marginBottom: 16,
  },
  dividerTop: {
    borderTop: `1px solid ${THEME_COLORS.barBackground}`,
    paddingTop: 14,
  },
  whiteBoldText: {
    fontWeight: 700,
    color: THEME_COLORS.textPrimary,
  },
  columnSubtitle: {
    fontSize: 14,
    fontWeight: 600,
    color: THEME_COLORS.textSecondary,
    marginBottom: 14,
  },
  buttonTabContainer: {
    display: "flex",
    gap: 8,
    marginBottom: 18,
  },
  tabButton: {
    padding: "6px 14px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  dayButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    transition: "all 0.2s",
  },
  legendContainer: {
    display: "flex",
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: THEME_COLORS.textMuted,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  horizontalThumbList: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  splitGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: 16,
  },
  footerNote: {
    marginTop: 24,
    padding: "16px 20px",
    background: THEME_COLORS.noteBackground,
    border: `1px solid ${THEME_COLORS.noteBorder}`,
    borderRadius: 12,
    fontSize: 12,
    color: THEME_COLORS.noteText,
    lineHeight: 1.7,
  },
  apiNotesHeader: {
    color: THEME_COLORS.primary,
    fontWeight: 700,
  },
  codeSnippet: {
    color: THEME_COLORS.textMuted,
  },
};
