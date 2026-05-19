import { ActivityLog } from "../models/ActivityLog";

interface LogOptions {
  userId?: string;
  username: string;
  type: string;
  description?: string;
  ip?: string;
  country?: string;
  deviceInfo?: string;
}

export async function logActivity(opts: LogOptions): Promise<void> {
  try {
    await ActivityLog.create({
      userId: opts.userId || null,
      username: opts.username,
      type: opts.type,
      description: opts.description || null,
      ip: opts.ip || null,
      country: opts.country || null,
      deviceInfo: opts.deviceInfo || null,
    });
  } catch {
    // non-blocking
  }
}
