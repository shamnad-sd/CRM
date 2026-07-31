import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Add it to .env.local"
  );
}

/**
 * Next.js hot-reloads modules in dev, which would otherwise create a new
 * connection on every reload. We cache the connection (and in-flight promise)
 * on the global object so it survives across module reloads and serverless
 * invocations reuse the same connection.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

global._mongooseCache ??= { conn: null, promise: null };
const cached: MongooseCache = global._mongooseCache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  cached.promise ??= mongoose.connect(MONGODB_URI as string, {
    bufferCommands: false,
  });

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectToDatabase;
