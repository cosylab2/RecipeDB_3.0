const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");
const { pad8, toInt, toFloat, hashRow } = require("../utils");

require("dotenv").config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const file = process.argv[2];
  if (!file) throw new Error("Please provide path to Ingredient.csv");

  const ops = [];
  const stream = fs.createReadStream(file).pipe(csv());

  stream.on("data", (row) => {
    const ingId = pad8(row.Ing_ID);
    ops.push(
      Ingredient.updateOne(
        { Ing_ID: ingId },
        { $set: { ...row, Ing_ID: ingId, Frequency: toInt(row.Frequency) } },
        { upsert: true }
      )
    );
  });

  stream.on("end", async () => {
    console.log(`Queued ${ops.length} ingredient upserts. Waiting for Mongo...`);
    await Promise.all(ops);
    console.log("✅ Ingredient.csv import complete.");
    await mongoose.disconnect();
  });

  stream.on("error", async (e) => { console.error(e); await mongoose.disconnect(); });
})();
