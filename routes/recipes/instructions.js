const express = require("express");
const router = express.Router();
const RecipeInstruction = require("../../models/RecipeInstruction");

router.get("/:id", async (req, res, next) => {
  try {
    const list = await RecipeInstruction.find({ Recipe_ID: req.params.id }).lean();
    res.json(list);
  } catch (e) { next(e); }
});

module.exports = router;
