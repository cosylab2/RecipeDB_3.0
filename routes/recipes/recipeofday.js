const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const hash = today.replace(/-/g, "");
    const skip = parseInt(hash, 10) % 3000;

    const recipe = await Recipe.findOne({}).skip(skip).lean();
    res.json({ date: today, recipe });
  } catch (e) { next(e); }
});

module.exports = router;
