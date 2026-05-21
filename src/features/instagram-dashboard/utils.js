export const THEME_COLORS = {
  primaryGradient: "linear-gradient(135deg, #e91e8c, #9b27d4)",
  primary: "#e91e8c",
  secondary: "#9b27d4",
  background: "#0a0a0a",
  cardBackground: "#111",
  cardBorder: "#222",
  barBackground: "#1e1e1e",
  textMuted: "#888",
  textSecondary: "#ccc",
  textPrimary: "#fff",
  statLabel: "#666",
  borderMuted: "#1a1a1a",
  controlBackground: "#161616",
  noteBackground: "#0f0f0f",
  noteBorder: "#1e1e1e",
  noteText: "#555",
};

export const GRADIENTS = [
  "linear-gradient(135deg, #e91e8c, #9b27d4)",
  "linear-gradient(135deg, #c2185b, #7b1fa2)",
  "linear-gradient(135deg, #ad1457, #6a1b9a)",
  "linear-gradient(135deg, #880e4f, #4a148c)",
  "linear-gradient(135deg, #f06292, #ce93d8)",
];

export const INSTAGRAM_MOCK_DATA = {
  views: {
    total: 698739,
    followers_pct: 16.8,
    nonfollowers_pct: 83.2,
    accounts_reached: 240866,
    by_content: {
      all: { posts: 80.1, reels: 15.3, stories: 4.7 },
      followers: { posts: 72.4, reels: 21.1, stories: 6.5 },
      nonfollowers: { posts: 83.6, reels: 13.2, stories: 3.2 },
    },
  },
  interactions: {
    total: 36476,
    followers_pct: 28.9,
    nonfollowers_pct: 71.1,
    accounts_engaged: 21493,
    by_content: { posts: 93.5, reels: 6.4, stories: 0.2 },
  },
  profile: {
    activity: 33881,
    visits: 33881,
  },
  followers: {
    total: 28568,
    active_times: {
      Su: [5726, 6073, 6396, 4433, 2455, 4061, 5230, 5796],
      M: [4200, 5100, 5800, 3900, 2100, 3700, 4800, 5200],
      Tu: [4500, 5400, 6100, 4200, 2300, 3900, 5100, 5500],
      W: [4800, 5700, 6300, 4500, 2600, 4200, 5400, 5800],
      Th: [4600, 5500, 6000, 4300, 2400, 4000, 5200, 5600],
      F: [5000, 5900, 6200, 4600, 2700, 4400, 5600, 6000],
      Sa: [5400, 6000, 6350, 4400, 2500, 4100, 5300, 5700],
    },
    hours: ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"],
  },
  top_views: [
    { date: "Mar 7", views: "92K", color: "#e91e8c" },
    { date: "Feb 23", views: "64.3K", color: "#e91e8c" },
    { date: "Mar 14", views: "57.6K", color: "#e91e8c" },
    { date: "Mar 18", views: "54.6K", color: "#e91e8c" },
    { date: "May 6", views: "20.4K", color: "#e91e8c" },
  ],
  top_interactions: [
    { date: "Feb 23", count: "4.8K" },
    { date: "Mar 18", count: "3.6K" },
    { date: "May 6", count: "3.2K" },
    { date: "Mar 7", count: "2.9K" },
    { date: "Mar 14", count: "1.8K" },
  ],
};

/**
 * Format a number into a shorter readable string (e.g., 698739 -> 698.7K)
 * @param {number} value The number to format
 * @returns {string} The formatted string
 */
export function formatMetricNumber(value) {
  if (typeof value !== "number") return value;
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(1) + "K";
  return value.toLocaleString();
}
