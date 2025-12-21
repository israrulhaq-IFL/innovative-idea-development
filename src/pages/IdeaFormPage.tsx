import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Send,
  ArrowLeft,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  CheckSquare,
  BarChart3,
  Upload,
  X,
  FileText,
  Image,
  File,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { ideaApi } from "../services/ideaApi";
import { logInfo, logError } from "../utils/logger";
import styles from "./IdeaFormPage.module.css";

interface Attachment {
  file: File;
  id: string;
  preview?: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  attachments: Attachment[];
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  attachments?: string;
}

const IdeaFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    priority: "Medium",
    attachments: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const categories = [
    { value: "Process Improvement", label: "Process Improvement" },
    { value: "Technology", label: "Technology" },
    { value: "Customer Experience", label: "Customer Experience" },
    { value: "Cost Reduction", label: "Cost Reduction" },
    { value: "Quality Enhancement", label: "Quality Enhancement" },
    { value: "Innovation", label: "Innovation" },
    { value: "Other", label: "Other" },
  ];

  const priorities = [
    { value: "Low", label: "Low - Nice to have" },
    { value: "Medium", label: "Medium - Should have" },
    { value: "High", label: "High - Must have" },
    { value: "Critical", label: "Critical - Urgent" },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    // Validate attachments (optional but check file size/type if present)
    if (formData.attachments.length > 0) {
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
      ];

      for (const attachment of formData.attachments) {
        if (attachment.file.size > maxFileSize) {
          newErrors.attachments = "Each file must be less than 10MB";
          break;
        }
        if (!allowedTypes.includes(attachment.file.type)) {
          newErrors.attachments = "Unsupported file type. Please use images, PDF, Word, Excel, or text files";
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const maxFiles = 5;
    const currentCount = formData.attachments.length;
    const remainingSlots = maxFiles - currentCount;

    if (files.length > remainingSlots) {
      setErrors({ attachments: `You can only upload up to ${maxFiles} files. You have ${remainingSlots} slots remaining.` });
      return;
    }

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));

    // Clear any attachment errors
    if (errors.attachments) {
      setErrors(prev => ({ ...prev, attachments: undefined }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeAttachment = (attachmentId: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => {
        if (att.id === attachmentId && att.preview) {
          URL.revokeObjectURL(att.preview);
        }
        return att.id !== attachmentId;
      })
    }));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      logError("Cannot submit idea: user not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      logInfo("Submitting new idea", {
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        attachmentCount: formData.attachments.length,
        userId: user.user.Id,
      });

      // Submit the idea with attachments
      const newIdea = await ideaApi.createIdea({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: "Pending Approval",
        attachments: formData.attachments.map(att => att.file),
      });

      logInfo("Idea submitted successfully", { ideaId: newIdea.id });

      // Clean up object URLs
      formData.attachments.forEach(att => {
        if (att.preview) {
          URL.revokeObjectURL(att.preview);
        }
      });

      setSubmitSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error) {
      logError("Failed to submit idea", error);
      setErrors({
        title: "Failed to submit idea. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.successContainer}
      >
        <div className={styles.successContent}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={styles.successIcon}
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className={styles.successTitle}>
            Innovation Launched! 🚀
          </h2>
          <p className={styles.successMessage}>
            Your groundbreaking idea has been successfully submitted and is now on its journey to transformation.
          </p>
          <div className={styles.successCard}>
            <p>What's next?</p>
            <p>
              Our approval team will review your idea within 2-3 business days. You'll receive updates through your dashboard.
            </p>
          </div>
          <p className={styles.redirectMessage}>
            Redirecting to dashboard in a moment...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={styles.container}
    >
      <div className={styles.content}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.header}
        >
          <button
            onClick={() => navigate("/")}
            className={styles.backButton}
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className={styles.heroSection}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={styles.heroIcon}
            >
              <Lightbulb className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className={styles.heroTitle}>
              Share Your Innovation
            </h1>
            <p className={styles.heroSubtitle}>
              Transform your ideas into reality. Every great innovation starts with a single spark of creativity.
            </p>
          </div>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.formContainer}
        >
          <div className={styles.formHeader}>
            <h2>Idea Submission Form</h2>
            <p>Fill in the details below to submit your innovative idea</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className={styles.formSection}
            >
              <label
                htmlFor="title"
                className={styles.formLabel}
              >
                Idea Title <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`${styles.formInput} ${errors.title ? styles.inputError : ''}`}
                  placeholder="Give your idea a compelling, memorable title..."
                  disabled={isSubmitting}
                />
                {formData.title && (
                  <div className={styles.charCounter}>
                    {formData.title.length}/100
                  </div>
                )}
              </div>
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorMessage}
                >
                  <AlertCircle size={18} />
                  {errors.title}
                </motion.p>
              )}
            </motion.div>

            {/* Category and Priority Row */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className={styles.formGrid}
            >
              <div className={styles.formSection}>
                <label
                  htmlFor="category"
                  className={styles.formLabel}
                >
                  Category <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputGroup}>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`${styles.formSelect} ${errors.category ? styles.inputError : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Choose a category...</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.errorMessage}
                  >
                    <AlertCircle size={18} />
                    {errors.category}
                  </motion.p>
                )}
              </div>

              <div className={styles.formSection}>
                <label
                  htmlFor="priority"
                  className={styles.formLabel}
                >
                  Priority Level <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputGroup}>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                    disabled={isSubmitting}
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Description Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className={styles.formSection}
            >
              <label
                htmlFor="description"
                className={styles.formLabel}
              >
                Detailed Description <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputGroup}>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={10}
                  className={`${styles.formTextarea} ${errors.description ? styles.inputError : ''}`}
                  placeholder="Describe your idea in detail. Consider including:

• What problem does this idea solve?
• How does it work technically?
• What are the expected benefits?
• Are there any potential challenges or risks?
• Who would be the primary users?"
                  disabled={isSubmitting}
                />
                <div className={styles.charCounter}>
                  {formData.description.length}/2000
                </div>
              </div>
              <div className={styles.formHelpRow}>
                <p className={styles.formHelp}>
                  Minimum 20 characters required
                </p>
                {errors.description && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.errorMessage}
                  >
                    <AlertCircle size={18} />
                    {errors.description}
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Attachments Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 }}
              className={styles.formSection}
            >
              <label className={styles.formLabel}>
                Attachments <span className={styles.optional}>(Optional)</span>
              </label>
              <div className={styles.inputGroup}>
                <div
                  className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <Upload size={32} className={styles.dropZoneIcon} />
                  <div className={styles.dropZoneText}>
                    <p className={styles.dropZoneTitle}>Drop files here or click to browse</p>
                    <p className={styles.dropZoneSubtitle}>
                      Support: Images, PDF, Word, Excel, Text files (Max 10MB each, up to 5 files)
                    </p>
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className={styles.fileInput}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Attachment Preview */}
                {formData.attachments.length > 0 && (
                  <div className={styles.attachmentsList}>
                    {formData.attachments.map((attachment) => {
                      const FileIcon = getFileIcon(attachment.file);
                      return (
                        <motion.div
                          key={attachment.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={styles.attachmentItem}
                        >
                          {attachment.preview ? (
                            <img
                              src={attachment.preview}
                              alt={attachment.file.name}
                              className={styles.attachmentPreview}
                            />
                          ) : (
                            <div className={styles.attachmentIcon}>
                              <FileIcon size={24} />
                            </div>
                          )}
                          <div className={styles.attachmentInfo}>
                            <p className={styles.attachmentName}>{attachment.file.name}</p>
                            <p className={styles.attachmentSize}>{formatFileSize(attachment.file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className={styles.removeAttachment}
                            disabled={isSubmitting}
                          >
                            <X size={16} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
              {errors.attachments && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorMessage}
                >
                  <AlertCircle size={18} />
                  {errors.attachments}
                </motion.p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className={styles.submitSection}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.spinner} />
                    <span>Submitting Your Innovation...</span>
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    <span>Launch My Idea</span>
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>

        {/* Process Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={styles.processInfo}
        >
          <div className={styles.processHeader}>
            <h3 className={styles.processTitle}>
              What Happens Next?
            </h3>
            <p className={styles.processSubtitle}>Your journey from idea to implementation</p>
          </div>
          <div className={styles.processGrid}>
            <div className={styles.processStep}>
              <div className={`${styles.stepIcon} ${styles.review}`}>
                <CheckSquare size={24} />
              </div>
              <h4 className={styles.stepTitle}>Review</h4>
              <p className={styles.stepDescription}>Your idea gets reviewed by our approval team within 2-3 business days</p>
            </div>
            <div className={styles.processStep}>
              <div className={`${styles.stepIcon} ${styles.implementation}`}>
                <Lightbulb size={24} />
              </div>
              <h4 className={styles.stepTitle}>Implementation</h4>
              <p className={styles.stepDescription}>Approved ideas become tasks and get assigned to implementation teams</p>
            </div>
            <div className={styles.processStep}>
              <div className={`${styles.stepIcon} ${styles.tracking}`}>
                <BarChart3 size={24} />
              </div>
              <h4 className={styles.stepTitle}>Tracking</h4>
              <p className={styles.stepDescription}>Track progress and provide feedback through your dashboard</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IdeaFormPage;
