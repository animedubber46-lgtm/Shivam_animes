import { mongoose } from "../lib/mongodb";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date, default: null },
    premiumDays: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    deviceId: { type: String, default: null },
    lastIp: { type: String, default: null },
    lastCountry: { type: String, default: null },
    lastActiveAt: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Anime" }],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
