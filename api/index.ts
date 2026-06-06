import type { IncomingMessage, ServerResponse } from "node:http";
import { connectDB } from "../artifacts/api-server/src/lib/mongodb.js";
import app from "../artifacts/api-server/src/app.js";

let connected = false;

async function ensureConnected() {
  if (!connected) {
    await connectDB();
    connected = true;
  }
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  await ensureConnected();
  app(req as any, res as any);
}
