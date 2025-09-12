const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");

router.get("/", async (req, res, next) => {
  try {
    const { has = "true", limit = 30 } = req.query;
    const cond = (String(has).toLowerCase() === "true")
      ? { Image_URL: { $exists: true, $ne: "" } }
      : { $or: [{ Image_URL: { $exists: false } }, { Image_URL: "" }] };
    const items = await Recipe.find(cond).limit(Math.min(100, Number(limit))).lean();
    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
