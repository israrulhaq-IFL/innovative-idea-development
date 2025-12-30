import React from "react";
import { FiClock, FiRefreshCw } from "react-icons/fi";
import { useSharePoint } from "../../context/SharePointContext";
import styles from "./ReloadStatus.module.css";

const ReloadStatus = () => {
  const { lastReload, settings } = useSharePoint();

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatNextReload = (date) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / (1000 * 60));

    if (diffMins <= 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h`;
  };

  const getStatusText = () => {
    if (!lastReload.time) return "No reload yet";

    const timeStr = formatTime(lastReload.time);
    const typeStr = lastReload.type === "auto" ? "Auto" : "Manual";
    const nextStr =
      lastReload.nextAutoReload && settings.autoRefresh
        ? ` • Next: ${formatNextReload(lastReload.nextAutoReload)}`
        : "";

    return `${typeStr} ${timeStr}${nextStr}`;
  };

  return (
    <div className={styles.reloadStatus}>
      <div className={styles.icon}>
        {lastReload.type === "auto" ? (
          <FiRefreshCw className={styles.autoIcon} />
        ) : (
          <FiClock className={styles.manualIcon} />
        )}
      </div>
      <span className={styles.text}>{getStatusText()}</span>
    </div>
  );
};

export default ReloadStatus;
