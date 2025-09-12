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
  if (!file) throw new Error("Please provide path to General.csv");

  const activeIds = new Set();
  const ops = [];
  const outPath = path.join(__dirname, "active_recipe_ids.json");

  const stream = fs.createReadStream(file).pipe(csv());

  stream.on("data", (row) => {
    const rid = pad8(row.Recipe_ID);
    if (!/^\d{8}$/.test(rid)) return;

    if (!activeIds.has(rid)) {
      if (activeIds.size >= 3000) return; // ignore rows beyond first 3000 unique IDs
      activeIds.add(rid);
    }

    const imgId = pad8(row.Image_ID);
    ops.push(
      Recipe.updateOne(
        { Recipe_ID: rid },
        {
          $set: {
            Recipe_ID: rid,
            URL: row.URL,
            Source: row.Source,
            Image_ID: imgId,
            Image_URL: row.Image_URL,
            Recipe_Title: row.Recipe_Title,
            Prep_Time: row.Prep_Time,
            Cook_Time: row.Cook_Time,
            Total_Time: row.Total_Time,
            Instructions: row.Instructions,
            Category: row.Category,
            Cuisine: row.Cuisine,
            Servings: toInt(row.Servings),
            Ratings: toFloat(row.Ratings),
            Ratings_Count: toInt(row.Votes)
          }
        },
        { upsert: true }
      )
    );
  });

  stream.on("end", async () => {
    console.log(`Queued ${ops.length} recipe upserts. Waiting for Mongo...`);
    await Promise.all(ops);  // <-- ensure all writes finish
    fs.writeFileSync(outPath, JSON.stringify([...activeIds], null, 2));
    console.log(`✅ General import complete. Active IDs saved to ${outPath}`);
    await mongoose.disconnect();
  });

  stream.on("error", async (e) => {
    console.error(e);
    await mongoose.disconnect();
  });
})();
