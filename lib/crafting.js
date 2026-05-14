export function resolveRaws(materialId, qty, recipes, depth = 0) {
  if (depth > 20) return { raws: { [materialId]: qty }, steps: [] };

  const recipe = recipes.find(r => r.output_id === materialId);
  if (!recipe) return { raws: { [materialId]: qty }, steps: [] };

  const batches = Math.ceil(qty / recipe.output_qty);
  const steps = [{
    id: recipe.id,
    name: recipe.name,
    batches,
    station: recipe.station,
    totalOut: batches * recipe.output_qty,
  }];

  const raws = {};
  for (const ing of recipe.ingredients) {
    const sub = resolveRaws(ing.material_id, ing.qty * batches, recipes, depth + 1);
    for (const [k, v] of Object.entries(sub.raws)) raws[k] = (raws[k] || 0) + v;
    for (const s of sub.steps) {
      const existing = steps.find(x => x.id === s.id);
      if (existing) existing.batches = Math.max(existing.batches, s.batches);
      else steps.push(s);
    }
  }
  return { raws, steps };
}
