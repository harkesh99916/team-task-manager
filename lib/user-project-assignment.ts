import Project from "@/models/Project";
import User from "@/models/User";
import type { UserRole } from "@/types";

type AssignmentInput = {
  userId: string;
  role: UserRole;
  projectId?: string | null;
};

export async function syncUserProjectAssignment({
  userId,
  role,
  projectId
}: AssignmentInput) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  const normalizedProjectId = projectId || null;

  if ((role === "leader" || role === "member") && !normalizedProjectId) {
    throw new Error("A project must be assigned for leaders and members.");
  }

  let targetProject = null;

  if (normalizedProjectId) {
    targetProject = await Project.findById(normalizedProjectId);

    if (!targetProject) {
      throw new Error("Assigned project not found.");
    }

    if (
      role === "leader" &&
      targetProject.members.some(
        (member) => member.role === "leader" && member.user.toString() !== userId
      )
    ) {
      throw new Error("This project already has a leader assigned.");
    }
  }

  await Project.updateMany(
    { "members.user": user._id },
    { $pull: { members: { user: user._id } } }
  );

  if (targetProject && (role === "leader" || role === "member")) {
    const existingIndex = targetProject.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (existingIndex !== -1) {
      targetProject.members.splice(existingIndex, 1);
    }

    targetProject.members.push({
      user: user._id,
      role
    });
    await targetProject.save();
  }

  user.role = role;
  user.assignedProject = normalizedProjectId ? targetProject?._id ?? null : null;
  await user.save();

  return {
    user,
    project: targetProject
  };
}
