import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const MONGODB_BINARY_VERSION = "7.0.14";

let mongod: MongoMemoryServer | undefined;

export async function connectTestDb(): Promise<void> {
  mongod = await MongoMemoryServer.create({
    binary: { version: MONGODB_BINARY_VERSION },
  });
  await mongoose.connect(mongod.getUri());
  // autoIndex builds indexes asynchronously; force it so unique-index tests
  // (duplicate username/email) aren't racy.
  await mongoose.connection.syncIndexes();
}

export async function clearTestDb(): Promise<void> {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  await mongod?.stop();
  mongod = undefined;
}
