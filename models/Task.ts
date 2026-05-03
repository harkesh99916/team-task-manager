import mongoose, { type InferSchemaType, type Model } from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do"
    },
    dueDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ project: 1, assignedTo: 1, status: 1, dueDate: 1 });

export type TaskDocument = mongoose.HydratedDocument<InferSchemaType<typeof taskSchema>>;

const Task = (mongoose.models.Task as Model<InferSchemaType<typeof taskSchema>>) ||
  mongoose.model("Task", taskSchema);

export default Task;
