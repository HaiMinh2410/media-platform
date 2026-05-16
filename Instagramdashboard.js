import { useState } from "react";

const data = {
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

const gradients = [
  "linear-gradient(135deg, #e91e8c, #9b27d4)",
  "linear-gradient(135deg, #c2185b, #7b1fa2)",
  "linear-gradient(135deg, #ad1457, #6a1b9a)",
  "linear-gradient(135deg, #880e4f, #4a148c)",
  "linear-gradient(135deg, #f06292, #ce93d8)",
];

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function BarRow({ label, value, max, color = "#e91e8c" }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <div style={{ width: 32, color: "#888", fontSize: 12, textAlign: "right", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: "#1e1e1e", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: color,
            borderRadius: 4,
            transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <div style={{ width: 40, color: "#ccc", fontSize: 12, textAlign: "right", flexShrink: 0 }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function ContentBar({ label, pct, color = "#e91e8c" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div style={{ width: 48, color: "#888", fontSize: 13, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 10, background: "#1e1e1e", borderRadius: 5, overflow: "hidden" }}>
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            borderRadius: 5,
          }}
        />
      </div>
      <div style={{ width: 44, color: "#fff", fontSize: 13, textAlign: "right", fontWeight: 600 }}>{pct}%</div>
    </div>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #222",
        borderRadius: 16,
        padding: "24px",
        ...style,
      }}
    >
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
            {title}
          </span>
          <span style={{ fontSize: 14, color: "#555" }}>ⓘ</span>
        </div>
      )}
      {children}
    </div>
  );
}

function StatBlock({ value, label, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: -1, fontFamily: "'DM Sans', sans-serif" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {label && <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{label}</div>}
      {sub && <div style={{ marginTop: 12 }}>{sub}</div>}
    </div>
  );
}

function PostThumb({ date, metric, gradient, small }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: small ? 90 : 120,
          height: small ? 90 : 120,
          borderRadius: 14,
          background: gradient || gradients[0],
          display: "flex",
          alignItems: "flex-end",
          padding: 8,
          marginBottom: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))",
          }}
        />
        <div
          style={{
            position: "relative",
            background: "rgba(0,0,0,0.6)",
            borderRadius: 20,
            padding: "3px 8px",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {metric}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#888" }}>{date}</div>
    </div>
  );
}

