const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/:region", async (req, res, next) => {
  try {
    const items = await Recipe.find({ Cuisine: new RegExp(req.params.region, "i") }).limit(100).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
