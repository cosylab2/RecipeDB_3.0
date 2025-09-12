const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (req, res, next) => {
  try {
    const { title } = req.query;
    if (!title) return res.json([]);
    const items = await Recipe.find({ Recipe_Title: new RegExp(title, "i") }).limit(50).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
