import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIdeaData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBar from '../components/common/StatusBar';

const MainDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, loadIdeas } = useIdeaData();
  const { user, isAdmin, isApprover, isContributor } = useUser();

  useEffect(() => {
    // Load ideas data when component mounts
    loadIdeas();
  }, [loadIdeas]);

  // Show all ideas for collective statistics
  const allIdeas = data.ideas;

  // Calculate collective statistics
  const stats = useMemo(() => {
    const totalIdeas = allIdeas.length;
    const pendingIdeas = allIdeas.filter(
      (idea) => idea.status === 'Pending Approval',
    ).length;
    const approvedIdeas = allIdeas.filter(
      (idea) => idea.status === 'Approved',
    ).length;
    const inProgressIdeas = allIdeas.filter(
      (idea) => idea.status === 'In Progress',
    ).length;
    const rejectedIdeas = allIdeas.filter(
      (idea) => idea.status === 'Rejected',
    ).length;

    return {
      totalIdeas,
      pendingIdeas,
      approvedIdeas,
      inProgressIdeas,
      rejectedIdeas,
    };
  }, [allIdeas]);

  // Get dashboard title - this is the general dashboard
  const getDashboardTitle = () => {
    return 'Innovation Dashboard';
  };

  // Get dashboard description - collective overview
  const getDashboardDescription = () => {
    return 'Comprehensive overview of all innovation activities and progress.';
  };

  const handleIdeaClick = (idea: ProcessedIdea) => {
    navigate(`/idea/${idea.id}`);
  };

  if (loading.ideas) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error.ideas) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <StatusBar status="error" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getDashboardTitle()}
          </h1>
          <p className="text-gray-600 text-lg">{getDashboardDescription()}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Ideas
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalIdeas}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pending Approval
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pendingIdeas}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Approved
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.approvedIdeas}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              In Progress
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.inProgressIdeas}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Rejected
            </h3>
            <p className="text-3xl font-bold text-red-600">
              {stats.rejectedIdeas}
            </p>
          </motion.div>
        </div>

        {/* Quick Actions & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/idea/new')}
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-medium text-gray-900">
                    Submit New Idea
                  </div>
                  <div className="text-sm text-gray-600">
                    Share your innovative ideas
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/my-ideas')}
                className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">📋</span>
                <div>
                  <div className="font-medium text-gray-900">View My Ideas</div>
                  <div className="text-sm text-gray-600">
                    Track your submitted ideas
                  </div>
                </div>
              </button>

              {isApprover && (
                <button
                  onClick={() => navigate('/approver')}
                  className="w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors flex items-center gap-3"
                >
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      Review Ideas
                    </div>
                    <div className="text-sm text-gray-600">
                      Approve or reject submissions
                    </div>
                  </div>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-3"
                >
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <div className="font-medium text-gray-900">Admin Panel</div>
                    <div className="text-sm text-gray-600">
                      Manage system settings
                    </div>
                  </div>
                </button>
              )}
            </div>
          </motion.div>

          {/* Recent Activity Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Activity Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      Innovation Rate
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.totalIdeas > 0
                        ? `${Math.round((stats.approvedIdeas / stats.totalIdeas) * 100)}% approval rate`
                        : "No ideas yet"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      Active Projects
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.inProgressIdeas} ideas currently in development
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      Pending Reviews
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.pendingIdeas} ideas awaiting approval
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MainDashboard;
