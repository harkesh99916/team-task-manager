import { errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { isValidObjectId } from "@/lib/project-access";
import Project, { type ProjectDocument } from "@/models/Project";
import User from "@/models/User";
import type { UserRole } from "@/types";

export type AuthorizedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedProject: string | null;
};

type AuthResult =
  | {
      user: AuthorizedUser;
      response?: never;
    }
  | {
      user?: never;
      response: Response;
    };

type ProjectAccessResult =
  | {
      project: ProjectDocument;
      response?: never;
    }
  | {
      project?: never;
      response: Response;
    };

export async function requireAuth(): Promise<AuthResult> {
  const sessionUser = await getAuthenticatedUser();

  if (!sessionUser) {
    return { response: errorResponse("Unauthorized", 401) };
  }

  await connectToDatabase();

  const user = await User.findById(sessionUser.id).select("_id name email role assignedProject").lean();

  if (!user) {
    return { response: errorResponse("User not found.", 404) };
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: (user.role ?? "pending") as UserRole,
      assignedProject: user.assignedProject ? user.assignedProject.toString() : null
    }
  };
}

export function requireAdmin(user: AuthorizedUser) {
  if (user.role !== "admin") {
    return errorResponse("Forbidden", 403);
  }

  return null;
}

export function requireLeader(user: AuthorizedUser) {
  if (user.role !== "leader") {
    return errorResponse("Forbidden", 403);
  }

  return null;
}

export async function checkProjectAccess(
  user: AuthorizedUser,
  projectId: string,
  options?: {
    allowAdmin?: boolean;
    allowLeader?: boolean;
    allowMember?: boolean;
  }
): Promise<ProjectAccessResult> {
  const resolvedOptions = {
    allowAdmin: true,
    allowLeader: true,
    allowMember: false,
    ...options
  };

  if (!isValidObjectId(projectId)) {
    return { response: errorResponse("Invalid project id.", 422) };
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return { response: errorResponse("Project not found.", 404) };
  }

  if (user.role === "admin") {
    if (!resolvedOptions.allowAdmin) {
      return { response: errorResponse("Forbidden", 403) };
    }

    return { project };
  }

  if (user.role === "pending") {
    return { response: errorResponse("Forbidden", 403) };
  }

  if (!user.assignedProject || user.assignedProject !== projectId) {
    return { response: errorResponse("Forbidden", 403) };
  }

  const projectMember = project.members.find((member) => member.user.toString() === user.id);

  if (!projectMember) {
    return { response: errorResponse("Forbidden", 403) };
  }

  if (user.role === "leader" && !resolvedOptions.allowLeader) {
    return { response: errorResponse("Forbidden", 403) };
  }

  if (user.role === "member" && !resolvedOptions.allowMember) {
    return { response: errorResponse("Forbidden", 403) };
  }

  return { project };
}
