const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const RecipeIngredient = require("../../models/RecipeIngredient");

// GET /ingredients/flavor/:flavor?limit=50
router.get("/:flavor", async (req, res, next) => {
  try {
    const { flavor } = req.params;
    const limit = Math.min(200, Number(req.query.limit || 50));

    const matches = await RecipeIngredient.aggregate([
      { $lookup: { from: "ingredients_lookup", localField: "Ing_ID", foreignField: "Ing_ID", as: "ingInfo" } },
      { $unwind: "$ingInfo" },
      { $match: { "ingInfo.FlavorDB_Category": { $regex: new RegExp(flavor, "i") } } },
      { $group: { _id: "$Recipe_ID" } }
    ]);

    const ids = matches.map(m => m._id);
    if (!ids.length) return res.json([]);

    const items = await Recipe.find({ Recipe_ID: { $in: ids } })
      .sort({ Ratings_Count: -1, Ratings: -1 })
      .limit(limit)
      .lean();

    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
