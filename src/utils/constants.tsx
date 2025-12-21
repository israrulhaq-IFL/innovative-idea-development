// Innovative Ideas Application Constants

// Chart color scheme - premium gradient-driven accent colors
export const ACCENT_COLORS = {
  primary: "#3D7FFF", // electric blue
  success: "#0CCE82", // modern emerald
  warning: "#FFB020", // amber
  insight: "#7B61FF", // royal purple
  activity: "#FF4F70", // neon coral
  neutral: "#64748B", // slate gray
};

// Auto-refresh configuration (enabled for 1-minute silent refresh)
export const autoRefreshEnabled = true;

// SharePoint list names
export const SHAREPOINT_LISTS = {
  IDEAS: "innovative_ideas",
  TASKS: "innovative_idea_tasks",
  DISCUSSIONS: "innovative_idea_discussions",
  APPROVERS: "innovative_idea_approvers",
};

// Sample data for testing (fallback if SharePoint fetch fails)
export const SAMPLE_IDEAS = [
  {
    id: 1,
    title: "Implement AI-powered code review system",
    description:
      "Develop an AI system that can automatically review code changes and suggest improvements.",
    status: "Pending" as const,
    createdBy: "John Doe",
    createdDate: new Date("2025-01-15"),
    category: "Technology",
    priority: "High" as const,
  },
  {
    id: 2,
    title: "Redesign employee onboarding process",
    description:
      "Create a more engaging and efficient onboarding experience for new employees.",
    status: "Approved" as const,
    createdBy: "Jane Smith",
    createdDate: new Date("2025-01-10"),
    approvedBy: "Manager",
    approvedDate: new Date("2025-01-12"),
    category: "HR",
    priority: "Medium" as const,
  },
  {
    id: 3,
    title: "Implement sustainable office practices",
    description: "Introduce eco-friendly initiatives in the workplace.",
    status: "In Progress" as const,
    createdBy: "Bob Johnson",
    createdDate: new Date("2025-01-05"),
    category: "Operations",
    priority: "Low" as const,
  },
];

export const SAMPLE_TASKS = [
  {
    id: 1,
    ideaId: 2,
    title: "Design new onboarding workflow",
    description:
      "Create wireframes and user flows for the new onboarding process.",
    status: "In Progress" as const,
    assignedTo: ["Alice Brown", "Charlie Wilson"],
    createdBy: "Jane Smith",
    createdDate: new Date("2025-01-13"),
    progress: 60,
  },
  {
    id: 2,
    ideaId: 2,
    title: "Develop onboarding application",
    description: "Build the web application for the new onboarding process.",
    status: "Not Started" as const,
    assignedTo: ["David Lee"],
    createdBy: "Jane Smith",
    createdDate: new Date("2025-01-13"),
    progress: 0,
  },
];

export const SAMPLE_APPROVERS = [
  {
    id: "1",
    name: "Sarah Manager",
    email: "sarah.manager@company.com",
    department: "Engineering",
  },
  {
    id: "2",
    name: "Mike Director",
    email: "mike.director@company.com",
    department: "Operations",
  },
  {
    id: "3",
    name: "Lisa VP",
    email: "lisa.vp@company.com",
    department: "Executive",
  },
];
