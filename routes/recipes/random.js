const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const n = Math.min(50, Number(limit));
    const docs = await Recipe.aggregate([{ $sample: { size: n } }]);
    res.json(docs);
  } catch (e) { next(e); }
});

module.exports = router;
