import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiBarChart2, FiTrendingUp, FiSettings, FiHome } from 'react-icons/fi';
import { useSharePoint } from '../../context/SharePointContext';
import styles from './Sidebar.module.css';

const Sidebar = ({ currentPath }) => {
  const { user, permissions } = useSharePoint();

  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: <FiBarChart2 />,
      permission: 'view'
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: <FiTrendingUp />,
      permission: 'view'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <FiSettings />,
      permission: 'admin'
    }
  ];

  const hasPermission = (requiredPermission) => {
    if (!permissions) return false;

    switch (requiredPermission) {
      case 'view':
        return true;
      case 'edit':
        return permissions.canEdit;
      case 'admin':
        return permissions.isManagement;
      case 'executive':
        return permissions.isExecutive || permissions.isManagement;
      default:
        return false;
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>
            <FiHome />
          </span>
        </div>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {menuItems
            .filter(item => hasPermission(item.permission))
            .map(item => (
              <li key={item.path} className={styles.navItem}>
                <Link
                  to={item.path}
                  className={`${styles.navLink} ${
                    currentPath === item.path ? styles.active : ''
                  }`}
                  title={item.label}
                >
                  <span className={styles.icon}>{item.icon}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      {user && (
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>
            {user.Title ? user.Title.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;