const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");
const { pad8, toInt, toFloat, hashRow } = require("../utils");
require("dotenv").config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const file = process.argv[2];
  if (!file) throw new Error("Please provide path to Nutrition.csv");

  const setPath = path.join(__dirname, "active_recipe_ids.json");
  if (!fs.existsSync(setPath)) throw new Error("Run importGeneral.js first.");
  const active = new Set(JSON.parse(fs.readFileSync(setPath, "utf-8")));

  const ops = [];
  const stream = fs.createReadStream(file).pipe(csv());

  stream.on("data", (row) => {
    const rid = pad8(row.Recipe_ID);
    if (!active.has(rid)) return;

    ops.push(
      Recipe.updateOne(
        { Recipe_ID: rid },
        {
          $set: {
            Nutrition: {
              Calories: toFloat(row["Calories(Kcal)"]),
              Fat: toFloat(row["Fat(gm)"]),
              Saturated_Fat: toFloat(row["Saturated_Fat(gm)"]),
              Cholesterol: toFloat(row["Cholesterol(gm)"]),
              Sodium: toFloat(row["Sodium(gm)"]),
              Carbohydrates: toFloat(row["Carbohydrates(gm)"]),
              Fiber: toFloat(row["Fiber(gm)"]),
              Sugar: toFloat(row["Sugar(gm)"]),
              Protein: toFloat(row["Protein(gm)"])
            }
          }
        },
        { upsert: true }
      )
    );
  });

  stream.on("end", async () => {
    console.log(`Queued ${ops.length} nutrition upserts. Waiting for Mongo...`);
    await Promise.all(ops);
    console.log("✅ Nutrition import complete.");
    await mongoose.disconnect();
  });

  stream.on("error", async (e) => { console.error(e); await mongoose.disconnect(); });
})();
