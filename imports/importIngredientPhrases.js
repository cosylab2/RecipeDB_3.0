const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const RecipeIngredient = require("../models/RecipeIngredient");
const { pad8, toInt, toFloat, hashRow } = require("../utils");

require("dotenv").config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const file = process.argv[2];
  if (!file) throw new Error("Please provide path to Ingredient_Phrases.csv");

  const setPath = path.join(__dirname, "active_recipe_ids.json");
  if (!fs.existsSync(setPath)) throw new Error("Run importGeneral.js first.");
  const active = new Set(JSON.parse(fs.readFileSync(setPath, "utf-8")));

  const ops = [];
  const stream = fs.createReadStream(file).pipe(csv());

  stream.on("data", (row) => {
    const rid = pad8(row.Recipe_ID);
    if (!active.has(rid)) return;

    const ingId = pad8(row.Ing_ID);
    const _id = hashRow({ ...row, Recipe_ID: rid, Ing_ID: ingId });

    ops.push(
      RecipeIngredient.updateOne(
        { _id },
        { $set: { ...row, Recipe_ID: rid, Ing_ID: ingId, _id } },
        { upsert: true }
      )
    );
  });

  stream.on("end", async () => {
    console.log(`Queued ${ops.length} ingredient-phrase upserts. Waiting for Mongo...`);
    await Promise.all(ops);
    console.log("✅ Ingredient_Phrases import complete.");
    await mongoose.disconnect();
  });

  stream.on("error", async (e) => { console.error(e); await mongoose.disconnect(); });
})();
