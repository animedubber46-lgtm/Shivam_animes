import { mongoose } from "../lib/mongodb";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    username: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, default: null },
    ip: { type: String, default: null },
    country: { type: String, default: null },
    deviceInfo: { type: String, default: null },
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
