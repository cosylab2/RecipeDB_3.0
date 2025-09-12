const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const RecipeIngredient = require("../../models/RecipeIngredient");

router.get("/", async (req, res, next) => {
  try {
    const includes = req.query.include ? req.query.include.split(",") : [];
    const excludes = req.query.exclude ? req.query.exclude.split(",") : [];

    if (!includes.length && !excludes.length) return res.json([]);

    const pipeline = [];
    if (includes.length) {
      pipeline.push(
        { $match: { NAME: { $in: includes.map(v => new RegExp(v, "i")) } } },
        { $group: { _id: "$Recipe_ID", matchCount: { $sum: 1 } } },
        { $match: { matchCount: { $gte: includes.length } } }
      );
    } else {
      pipeline.push({ $group: { _id: "$Recipe_ID" } });
    }

    if (excludes.length) {
      pipeline.push(
        { $lookup: { from: "recipe_ingredients", localField: "_id", foreignField: "Recipe_ID", as: "ings" } },
        { $match: { "ings.NAME": { $not: { $elemMatch: { $in: excludes } } } } }
      );
    }

    const matches = await RecipeIngredient.aggregate(pipeline);
    const ids = matches.map(m => m._id);
    const items = await Recipe.find({ Recipe_ID: { $in: ids } }).limit(100).lean();

    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
