import { mongoose } from "../lib/mongodb";

const episodeSchema = new mongoose.Schema(
  {
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Anime",
      required: true,
    },
    episodeNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    thumbnail: { type: String, default: null },
    destinationUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Episode = mongoose.model("Episode", episodeSchema);
