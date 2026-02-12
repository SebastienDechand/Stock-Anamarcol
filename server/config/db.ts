import mongoose from "mongoose";

mongoose
  .connect(
    "mongodb+srv://" +
      process.env.DB_USER_PASS +
      "@anamarcol.fa6bdkr.mongodb.net/Anamarcol",
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err: unknown) => console.log("Failed to connect to MongoDB", err));
