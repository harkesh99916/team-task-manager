import "dotenv/config";
import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectToDatabase } from "../lib/db";
import Project from "../models/Project";
import Task from "../models/Task";
import User from "../models/User";

if (!process.env.MONGODB_URI) {
  loadEnvConfig(process.cwd());
}

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI. Add it to .env for scripts, or .env.local for the Next.js app."
  );
}

async function seed() {
  await connectToDatabase();

  const password = await bcrypt.hash("Password123!", 12);

  const users = await Promise.all(
    [
      {
        name: "Admin",
        email: "admin@gmail.com"
      },
      {
        name: "Member 1",
        email: "member1@gmail.com"
      },
      {
        name: "Leader 1",
        email: "leader1@gmail.com"
      }
    ].map(async (user) =>
      User.findOneAndUpdate(
        { email: user.email },
        {
          ...user,
          password
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    )
  );

  const [adminUser, memberUser, productUser] = users;

  const project = await Project.findOneAndUpdate(
    { name: "Demo Delivery Workspace" },
    {
      name: "Demo Delivery Workspace",
      createdBy: adminUser._id,
      members: [
        { user: productUser._id, role: "leader" },
        { user: memberUser._id, role: "member" },
      ]
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Promise.all([
    User.findByIdAndUpdate(adminUser._id, {
      role: "admin",
      assignedProject: null
    }),
    User.findByIdAndUpdate(productUser._id, {
      role: "leader",
      assignedProject: project._id
    }),
    User.findByIdAndUpdate(memberUser._id, {
      role: "member",
      assignedProject: project._id
    })
  ]);

  const tasks = [
    {
      title: "Finalize onboarding flow",
      description: "Review copy, tighten validation, and prepare the onboarding checklist.",
      project: project._id,
      assignedTo: memberUser._id,
      status: "In Progress" as const,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
    },
    {
      title: "Prepare sprint review notes",
      description: "Summarize blockers, completed work, and carry-over tasks for leadership.",
      project: project._id,
      assignedTo: memberUser._id,
      status: "To Do" as const,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)
    },
    {
      title: "Resolve overdue QA findings",
      description: "Triage open issues from regression testing and update implementation owners.",
      project: project._id,
      assignedTo: memberUser._id,
      status: "To Do" as const,
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24)
    }
  ];

  for (const task of tasks) {
    await Task.findOneAndUpdate(
      {
        title: task.title,
        project: task.project
      },
      task,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log("Seed complete.");
  console.log("Users:");
  console.log("- admin@gmail.com / Password123!");
  console.log("- leader1@gmail.com / Password123!");
  console.log("- member1@gmail.com / Password123!");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
