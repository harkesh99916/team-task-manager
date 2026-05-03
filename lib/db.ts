import mongoose from "mongoose";
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };

global.mongooseCache = cache;

function getDatabaseName(mongoUri: string) {
  const pathname = new URL(mongoUri).pathname.replace(/^\/+/, "");

  if (!pathname) {
    return "team-task-manager";
  }

  return pathname;
}

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable. For local scripts, make sure it exists in .env.local or .env."
    );
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri, {
      autoIndex: true,
      dbName: getDatabaseName(mongoUri)
    });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
