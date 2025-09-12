const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const { normalize } = require("../../middleware/normalize");

router.get("/", normalize, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, cuisine, category } = req.query;
    const query = {};
    if (cuisine) query.Cuisine = new RegExp(cuisine, "i");
    if (category) query.Category = new RegExp(category, "i");

    const skip = (page - 1) * limit;
    const items = await Recipe.find(query).skip(skip).limit(Number(limit)).lean();
    const total = await Recipe.countDocuments(query);

    res.json({ data: items, meta: { page, limit, total } });
  } catch (e) { next(e); }
});

module.exports = router;
