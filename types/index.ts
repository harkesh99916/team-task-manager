export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedProject: string | null;
};

export type UserRole = "pending" | "admin" | "leader" | "member";
export type ProjectRole = "admin" | "leader" | "member";
export type TaskStatus = "To Do" | "In Progress" | "Done";

export type ProjectSummary = {
  _id: string;
  name: string;
  createdBy: string;
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    role: Exclude<ProjectRole, "admin">;
  }>;
  currentUserRole: ProjectRole;
  taskCount?: number;
};

export type TaskItem = {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  project: {
    _id: string;
    name: string;
  };
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  canEdit?: boolean;
  canDelete?: boolean;
};
