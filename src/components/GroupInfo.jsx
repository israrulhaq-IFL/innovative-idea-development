import React from "react";
import { useSharePoint } from "../context/SharePointContext";
import styles from "./GroupInfo.module.css";

const GroupInfo = () => {
  const { siteGroups, userGroups, loading } = useSharePoint();

  if (loading) {
    return <div className={styles.loading}>Loading group information...</div>;
  }

  return (
    <div className={styles.groupInfo}>
      <h2>SharePoint Site Groups</h2>

      <div className={styles.section}>
        <h3>All Site Groups ({siteGroups.length})</h3>
        <div className={styles.groupList}>
          {siteGroups.map((group) => (
            <div key={group.Id} className={styles.groupCard}>
              <h4>{group.Title}</h4>
              <p>
                <strong>ID:</strong> {group.Id}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {group.Description || "No description"}
              </p>
              <p>
                <strong>Owner:</strong> {group.OwnerTitle}
              </p>
              <p>
                <strong>Login Name:</strong> {group.LoginName}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Current User Group Memberships ({userGroups.length})</h3>
        <div className={styles.groupList}>
          {userGroups.map((group) => (
            <div key={group.Id} className={styles.userGroupCard}>
              <h4>{group.Title}</h4>
              <p>
                <strong>ID:</strong> {group.Id}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {group.Description || "No description"}
              </p>
              <p>
                <strong>Owner:</strong> {group.OwnerTitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupInfo;
