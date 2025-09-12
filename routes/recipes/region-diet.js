const express = require("express");
const router = express.Router();
const Recipe = require("../../models/Recipe");
const RecipeIngredient = require("../../models/RecipeIngredient");
const { patternsForDiet } = require("../../utils/diet");

// GET /region-diet?region=indian&diet=vegetarian&limit=50
router.get("/", async (req, res, next) => {
  try {
    const { region, diet, limit = 50 } = req.query;
    if (!region || !diet) return res.status(400).json({ error: "region and diet are required" });

    const { forbidCat, forbidName } = patternsForDiet(diet);
    if (!forbidCat.length && !forbidName.length) return res.status(400).json({ error: "unsupported diet" });

    const pipeline = [
      { $lookup: { from: "ingredients_lookup", localField: "Ing_ID", foreignField: "Ing_ID", as: "ingInfo" } },
      { $unwind: { path: "$ingInfo", preserveNullAndEmptyArrays: true } },
      { $addFields: {
          diet_cat: { $ifNull: ["$ingInfo.Dietrx_Category", ""] },
          ing_name: { $ifNull: ["$NAME", ""] }
      } }
    ];

    const orConds = [];
    forbidCat.forEach(r => orConds.push({ $regexMatch: { input: "$diet_cat", regex: r } }));
    forbidName.forEach(r => orConds.push({ $regexMatch: { input: "$ing_name", regex: r } }));

    pipeline.push(
      { $addFields: { isForbidden: { $or: orConds } } },
      { $group: { _id: "$Recipe_ID", hasForbidden: { $max: { $cond: ["$isForbidden", 1, 0] } } } },
      { $match: { hasForbidden: 0 } }
    );

    const ok = await RecipeIngredient.aggregate(pipeline);
    const ids = ok.map(x => x._id);

    const items = await Recipe.find({ Recipe_ID: { $in: ids }, Cuisine: new RegExp(region, "i") })
      .sort({ Ratings_Count: -1, Ratings: -1 })
      .limit(Math.min(200, Number(limit)))
      .lean();

    res.json(items);
  } catch (e) { next(e); }
});

module.exports = router;
