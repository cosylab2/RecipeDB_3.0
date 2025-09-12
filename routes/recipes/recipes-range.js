const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (req, res, next) => {
  try {
    const { calories_min, calories_max, protein_min, protein_max } = req.query;
    const q = {};
    if (calories_min) q["Nutrition.Calories"] = { ...(q["Nutrition.Calories"] || {}), $gte: Number(calories_min) };
    if (calories_max) q["Nutrition.Calories"] = { ...(q["Nutrition.Calories"] || {}), $lte: Number(calories_max) };
    if (protein_min) q["Nutrition.Protein"] = { ...(q["Nutrition.Protein"] || {}), $gte: Number(protein_min) };
    if (protein_max) q["Nutrition.Protein"] = { ...(q["Nutrition.Protein"] || {}), $lte: Number(protein_max) };

    const items = await Recipe.find(q).limit(100).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
