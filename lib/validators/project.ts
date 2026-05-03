import { z } from "zod";

import { sanitizeText } from "@/lib/utils";

export const createProjectSchema = z.object({
  name: z.string().min(3, "Project name is required").max(80).transform(sanitizeText)
});

export const addMemberSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  userId: z.string().min(1, "User is required"),
  role: z.enum(["leader", "member"])
});

export const removeMemberSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  userId: z.string().min(1, "User is required")
});

export const updateMemberRoleSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(["leader", "member"])
});
