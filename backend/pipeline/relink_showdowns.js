const fs = require('fs');
const path = require('path');

const dealsPath = path.resolve(__dirname, '../../data/deals.json');
const compPath = path.resolve(__dirname, '../../data/comparisons.json');

const deals = JSON.parse(fs.readFileSync(dealsPath, 'utf-8'));

if (deals.length < 2) {
  console.error('Not enough deals to generate comparisons.');
  process.exit(1);
}

const comparisons = [];
const seenPairs = new Set();

// Pair items in same category or adjacent flagship tiers
for (let i = 0; i < deals.length - 1; i++) {
  if (comparisons.length >= 14) break;
  const a = deals[i];

  for (let j = i + 1; j < deals.length; j++) {
    if (comparisons.length >= 14) break;
    const b = deals[j];

    // Same category or high-ticket showdown
    if (a.category === b.category || (a.current_price > 400 && b.current_price > 400)) {
      const pairKey = [a.asin, b.asin].sort().join('_');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const slug = `${a.slug}-vs-${b.slug}`.substring(0, 95);
      const winner = a.discount_pct >= b.discount_pct ? a : b;
      const runnerUp = winner === a ? b : a;

      comparisons.push({
        slug,
        title: `${a.brand} ${a.title.split(' ').slice(0, 4).join(' ')} vs ${b.brand} ${b.title.split(' ').slice(0, 4).join(' ')}`,
        product_a: a,
        product_b: b,
        category: a.category,
        category_name: a.category_name,
        verdict: `Hardware Head-to-Head: The ${winner.brand} takes the lead with a ${winner.discount_pct}% discount (Save $${Math.round(winner.savings)}), while the ${runnerUp.brand} remains an excellent high-performance contender at $${runnerUp.current_price}.`,
        winner_asin: winner.asin,
        created_at: new Date().toISOString()
      });
    }
  }
}

fs.writeFileSync(compPath, JSON.stringify(comparisons, null, 2));
console.log(`⚔️ Generated ${comparisons.length} hardware showdowns to ${compPath}!`);
