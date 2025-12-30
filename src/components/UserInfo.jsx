import React, { useState } from "react";
import styles from "./UserInfo.module.css";

const UserInfo = ({ user, permissions }) => {
  const [showPermissions, setShowPermissions] = useState(false);
  const deptLabels = {
    infra: "DCI",
    erp: "ERP",
    ops: "Operations",
    network: "Networks",
  };

  const categoryLabel = (() => {
    switch (permissions.userCategory) {
      case "hod":
        return "HOD";
      case "manager":
        return permissions.canEdit ? "Manager" : "Manager (View)";
      case "team_member":
        return "Team Member";
      default:
        return null; // Don't show "Limited Access"
    }
  })();

  const viewDepts = (permissions.allowedDepartments || []).map(
    (d) => deptLabels[d] || d,
  );
  const editDepts = (permissions.canEditDepartments || []).map(
    (d) => deptLabels[d] || d,
  );

  return (
    <div className={styles.userInfo}>
      <div
        className={`${styles.userAvatar} ${showPermissions ? styles.active : ""}`}
        onClick={() => setShowPermissions(!showPermissions)}
        style={{ cursor: "pointer" }}
      >
        {user.Title ? user.Title.charAt(0).toUpperCase() : "U"}
      </div>
      <div className={styles.userDetails}>
        <span className={styles.userName}>{user.Title || "Unknown User"}</span>
        <div className={styles.categoryAndPermissions}>
          {categoryLabel && (
            <span className={styles.userCategory}>{categoryLabel}</span>
          )}
          {showPermissions && (
            <div className={styles.permissions}>
              <span className={styles.permissionLabel}>View:</span>
              <span className={styles.permissionValue}>
                {viewDepts.length ? viewDepts.join(", ") : "None"}
              </span>
              <span className={styles.permissionLabel}>Edit:</span>
              <span className={styles.permissionValue}>
                {editDepts.length ? editDepts.join(", ") : "None"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
