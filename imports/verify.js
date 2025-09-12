const mongoose = require("mongoose");
require("dotenv").config();
const Recipe = require("../models/Recipe");
const RecipeIngredient = require("../models/RecipeIngredient");
const RecipeInstruction = require("../models/RecipeInstruction");
const Ingredient = require("../models/Ingredient");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const [r, ri, rs, ing] = await Promise.all([
    Recipe.countDocuments({}),
    RecipeIngredient.countDocuments({}),
    RecipeInstruction.countDocuments({}),
    Ingredient.countDocuments({}),
  ]);
  console.log({ recipes: r, recipe_ingredients: ri, recipe_instructions: rs, ingredients_lookup: ing });
  await mongoose.disconnect();
})();
