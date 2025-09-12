const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (req, res, next) => {
  try {
    const { min, max } = req.query;
    const q = {};
    if (min) q["Nutrition.Calories"] = { ...(q["Nutrition.Calories"] || {}), $gte: Number(min) };
    if (max) q["Nutrition.Calories"] = { ...(q["Nutrition.Calories"] || {}), $lte: Number(max) };

    const items = await Recipe.find(q).sort({ "Nutrition.Calories": 1 }).limit(100).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
