import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useIdeaData } from '../contexts/DataContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBar from '../components/common/StatusBar';
import SearchableIdeaSelect from '../components/common/SearchableIdeaSelect';
import GenericFormPage from './GenericFormPage';
import styles from '../styles/pages/GenericFormPage.module.css';

interface IdeaOption {
  id: number;
  title: string;
  status: string;
  category: string;
  priority: string;
  created: string;
  createdBy: string;
}

const TaskCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const { data, loading, error } = useIdeaData();
  const [selectedIdea, setSelectedIdea] = useState<IdeaOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleIdeaSelect = (idea: IdeaOption) => {
    setSelectedIdea(idea);
  };

  const handleCreateTask = () => {
    if (selectedIdea) {
      navigate(`/idea/${selectedIdea.id}/task/new`);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  // Transform ideas from DataContext to IdeaOption format
  const transformedIdeas: IdeaOption[] = (data.ideas || []).map(idea => ({
    id: idea.id,
    title: idea.title,
    status: idea.status,
    category: idea.category || 'No Category',
    priority: idea.priority,
    created: idea.createdDate.toISOString(),
    createdBy: idea.createdBy,
  }));

  if (!isAdmin) {
    return null; // Will redirect
  }

  if (loading.ideas) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner size="lg" message="Loading ideas..." />
      </div>
    );
  }

  if (error.ideas) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <StatusBar status="error" message="Failed to load ideas. Please try again." />
        </div>
      </div>
    );
  }

  return (
    <GenericFormPage
      title="Create Task"
      subtitle="Select an idea to create a task for"
      onBack={handleBack}
      isLoading={isLoading}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.formContainer}
      >
        <div className={styles.formSection}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Select Idea <span className={styles.required}>*</span>
            </label>
            <SearchableIdeaSelect
              onIdeaSelect={handleIdeaSelect}
              placeholder="Search for an idea to create a task for..."
              className={styles.fieldInput}
              ideas={transformedIdeas}
            />
            {selectedIdea && (
              <div className={styles.selectedIdeaPreview}>
                <h4>{selectedIdea.title}</h4>
                <p>Status: {selectedIdea.status}</p>
                <p>Priority: {selectedIdea.priority}</p>
                <p>Submitted by: {selectedIdea.createdBy}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={handleBack}
            className={`${styles.actionButton} ${styles.secondary}`}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateTask}
            className={`${styles.actionButton} ${styles.primary}`}
            disabled={!selectedIdea || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </GenericFormPage>
  );
};

export default TaskCreationPage;