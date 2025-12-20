import React from 'react';
import { useSharePoint } from '../context/SharePointContext';
import styles from './Toast.module.css';

const Toast = () => {
  const { toast, hideToast } = useSharePoint();

  if (!toast) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <span className={styles.message}>{toast.message}</span>
      <button
        className={styles.closeButton}
        onClick={hideToast}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;