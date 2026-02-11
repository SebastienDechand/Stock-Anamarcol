require("dotenv").config({ path: "./config/.env" });
const mongoose = require("mongoose");
require("./config/db");

setTimeout(async () => {
  try {
    const db = mongoose.connection.db;
    const users = db.collection("users");

    const adminIds = [
      new mongoose.Types.ObjectId("65afe8c7c307f521781311fd"), // Edith LECORDIER
      new mongoose.Types.ObjectId("65afe8e4c307f52178131201"), // Coline LECORDIER
      new mongoose.Types.ObjectId("6601caa3a86f2ebde5490479"), // Sébastien DECHAND
    ];

    const result = await users.updateMany(
      { _id: { $in: adminIds } },
      { $set: { role: "admin" } },
    );

    console.log(`${result.modifiedCount} utilisateurs passés en admin.`);

    // Vérification
    const admins = await users
      .find({ role: "admin" })
      .project({ pseudo: 1, role: 1 })
      .toArray();
    console.log("Admins:", admins);
  } catch (e) {
    console.error("Erreur:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}, 3000);
