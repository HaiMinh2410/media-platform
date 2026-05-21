import { useInstagramDashboard } from "./hooks/useInstagramDashboard";
import { Card } from "./components/Card";
import { PostThumb } from "./components/PostThumb";
import { GRADIENTS } from "./utils";
import { styles } from "./styles";
import { DashboardHeader } from "./components/DashboardHeader";
import { SummaryMetricsList } from "./components/SummaryMetricsList";
import { ViewsCard } from "./components/ViewsCard";
import { InteractionsCard } from "./components/InteractionsCard";
import { ProfileCard } from "./components/ProfileCard";
import { FollowersCard } from "./components/FollowersCard";
import { FooterNote } from "./components/FooterNote";

/**
 * Main Professional Instagram Dashboard component.
 * Integrates sub-components, helper functions and states using the custom hook.
 * Fully refactored for maintainability and Clean Code.
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
      <DashboardHeader />

      {/* Main dashboard content */}
      <main style={styles.mainContent}>
        {/* Summary metrics strip */}
        <SummaryMetricsList summaryMetrics={summaryMetrics} />

        {/* Section title */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Account insights</h2>
        </div>

        {/* Views Breakdown Card */}
        <ViewsCard
          viewsData={instagramData.views}
          activeViewTab={activeViewTab}
          setActiveViewTab={setActiveViewTab}
          contentData={contentData}
        />

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
        <InteractionsCard interactionsData={instagramData.interactions} />

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
          {/* Profile Activity */}
          <ProfileCard profileData={instagramData.profile} />

          {/* Followers Activity Graph */}
          <FollowersCard
            followersData={instagramData.followers}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            maxActiveFollowers={maxActiveFollowers}
          />
        </div>

        {/* Bottom Technical Instagram API note */}
        <FooterNote />
      </main>
    </div>
  );
}
