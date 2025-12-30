// Generic Form Page Template
// src/pages/GenericFormPage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { logInfo } from "../utils/logger";
import LoadingSpinner from "../components/common/LoadingSpinner";
import styles from "../styles/pages/GenericFormPage.module.css";

export interface FormControlPanelProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  backIcon?: string;
  children?: React.ReactNode;
}

export const FormControlPanel: React.FC<FormControlPanelProps> = ({
  title,
  onBack,
  backLabel = "Back",
  backIcon = "fa-arrow-left",
  children,
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    logInfo("[GenericFormPage] Back button clicked");
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={styles.formControlPanel} data-theme={theme}>
      <div className={styles.controlPanelContent}>
        <div className={styles.leftSection}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
            aria-label={backLabel}
          >
            <i className={`fas ${backIcon}`}></i>
            <span className={styles.backLabel}>{backLabel}</span>
          </button>
        </div>

        <div className={styles.centerSection}>
          <h1 className={styles.formTitle}>{title}</h1>
        </div>

        <div className={styles.rightSection}>{children}</div>
      </div>
    </div>
  );
};

export interface GenericFormPageProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  backIcon?: string;
  controlPanelChildren?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isSubmitting?: boolean;
  showControlPanel?: boolean;
}

const GenericFormPage: React.FC<GenericFormPageProps> = ({
  title,
  onBack,
  backLabel,
  backIcon,
  controlPanelChildren,
  children,
  className = "",
  isSubmitting = false,
  showControlPanel = true,
}) => {
  const { theme } = useTheme();

  return (
    <div className={`${showControlPanel ? styles.formPageLayout : styles.formPageLayoutNoPanel} ${className}`} data-theme={theme}>
      {showControlPanel && (
        <FormControlPanel
          title={title}
          onBack={onBack}
          backLabel={backLabel}
          backIcon={backIcon}
        >
          {controlPanelChildren}
        </FormControlPanel>
      )}

      <main className={showControlPanel ? styles.formMainContent : styles.formMainContentNoPanel}>
        <div className={styles.formContainer}>{children}</div>
      </main>

      {/* Loading overlay when submitting */}
      {isSubmitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <LoadingSpinner size="large" />
            <p className={styles.loadingText}>Submitting form...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericFormPage;
