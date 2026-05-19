import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI must be set.");
}

let isConnected = false;

// Only these indexes belong to the current User schema
const VALID_USER_INDEXES = new Set(["_id_", "username_1"]);

async function dropStaleIndexes(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const usersCollection = db.collection("users");
    const indexes = await usersCollection.indexes();

    for (const idx of indexes) {
      if (!VALID_USER_INDEXES.has(idx.name as string)) {
        await usersCollection.dropIndex(idx.name as string);
        logger.info({ index: idx.name }, "Dropped stale index from users collection");
      }
    }
  } catch (err) {
    logger.warn({ err }, "Could not drop stale indexes (non-fatal)");
  }
}

export async function connectDB(): Promise<void> {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI!);
  isConnected = true;
  logger.info("Connected to MongoDB");
  await dropStaleIndexes();
}

export { mongoose };
