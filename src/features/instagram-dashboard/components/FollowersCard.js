import { Card } from "./Card";
import { StatBlock } from "./StatBlock";
import { BarRow } from "./BarRow";
import { THEME_COLORS } from "../utils";
import { styles } from "../styles";

/**
 * FollowersCard component showing total followers and active times graph
 * with interactive day selecting tabs.
 *
 * @param {Object} props
 * @param {Object} props.followersData - Followers specific metrics (total, active_times, hours).
 * @param {string} props.selectedDay - Currently active day filter (e.g. 'Su', 'M').
 * @param {Function} props.setSelectedDay - State setter to switch active day filter.
 * @param {number} props.maxActiveFollowers - Maximum active count used as limit for graph scales.
 */
export function FollowersCard({
  followersData,
  selectedDay,
  setSelectedDay,
  maxActiveFollowers,
}) {
  return (
    <Card title="Followers">
      <div style={styles.twoColumnGrid}>
        <div>
          <StatBlock value={followersData.total} label="Total followers" />
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
          {followersData.hours.map((hourLabel, hourIndex) => (
            <BarRow
              key={hourLabel}
              label={hourLabel}
              value={followersData.active_times[selectedDay][hourIndex]}
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
  );
}