export default function InstagramDashboard() {
  const [viewTab, setViewTab] = useState("all");
  const [activeDay, setActiveDay] = useState("Su");

  const contentData = data.views.by_content[viewTab];
  const maxActive = Math.max(...data.followers.active_times[activeDay]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        padding: "0 0 60px",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1a1a1a",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "#0a0a0a",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #e91e8c, #9b27d4)",
            }}
          />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>Professional Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              background: "#161616",
              border: "1px solid #222",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              color: "#888",
              cursor: "pointer",
            }}
          >
            Last 90 days ▾
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #e91e8c, #9b27d4)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Export
          </div>
        </div>
      </div>

      <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Summary Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Total Views", value: fmt(data.views.total), accent: "#e91e8c" },
            { label: "Interactions", value: fmt(data.interactions.total), accent: "#9b27d4" },
            { label: "Accounts Reached", value: fmt(data.views.accounts_reached), accent: "#e91e8c" },
            { label: "Total Followers", value: fmt(data.followers.total), accent: "#9b27d4" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: 12,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: s.accent,
                  letterSpacing: -1,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Account Insights */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: "#fff" }}>Account insights</div>
        </div>

        {/* Views */}
        <Card title="Views" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* Left */}
            <div>
              <StatBlock value={data.views.total} label="Views" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#aaa" }}>
                  <span>Followers</span>
                  <span style={{ fontWeight: 700, color: "#e91e8c" }}>{data.views.followers_pct}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#aaa" }}>
                  <span>Non-followers</span>
                  <span style={{ fontWeight: 700, color: "#9b27d4" }}>{data.views.nonfollowers_pct}%</span>
                </div>
              </div>
              {/* Stacked bar */}
              <div style={{ height: 8, borderRadius: 4, overflow: "hidden", background: "#1e1e1e", marginBottom: 16 }}>
                <div
                  style={{
                    width: data.views.followers_pct + "%",
                    height: "100%",
                    background: "#e91e8c",
                    float: "left",
                  }}
                />
                <div
                  style={{
                    width: data.views.nonfollowers_pct + "%",
                    height: "100%",
                    background: "#9b27d4",
                    float: "left",
                  }}
                />
              </div>
              <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#aaa" }}>
                  <span style={{ color: "#e91e8c", fontWeight: 600 }}>Accounts reached</span>
                  <span style={{ fontWeight: 700, color: "#fff" }}>{data.views.accounts_reached.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {/* Right */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#ccc", marginBottom: 14 }}>By content type</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {["all", "followers", "nonfollowers"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setViewTab(t)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      background: viewTab === t ? "#e91e8c" : "#1e1e1e",
                      color: viewTab === t ? "#fff" : "#888",
                      transition: "all 0.2s",
                    }}
                  >
                    {t === "all" ? "All" : t === "followers" ? "Followers" : "Non-followers"}
                  </button>
                ))}
              </div>
              <ContentBar label="Posts" pct={contentData.posts} color="#e91e8c" />
              <ContentBar label="Reels" pct={contentData.reels} color="#9b27d4" />
              <ContentBar label="Stories" pct={contentData.stories} color="#e91e8c" />
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e91e8c" }} />
                  Followers
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9b27d4" }} />
                  Non-followers
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Top content - views */}
        <Card title="Top content based on views" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {data.top_views.map((p, i) => (
              <PostThumb key={i} date={p.date} metric={p.views} gradient={gradients[i % gradients.length]} />
            ))}
          </div>
        </Card>

        {/* Interactions */}
        <Card title="Interactions" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              <StatBlock value={data.interactions.total} label="Interactions" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#aaa" }}>
                  <span>Followers</span>
                  <span style={{ fontWeight: 700, color: "#e91e8c" }}>{data.interactions.followers_pct}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#aaa" }}>
                  <span>Non-followers</span>
                  <span style={{ fontWeight: 700, color: "#9b27d4" }}>{data.interactions.nonfollowers_pct}%</span>
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 4, overflow: "hidden", background: "#1e1e1e", marginBottom: 16 }}>
                <div style={{ width: data.interactions.followers_pct + "%", height: "100%", background: "#e91e8c", float: "left" }} />
                <div style={{ width: data.interactions.nonfollowers_pct + "%", height: "100%", background: "#9b27d4", float: "left" }} />
              </div>
              <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#aaa" }}>
                  <span style={{ color: "#e91e8c", fontWeight: 600 }}>Accounts engaged</span>
                  <span style={{ fontWeight: 700, color: "#fff" }}>{data.interactions.accounts_engaged.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#ccc", marginBottom: 14 }}>By content interactions</div>
              <ContentBar label="Posts" pct={data.interactions.by_content.posts} color="#e91e8c" />
              <ContentBar label="Reels" pct={data.interactions.by_content.reels} color="#9b27d4" />
              <ContentBar label="Stories" pct={data.interactions.by_content.stories} color="#e91e8c" />
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888", marginTop: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e91e8c" }} />
                Followers and non-followers
              </div>
            </div>
          </div>
        </Card>

        {/* Top content - interactions */}
        <Card title="Top content based on interactions" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {data.top_interactions.map((p, i) => (
              <PostThumb key={i} date={p.date} metric={p.count} gradient={gradients[(i + 2) % gradients.length]} />
            ))}
          </div>
        </Card>

        {/* Profile + Followers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
          {/* Profile */}
          <Card title="Profile">
            <StatBlock value={data.profile.activity} label="Profile activity" />
            <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#aaa" }}>
                <span>Profile visits</span>
                <span style={{ fontWeight: 700, color: "#fff" }}>{data.profile.visits.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Followers */}
          <Card title="Followers">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <StatBlock value={data.followers.total} label="Total followers" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#ccc", marginBottom: 14 }}>Most active times</div>
                {/* Day selector */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {["M", "Tu", "W", "Th", "F", "Sa", "Su"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setActiveDay(d)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        background: activeDay === d ? "#e91e8c" : "#1e1e1e",
                        color: activeDay === d ? "#fff" : "#888",
                        transition: "all 0.2s",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {data.followers.hours.map((h, i) => (
                  <BarRow
                    key={h}
                    label={h}
                    value={data.followers.active_times[activeDay][i]}
                    max={maxActive}
                    color="#e91e8c"
                  />
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888", marginTop: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e91e8c" }} />
                  Followers
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* API Note */}
        <div
          style={{
            marginTop: 24,
            padding: "16px 20px",
            background: "#0f0f0f",
            border: "1px solid #1e1e1e",
            borderRadius: 12,
            fontSize: 12,
            color: "#555",
            lineHeight: 1.7,
          }}
        >
          <span style={{ color: "#e91e8c", fontWeight: 700 }}>API Notes: </span>
          Data fetched via Instagram Graph API — metrics include{" "}
          <code style={{ color: "#888" }}>views</code>,{" "}
          <code style={{ color: "#888" }}>reach</code>,{" "}
          <code style={{ color: "#888" }}>total_interactions</code>,{" "}
          <code style={{ color: "#888" }}>accounts_engaged</code>,{" "}
          <code style={{ color: "#888" }}>online_followers</code>,{" "}
          <code style={{ color: "#888" }}>follower_demographics</code>. Requires permissions:{" "}
          <code style={{ color: "#888" }}>instagram_manage_insights</code>,{" "}
          <code style={{ color: "#888" }}>instagram_basic</code>. Data may be delayed up to 48 hours.
        </div>
      </div>
    </div>
  );
}