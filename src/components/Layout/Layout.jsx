import { Link, useLocation } from 'react-router-dom';
import { useSharePoint } from '../../context/SharePointContext';
import { useTheme } from '../../context/ThemeContext';
import UtilityBar from './UtilityBar';
import Sidebar from './Sidebar';
import Toast from '../Toast';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  const { loading, error } = useSharePoint();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Don't show full-screen error on dashboard - it handles its own error display
  const isDashboard = location.pathname === '/';

  if (loading && !isDashboard) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <h2>Loading ITG Dashboard...</h2>
        <p>Connecting to SharePoint and loading your data...</p>
      </div>
    );
  }

  if (error && !isDashboard) {
    return (
      <div className={styles.error}>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={styles.layout} data-theme={theme}>
      <UtilityBar />

      <div className={styles.main}>
        <Sidebar currentPath={location.pathname} />

        <main className={styles.content}>{children}</main>
      </div>

      <Toast />
    </div>
  );
};

export default Layout;
