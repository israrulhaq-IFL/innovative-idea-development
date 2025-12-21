import React from "react";
import { Activity, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StatusBarProps {
  isLoading?: boolean;
  lastUpdated?: Date;
  status?: "online" | "offline" | "syncing" | "error";
  compact?: boolean;
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isLoading = false,
  lastUpdated,
  status = "online",
  compact = false,
  className = "",
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "online":
        return <CheckCircle size={14} />;
      case "offline":
        return <AlertTriangle size={14} />;
      case "syncing":
        return <Activity size={14} className="animate-pulse" />;
      case "error":
        return <AlertTriangle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Live";
      case "offline":
        return "Offline";
      case "syncing":
        return "Syncing";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "#10b981"; // green
      case "offline":
        return "#d13438"; // red
      case "syncing":
        return "#ffb900"; // yellow
      case "error":
        return "#d13438"; // red
      default:
        return "#666666"; // gray
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 text-xs font-medium ${className}`}
      >
        <div
          className="flex items-center gap-1"
          style={{ color: getStatusColor() }}
        >
          {getStatusIcon()}
          <span className="compact-status-text">{getStatusText()}</span>
        </div>
        {lastUpdated && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">
              {formatLastUpdated(lastUpdated)}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 font-medium"
          style={{ color: getStatusColor() }}
        >
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        {lastUpdated && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 text-sm">
              Updated {formatLastUpdated(lastUpdated)}
            </span>
          </>
        )}
      </div>
      {isLoading && (
        <div className="flex items-center gap-1 text-blue-600">
          <Activity size={14} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default StatusBar;
