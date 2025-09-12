const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const RecipeInstruction = require("../../models/RecipeInstruction");

// GET /recipes-method/:method?limit=50
router.get("/:method", async (req, res, next) => {
  try {
    const { method } = req.params;
    const regs = [new RegExp(method, "i")];

    const matches = await RecipeInstruction.aggregate([
      { $match: { COOKING_INSTRUCTION: { $in: regs } } },
      { $group: { _id: "$Recipe_ID", n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 500 }
    ]);

    const ids = matches.map(m => m._id);
    const items = await Recipe.find({ Recipe_ID: { $in: ids } })
      .sort({ Ratings_Count: -1, Ratings: -1 })
      .limit(Math.min(200, Number(req.query.limit || 50)))
      .lean();

    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
