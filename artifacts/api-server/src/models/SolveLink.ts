import { mongoose } from "../lib/mongodb";

const solveLinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    url: { type: String, required: true },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SolveLink = mongoose.model("SolveLink", solveLinkSchema);
