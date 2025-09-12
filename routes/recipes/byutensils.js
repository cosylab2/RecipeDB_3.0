const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const RecipeInstruction = require("../../models/RecipeInstruction");

// GET /byutensils/utensils?utensils=pan,skillet,wok&limit=50
router.get("/utensils", async (req, res, next) => {
  try {
    const list = req.query.utensils ? req.query.utensils.split(",").map(s => s.trim()) : [];
    if (!list.length) return res.status(400).json({ error: "utensils query is required (comma-separated)" });

    const regs = list.map(u => new RegExp(u, "i"));

    const matches = await RecipeInstruction.aggregate([
      { $match: { UTENSIL: { $in: regs } } },
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
