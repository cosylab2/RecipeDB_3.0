const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/:id", async (req, res, next) => {
  try {
    const base = await Recipe.findOne({ Recipe_ID: req.params.id }).lean();
    if (!base) return res.status(404).json({ error: "Not found" });

    const cal = base?.Nutrition?.Calories;
    const q = { Recipe_ID: { $ne: base.Recipe_ID } };
    if (base.Cuisine) q.Cuisine = base.Cuisine;
    if (base.Category) q.Category = base.Category;
    if (typeof cal === "number") q["Nutrition.Calories"] = { $gte: cal - 100, $lte: cal + 100 };

    const items = await Recipe.find(q).sort({ Ratings_Count: -1 }).limit(20).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
