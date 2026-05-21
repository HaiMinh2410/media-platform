import { Card } from "./Card";
import { StatBlock } from "./StatBlock";
import { styles } from "../styles";

/**
 * ProfileCard component displaying profile visits and activity statistics.
 *
 * @param {Object} props
 * @param {Object} props.profileData - Profile metrics containing activity and visits numbers.
 */
export function ProfileCard({ profileData }) {
  return (
    <Card title="Profile">
      <StatBlock value={profileData.activity} label="Profile activity" />
      <div style={styles.dividerTop}>
        <div style={styles.statDetailRow}>
          <span>Profile visits</span>
          <span style={styles.whiteBoldText}>
            {profileData.visits.toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
}
