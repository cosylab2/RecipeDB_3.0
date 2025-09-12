/* eslint-disable no-console */
const BASE = process.env.BASE_URL || "http://localhost:3000/api";
const ROOT = `${BASE}/recipes`; // matches app.use('/api/recipes', ...)

async function readBodySafe(res) {
  const t = await res.text();      // read once
  try { return JSON.parse(t); }    // try JSON
  catch { return t; }              // fall back to text
}

async function hit(label, path) {
  const url = path.startsWith("http") ? path : `${ROOT}${path}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url);
    const ms = Date.now() - t0;
    const body = await readBodySafe(res);
    const ok = res.ok;
    console.log(`${ok ? "✅" : "❌"}  [${res.status}] ${label.padEnd(32)} ${url}  (${ms}ms)`);
    return { label, url, status: res.status, ok, body };
  } catch (err) {
    const ms2 = Date.now() - t0;
    console.log(`❌  [ERR] ${label.padEnd(32)} ${url}  (${ms2}ms) -> ${err.message}`);
    return { label, url, status: 0, ok: false, error: err };
  }
}

(async () => {
  // 1) Discover some IDs/cuisine/category
  const list = await hit("recipesinfo", "/recipesinfo?limit=5");
  const first = (list.body && list.body.data && list.body.data[0]) || {};
  const rid = first.Recipe_ID || "00000001";
  const cuisine = first.Cuisine || "indian";
  const category = first.Category || "Dessert";
  const titleWord = (first.Recipe_Title || "chicken").split(/\s+/)[0];

  // 2) Endpoints that need Recipe_ID
  const withId = [
    ["search-recipe/{id}", `/search-recipe/${rid}`],
    ["instructions/{recipe_id}", `/instructions/${rid}`],
    ["nutritioninfo", `/nutritioninfo/${rid}`],
    ["micronutritioninfo", `/micronutritioninfo/${rid}`],
    ["similar", `/similar/${rid}`],
  ];

  // 3) The Foodoscope endpoints
  const foodoscope = [
    ["recipeofday", `/recipeofday`],
    ["recipe-day/with-ingredients-categories", `/recipe-day/with-ingredients-categories?includeFlavor=Spices`],
    ["recipes/range", `/recipes/range?calories_min=50&calories_max=1000`],
    ["recipes_cuisine/cuisine/{region}", `/recipes_cuisine/cuisine/${encodeURIComponent(cuisine)}`],
    ["recipeByTitle", `/recipeByTitle?title=${encodeURIComponent(titleWord)}`],
    ["calories", `/calories?min=100&max=1000`],
    ["region-diet", `/region-diet?region=${encodeURIComponent(cuisine)}&diet=vegetarian&limit=30`],
    ["recipe-diet", `/recipe-diet?diet=vegetarian&limit=30`],
    ["recipes-by-carbs", `/recipes-by-carbs?min=0&max=300`],
    ["meal-plan", `/meal-plan?target_calories=1800&meals=3&cuisine=${encodeURIComponent(cuisine)}`],
    ["ingredients/flavor/{flavor}", `/ingredients/flavor/Spices?limit=20`],
    ["byutensils/utensils", `/byutensils/utensils?utensils=pan,skillet,wok&limit=20`],
    ["recipes-method/{method}", `/recipes-method/bake?limit=20`],
    ["byenergy/energy", `/byenergy/energy?min=100&max=1000`],
    ["by-ingredients-categories-title", `/by-ingredients-categories-title?includeFlavor=Spices&category=${encodeURIComponent(category)}&title=${encodeURIComponent(titleWord)}`],
    ["category", `/category?category=${encodeURIComponent(category)}`],
    ["protein-range", `/protein-range?min=0&max=200`],
    ["recipe-Day-category", `/recipe-Day-category?category=${encodeURIComponent(category)}`],
  ];

  // 4) Bonus endpoints
  const bonus = [
    ["facets", `/facets`],
    ["top-rated", `/top-rated?limit=10`],
    ["random", `/random?limit=3`],
    ["with-image", `/with-image?has=true&limit=5`],
    ["by-ingredients", `/by-ingredients?include=onion,tomato&exclude=beef`],
  ];

  const results = [];
  results.push(list);
  for (const [label, path] of withId)     results.push(await hit(label, path));
  for (const [label, path] of foodoscope) results.push(await hit(label, path));
  for (const [label, path] of bonus)      results.push(await hit(label, path));

  const ok = results.filter(r => r.ok).length;
  const total = results.length;
  console.log("\n========== SUMMARY ==========");
  console.log(`Passed: ${ok}/${total}`);
  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    console.log("\nFailed endpoints:");
    failed.forEach(f => console.log(` - ${f.label}  -> ${f.url}  [status: ${f.status}]`));
  }
})();