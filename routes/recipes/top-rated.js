const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (req, res, next) => {
  try {
    const { limit = 30 } = req.query;
    const items = await Recipe.find({})
      .sort({ Ratings_Count: -1, Ratings: -1 })
      .limit(Math.min(100, Number(limit))).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
