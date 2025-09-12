const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const RecipeIngredient = require("../../models/RecipeIngredient");

// GET /recipe-day/with-ingredients-categories?includeFlavor=spice&includeDiet=vegetarian
router.get("/", async (req, res, next) => {
  try {
    const includeFlavor = req.query.includeFlavor ? req.query.includeFlavor.split(",").map(s => s.trim()).filter(Boolean) : [];
    const excludeFlavor = req.query.excludeFlavor ? req.query.excludeFlavor.split(",").map(s => s.trim()).filter(Boolean) : [];
    const includeDiet   = req.query.includeDiet   ? req.query.includeDiet.split(",").map(s => s.trim()).filter(Boolean)   : [];
    const excludeDiet   = req.query.excludeDiet   ? req.query.excludeDiet.split(",").map(s => s.trim()).filter(Boolean)   : [];

    const toRegs = (arr) => arr.map(v => new RegExp(v, "i"));
    const incFlavorRx = toRegs(includeFlavor);
    const excFlavorRx = toRegs(excludeFlavor);
    const incDietRx   = toRegs(includeDiet);
    const excDietRx   = toRegs(excludeDiet);

    const pipeline = [
      { $lookup: { from: "ingredients_lookup", localField: "Ing_ID", foreignField: "Ing_ID", as: "ingInfo" } },
      { $unwind: "$ingInfo" }
    ];

    // Include regexes
    if (incFlavorRx.length || incDietRx.length) {
      const orConds = [];
      if (incFlavorRx.length) orConds.push({ "ingInfo.FlavorDB_Category": { $in: incFlavorRx } });
      if (incDietRx.length)   orConds.push({ "ingInfo.Dietrx_Category":   { $in: incDietRx } });
      pipeline.push({ $match: { $or: orConds } });
      pipeline.push({ $group: { _id: "$Recipe_ID" } });
    } else {
      pipeline.push({ $group: { _id: "$Recipe_ID" } });
    }

    // Exclude regexes
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
    const ids = matches.map(x => x._id);

    const today = new Date().toISOString().slice(0, 10);
    if (!ids.length) return res.json({ date: today, recipe: null });

    const idx = parseInt(today.replace(/-/g, ""), 10) % ids.length;
    const recipe = await Recipe.findOne({ Recipe_ID: ids[idx] }).lean();

    res.json({ date: today, recipe });
  } catch (e) { next(e); }
});

module.exports = router;
