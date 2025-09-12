const mongoose = require("mongoose");
require("dotenv").config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  await Promise.all([
    db.collection("recipes").createIndex({ Recipe_ID: 1 }, { unique: true }),
    db.collection("recipes").createIndex({ Cuisine: 1 }),
    db.collection("recipes").createIndex({ Category: 1 }),
    db.collection("recipes").createIndex({ "Nutrition.Calories": 1 }),
    db.collection("recipe_ingredients").createIndex({ Recipe_ID: 1 }),
    db.collection("recipe_ingredients").createIndex({ NAME: 1 }),
    db.collection("ingredients_lookup").createIndex({ Ing_ID: 1 }, { unique: true }),
    db.collection("ingredients_lookup").createIndex({ FlavorDB_Category: 1 }),
    db.collection("ingredients_lookup").createIndex({ Dietrx_Category: 1 }),
    db.collection("recipe_instructions").createIndex({ Recipe_ID: 1 }),
    db.collection("recipe_instructions").createIndex({ UTENSIL: 1 }),
    db.collection("recipe_instructions").createIndex({ COOKING_INSTRUCTION: 1 }),
  ]);
  console.log("✅ Indexes created");
  await mongoose.disconnect();
})();
