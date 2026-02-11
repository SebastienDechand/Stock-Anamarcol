require("dotenv").config({ path: "./config/.env" });
const mongoose = require("mongoose");
require("./config/db");

setTimeout(async () => {
  try {
    const db = mongoose.connection.db;
    const col = db.collection("items");

    // Check a sample
    const sample = await col.findOne({});
    console.log(
      "Sample quantite:",
      sample.quantite,
      "| type:",
      typeof sample.quantite,
    );

    // Count docs with string quantite
    const stringCount = await col.countDocuments({
      quantite: { $type: "string" },
    });
    console.log("Documents with string quantite:", stringCount);

    if (stringCount > 0) {
      // Convert all string quantite to numbers
      const cursor = col.find({ quantite: { $type: "string" } });
      let converted = 0;

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const num = parseInt(doc.quantite, 10) || 0;
        await col.updateOne({ _id: doc._id }, { $set: { quantite: num } });
        converted++;
      }

      console.log(`Converted ${converted} documents from string to number.`);
    } else {
      console.log("All quantite values are already numbers.");
    }

    // Verify
    const verifySum = await col
      .aggregate([{ $group: { _id: null, total: { $sum: "$quantite" } } }])
      .toArray();
    console.log("Total stock after migration:", verifySum[0]?.total || 0);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}, 3000);
