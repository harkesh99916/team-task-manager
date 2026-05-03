import { z } from "zod";

import { sanitizeText } from "@/lib/utils";

const taskStatusSchema = z.enum(["To Do", "In Progress", "Done"]);

export const createTaskSchema = z.object({
  title: z.string().min(3, "Title is required").max(120).transform(sanitizeText),
  description: z
    .string()
    .max(800, "Description is too long")
    .transform((value) => sanitizeText(value ?? ""))
    .optional()
    .default(""),
  projectId: z.string().min(1, "Project is required"),
  assignedTo: z.string().min(1, "Assigned user is required"),
  dueDate: z.coerce.date(),
  status: taskStatusSchema.default("To Do")
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(3).max(120).transform(sanitizeText).optional(),
    description: z.string().max(800).transform(sanitizeText).optional(),
    status: taskStatusSchema.optional(),
    dueDate: z.coerce.date().optional(),
    assignedTo: z.string().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
