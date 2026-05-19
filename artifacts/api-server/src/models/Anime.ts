import { mongoose } from "../lib/mongodb";

const animeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    genres: [{ type: String }],
    tags: [{ type: String }],
    releaseYear: { type: Number, default: null },
    bannerImage: { type: String, default: null },
    coverImage: { type: String, default: null },
    status: {
      type: String,
      enum: ["ongoing", "completed"],
      default: "ongoing",
    },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Anime = mongoose.model("Anime", animeSchema);
