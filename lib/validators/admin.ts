import { z } from "zod";

export const updateUserAssignmentSchema = z
  .object({
    userId: z.string().min(1, "User is required"),
    role: z.enum(["pending", "admin", "leader", "member"]),
    projectId: z.string().nullable().optional()
  })
  .superRefine((value, ctx) => {
    if ((value.role === "leader" || value.role === "member") && !value.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A project is required for leaders and members.",
        path: ["projectId"]
      });
    }
  });
