import { useState } from "react";
import { INSTAGRAM_MOCK_DATA, THEME_COLORS, formatMetricNumber } from "../utils";

/**
 * Custom Hook for managing the Instagram Dashboard state and data transformations.
 * Separates complex state logic from the UI components.
 */
export function useInstagramDashboard() {
  const [activeViewTab, setActiveViewTab] = useState("all");
  const [selectedDay, setSelectedDay] = useState("Su");

  // Transform view data based on the active tab
  const contentData = INSTAGRAM_MOCK_DATA.views.by_content[activeViewTab];

  // Find the maximum active followers for the selected day to calculate bar percentages
  const maxActiveFollowers = Math.max(
    ...INSTAGRAM_MOCK_DATA.followers.active_times[selectedDay]
  );

  // Generate metrics summary list
  const summaryMetrics = [
    {
      label: "Total Views",
      value: formatMetricNumber(INSTAGRAM_MOCK_DATA.views.total),
      accent: THEME_COLORS.primary,
    },
    {
      label: "Interactions",
      value: formatMetricNumber(INSTAGRAM_MOCK_DATA.interactions.total),
      accent: THEME_COLORS.secondary,
    },
    {
      label: "Accounts Reached",
      value: formatMetricNumber(INSTAGRAM_MOCK_DATA.views.accounts_reached),
      accent: THEME_COLORS.primary,
    },
    {
      label: "Total Followers",
      value: formatMetricNumber(INSTAGRAM_MOCK_DATA.followers.total),
      accent: THEME_COLORS.secondary,
    },
  ];

  return {
    activeViewTab,
    setActiveViewTab,
    selectedDay,
    setSelectedDay,
    contentData,
    maxActiveFollowers,
    summaryMetrics,
    instagramData: INSTAGRAM_MOCK_DATA,
  };
}
