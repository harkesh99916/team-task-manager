import mongoose from "mongoose";

import Project, { type ProjectDocument, type ProjectMember } from "@/models/Project";

export function isValidObjectId(value: string) {
  return mongoose.isValidObjectId(value);
}

export function getMemberRole(project: ProjectDocument, userId: string) {
  const member = project.members.find((entry) => entry.user.toString() === userId);
  return member?.role ?? null;
}

export function isProjectLeader(project: ProjectDocument, userId: string) {
  return getMemberRole(project, userId) === "leader";
}

export function isProjectMember(project: ProjectDocument, userId: string) {
  return project.members.some((entry) => entry.user.toString() === userId);
}

export async function getProjectForUser(projectId: string, userId: string) {
  if (!isValidObjectId(projectId)) {
    return null;
  }

  return Project.findOne({
    _id: projectId,
    "members.user": userId
  }) as Promise<ProjectDocument | null>;
}

export function countLeaders(members: ProjectMember[]) {
  return members.filter((member) => member.role === "leader").length;
}
