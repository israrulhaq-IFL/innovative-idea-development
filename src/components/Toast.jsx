import React from "react";
import { useSharePoint } from "../context/SharePointContext";
import styles from "./Toast.module.css";

const Toast = () => {
  const { toast, hideToast } = useSharePoint();

  if (!toast) return null;

  const handleUndo = () => {
    if (toast.onUndo) {
      toast.onUndo();
    }
    hideToast();
  };

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <span className={styles.message}>{toast.message}</span>
      <div className={styles.actions}>
        {toast.onUndo && (
          <button
            className={styles.undoButton}
            onClick={handleUndo}
            aria-label="Undo action"
          >
            Undo
          </button>
        )}
        <button
          className={styles.closeButton}
          onClick={hideToast}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
