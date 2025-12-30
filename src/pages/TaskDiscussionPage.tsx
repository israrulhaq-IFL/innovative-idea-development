import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  useIdeaData,
  ProcessedTask,
  ProcessedIdea,
  ProcessedDiscussion,
} from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { logError } from "../utils/logger";

const TaskDiscussionPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data, loading, loadTasks, loadDiscussions } = useIdeaData();
  const { user, isAdmin, isApprover } = useUser();

  const [task, setTask] = useState<ProcessedTask | null>(null);
  const [idea, setIdea] = useState<ProcessedIdea | null>(null);
  const [discussions, setDiscussions] = useState<ProcessedDiscussion[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  useEffect(() => {
    const loadTaskDetails = async () => {
      if (!taskId) {
        setTaskError("Task ID is required");
        setTaskLoading(false);
        return;
      }

      try {
        setTaskLoading(true);
        setTaskError(null);

        // Load tasks and discussions if not already loaded
        if (data.tasks.length === 0) {
          await loadTasks();
        }
        if (data.discussions.length === 0) {
          await loadDiscussions();
        }

        // Find the task
        const foundTask = data.tasks.find((t) => t.id === parseInt(taskId));
        if (!foundTask) {
          setTaskError("Task not found");
          return;
        }

        setTask(foundTask);

        // Find associated idea (assuming task has ideaId)
        // For now, we'll look for ideas that might be related
        // In a real implementation, tasks would have an ideaId field
        const relatedIdea = data.ideas.find((i) =>
          i.title
            .toLowerCase()
            .includes(
              foundTask.title.toLowerCase().split(':')[1]?.trim() || '',
            ),
        );
        setIdea(relatedIdea || null);

        // Get discussions for this task
        const taskDiscussions = data.discussions.filter(
          (d) => d.taskId === foundTask.id,
        );
        setDiscussions(taskDiscussions);
      } catch (error) {
        logError("Failed to load task details", error);
        setTaskError("Failed to load task details");
      } finally {
        setTaskLoading(false);
      }
    };

    loadTaskDetails();
  }, [
    taskId,
    data.tasks,
    data.discussions,
    data.ideas,
    loadTasks,
    loadDiscussions,
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-600 bg-green-100";
      case "In Progress":
        return "text-blue-600 bg-blue-100";
      case "Not Started":
        return "text-gray-600 bg-gray-100";
      case "On Hold":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-red-600 bg-red-100";
      case "High":
        return "text-orange-600 bg-orange-100";
      case "Normal":
        return "text-yellow-600 bg-yellow-100";
      case "Low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (taskLoading || loading.tasks || loading.discussions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading task details..." />
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen p-6"
      >
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {taskError || "Task Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">
            The task you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {task.title}
                  </h2>
                  <p className="text-gray-600">{task.description}</p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}
                  >
                    {task.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Task Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Assigned to:{' '}
                    {task.assignedTo.length > 0
                      ? task.assignedTo.join(', ')
                      : "Unassigned"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Progress: {task.percentComplete}%
                  </span>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Due: {formatDate(task.dueDate)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Created: {formatDate(task.created)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{task.percentComplete}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.percentComplete}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>

            {/* Associated Idea */}
            {idea && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag size={20} className="text-blue-500" />
                  Related Idea
                </h3>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {idea.title}
                  </h4>
                  <p className="text-gray-600 mb-3">{idea.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Category: {idea.category}</span>
                    <span>•</span>
                    <span>Priority: {idea.priority}</span>
                    <span>•</span>
                    <span>Status: {idea.status}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                    <User size={14} />
                    <span>
                      Submitted by {idea.createdBy.name} on{' '}
                      {formatDate(idea.created)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Task History/Trail */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-blue-500" />
                Task History & Trail
              </h3>

              <div className="space-y-4">
                {/* Task Creation */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={16} className="text-blue-600" />
                    </div>
                    <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        Task Created
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(task.created)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Initial task created for idea review and implementation
                    </p>
                  </div>
                </div>

                {/* Status Changes - Mock data for now */}
                {task.status !== "Not Started" && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp size={16} className="text-green-600" />
                      </div>
                      <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          Status Updated
                        </span>
                        <span className="text-sm text-gray-500">
                          2 days ago
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Task status changed to "{task.status}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Approvals - Mock data for now */}
                {idea?.approvedBy && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-purple-600" />
                      </div>
                      <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          Idea Approved
                        </span>
                        <span className="text-sm text-gray-500">1 day ago</span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Approved by {idea.approvedBy.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Status */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        task.status === 'Completed'
                          ? 'bg-green-100'
                          : "bg-blue-100"
                      }`}
                    >
                      <Clock
                        size={16}
                        className={
                          task.status === 'Completed'
                            ? 'text-green-600'
                            : "text-blue-600"
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        Current Status
                      </span>
                      <span className="text-sm text-gray-500">Now</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Task is currently {task.status.toLowerCase()} with{' '}
                      {task.percentComplete}% completion
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Actions */}
            {(isAdmin || isApprover) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Task Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Update Status
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                    Assign Team Member
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                    Add Comment
                  </button>
                </div>
              </motion.div>
            )}

            {/* Discussions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" />
                Discussions ({discussions.length})
              </h3>

              {discussions.length === 0 ? (
                <p className="text-gray-500 text-sm">No discussions yet</p>
              ) : (
                <div className="space-y-3">
                  {discussions.slice(0, 3).map((discussion) => (
                    <div
                      key={discussion.id}
                      className="border-l-2 border-blue-200 pl-3"
                    >
                      <p className="text-sm text-gray-600 mb-1">
                        {discussion.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{discussion.author}</span>
                        <span>•</span>
                        <span>{formatDate(discussion.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                View All Discussions
              </button>
            </motion.div>

            {/* Task Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Task Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ID:</span>
                  <span className="ml-2 text-gray-600">#{task.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(task.created)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Last Modified:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(task.modified)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Priority:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskDiscussionPage;
