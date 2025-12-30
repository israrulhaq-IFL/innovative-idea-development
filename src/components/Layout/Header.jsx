import React from "react";
import { useSharePoint } from "../../context/SharePointContext";
import { useTheme } from "../../context/ThemeContext";
import styles from "./Header.module.css";

const Header = ({ onMenuClick, onThemeToggle, currentTheme }) => {
  const { user, permissions } = useSharePoint();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className={styles.title}>ITG Dashboard</h1>
      </div>

      <div className={styles.right}>
        <button
          className={styles.themeBtn}
          onClick={onThemeToggle}
          aria-label={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
        >
          {currentTheme === "light" ? "🌙" : "☀️"}
        </button>

        {user && (
          <div className={styles.userMenu}>
            <div className={styles.userAvatar}>
              {user.Title ? user.Title.charAt(0).toUpperCase() : "U"}
            </div>
            <span className={styles.userName}>{user.Title}</span>
          </div>
        )}

        {permissions && permissions.isManagement && (
          <span className={styles.adminBadge}>Admin</span>
        )}
      </div>
    </header>
  );
};

export default Header;
