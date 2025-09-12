const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (req, res, next) => {
  try {
    const { category } = req.query;
    const items = await Recipe.find({ Category: new RegExp(category, "i") }).limit(100).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
