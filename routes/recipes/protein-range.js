const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (req, res, next) => {
  try {
    const { min, max } = req.query;
    const q = {};
    if (min) q["Nutrition.Protein"] = { ...(q["Nutrition.Protein"] || {}), $gte: Number(min) };
    if (max) q["Nutrition.Protein"] = { ...(q["Nutrition.Protein"] || {}), $lte: Number(max) };

    const items = await Recipe.find(q).limit(100).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
