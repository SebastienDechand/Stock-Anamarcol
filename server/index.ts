import dotenv from "dotenv";
// In production, env variables are already defined by the host
// Only load .env file if CLIENT_URL is not already set
if (!process.env.CLIENT_URL) {
  dotenv.config({ path: "./config/.env" });
}
import { connectDB } from "./config/db";
import app from "./app";

// Wait for MongoDB before accepting requests
connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
  });
});
