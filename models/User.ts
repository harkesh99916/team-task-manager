import mongoose, { type InferSchemaType, type Model } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["pending", "admin", "leader", "member"],
      default: "pending"
    },
    assignedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null
    }
  },
  {
    timestamps: true
  }
);

export type UserDocument = mongoose.HydratedDocument<InferSchemaType<typeof userSchema>>;

const User = (mongoose.models.User as Model<InferSchemaType<typeof userSchema>>) ||
  mongoose.model("User", userSchema);

export default User;
