const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const RecipeIngredient = require("../../models/RecipeIngredient");

router.get("/", async (req, res, next) => {
  try {
    const includeFlavor = req.query.includeFlavor ? req.query.includeFlavor.split(",").map(s => s.trim()).filter(Boolean) : [];
    const excludeFlavor = req.query.excludeFlavor ? req.query.excludeFlavor.split(",").map(s => s.trim()).filter(Boolean) : [];
    const includeDiet   = req.query.includeDiet   ? req.query.includeDiet.split(",").map(s => s.trim()).filter(Boolean)   : [];
    const excludeDiet   = req.query.excludeDiet   ? req.query.excludeDiet.split(",").map(s => s.trim()).filter(Boolean)   : [];
    const recipeCategory = req.query.category;
    const titleQuery     = req.query.title;

    // Build regex arrays (case-insensitive, partial match)
    const toRegs = (arr) => arr.map(v => new RegExp(v, "i"));
    const incFlavorRx = toRegs(includeFlavor);
    const excFlavorRx = toRegs(excludeFlavor);
    const incDietRx   = toRegs(includeDiet);
    const excDietRx   = toRegs(excludeDiet);

    const pipeline = [
      // Join once with ingredient info
      { $lookup: { from: "ingredients_lookup", localField: "Ing_ID", foreignField: "Ing_ID", as: "ingInfo" } },
      { $unwind: "$ingInfo" }
    ];

    // Include filters (match ANY ingredient whose category matches any include regex)
    if (incFlavorRx.length || incDietRx.length) {
      const orConds = [];
      if (incFlavorRx.length) orConds.push({ "ingInfo.FlavorDB_Category": { $in: incFlavorRx } });
      if (incDietRx.length)   orConds.push({ "ingInfo.Dietrx_Category":   { $in: incDietRx } });
      pipeline.push({ $match: { $or: orConds } });
      pipeline.push({ $group: { _id: "$Recipe_ID" } });
    } else {
      pipeline.push({ $group: { _id: "$Recipe_ID" } });
    }

    // Exclude filters (remove recipes that have ANY ingredient in excluded categories)
    if (excFlavorRx.length || excDietRx.length) {
      pipeline.push(
        { $lookup: { from: "recipe_ingredients", localField: "_id", foreignField: "Recipe_ID", as: "ings" } },
        { $unwind: "$ings" },
        { $lookup: { from: "ingredients_lookup", localField: "ings.Ing_ID", foreignField: "Ing_ID", as: "xInfo" } },
        { $unwind: "$xInfo" }
      );
      const norConds = [];
      if (excFlavorRx.length) norConds.push({ "xInfo.FlavorDB_Category": { $in: excFlavorRx } });
      if (excDietRx.length)   norConds.push({ "xInfo.Dietrx_Category":   { $in: excDietRx } });
      pipeline.push({ $match: { $nor: norConds } });
      pipeline.push({ $group: { _id: "$_id" } });
    }

    const matches = await RecipeIngredient.aggregate(pipeline);
    const ids = matches.map(m => m._id);
    if (!ids.length) return res.json([]);

    const query = { Recipe_ID: { $in: ids } };
    if (recipeCategory) query.Category = new RegExp(recipeCategory, "i");
    if (titleQuery)     query.Recipe_Title = new RegExp(titleQuery, "i");

    const items = await Recipe.find(query)
      .sort({ Ratings_Count: -1, Ratings: -1 })
      .limit(100)
      .lean();

    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
