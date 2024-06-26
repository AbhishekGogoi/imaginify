import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

//in a nextJS application we should connect to the database on every request
// because nextJS is a serverless application. NextJS runs in a serverless environment.
// serverless functions are stateless, meaning they start up to handle our requests and immediately
//shutdown right after, without maintaining a continuous connection to database.
//this approach ensures that each request is handled independently allowing for better scalability and
//reliability as there is no need to manage persistent connections across many instances.

//to optimize this process we will use caching for our connections so that

//to let typescript know that it is global and coming from the global scope

let cached: MongooseConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URL) throw new Error("Missing MONGODB_URL");

  cached.promise =
    cached.promise ||
    mongoose.connect(MONGODB_URL, {
      dbName: "imaginify",
      bufferCommands: false,
    });

  cached.conn = await cached.promise;

  return cached.conn;
};
