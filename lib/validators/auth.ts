import { z } from "zod";

import { sanitizeText } from "@/lib/utils";

export const signupSchema = z.object({
  name: z.string().min(2, "Name is required").max(60).transform(sanitizeText),
  email: z.string().email("Invalid email").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Password is required")
});

export const createUserByAdminSchema = z
  .object({
    name: z.string().min(2, "Name is required").max(60).transform(sanitizeText),
    email: z.string().email("Invalid email").transform((value) => value.trim().toLowerCase()),
    password: z.string().min(8, "Password must be at least 8 characters"),
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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters")
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from the current password.",
    path: ["newPassword"]
  });
