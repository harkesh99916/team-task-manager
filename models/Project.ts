import mongoose, { type InferSchemaType, type Model } from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["leader", "member"],
      required: true
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: {
      type: [memberSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ "members.user": 1 });

export type ProjectMember = InferSchemaType<typeof memberSchema>;
export type ProjectDocument = mongoose.HydratedDocument<InferSchemaType<typeof projectSchema>>;

const Project = (mongoose.models.Project as Model<InferSchemaType<typeof projectSchema>>) ||
  mongoose.model("Project", projectSchema);

export default Project;
