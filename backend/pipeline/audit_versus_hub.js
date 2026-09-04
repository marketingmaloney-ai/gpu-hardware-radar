const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../..');
const dealsPath = path.join(BASE_DIR, 'data/deals.json');
const compPath = path.join(BASE_DIR, 'data/comparisons.json');
const bestPath = path.join(BASE_DIR, 'data/clark_best_deals.json');

console.log('🛡️ RUNNING 14-POINT ZERO-DEFECT AUDIT GATE FOR GPU HARDWARE RADAR...\n');

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name} - ${detail}`);
    failed++;
  }
}

const deals = JSON.parse(fs.readFileSync(dealsPath, 'utf-8'));
const comps = JSON.parse(fs.readFileSync(compPath, 'utf-8'));
const best = JSON.parse(fs.readFileSync(bestPath, 'utf-8'));

// 1. Comparisons Dataset Exists
check('Comparisons Showdowns Scale (>= 10)', comps.length >= 10, `Found ${comps.length}`);

// 2. ASIN Integrity
const invalidAsins = deals.filter(d => !d.asin || d.asin.length < 8);
check('ASIN Integrity (100% valid)', invalidAsins.length === 0, `Found ${invalidAsins.length} invalid`);

// 3. Affiliate Attribution (priceradar04-20)
const missingTag = deals.filter(d => !d.affiliate_url || !d.affiliate_url.includes('tag=priceradar04-20'));
check('Affiliate Tag Attribution (100% tag=priceradar04-20)', missingTag.length === 0, `Found ${missingTag.length} missing tag`);

// 4. Valid Benchmark Prices
const invalidPrices = deals.filter(d => !d.current_price || d.current_price <= 0 || !d.regular_price || d.regular_price <= 0);
check('Valid Benchmark Prices (100% positive)', invalidPrices.length === 0, `Found ${invalidPrices.length}`);

// 5. Computed Net Savings
const invalidSavings = deals.filter(d => d.savings < 0 || d.discount_pct < 0);
check('Computed Net Savings Integrity', invalidSavings.length === 0, `Found ${invalidSavings.length}`);

// 6. Catalog Scale
check('Catalog Scale (>= 40 items)', deals.length >= 40, `Found ${deals.length}`);

// 7. Honest Badging Tiers
const validTiers = ['historic_low_90d', 'historic_low_30d', 'limited_time_deal', 'verified_markdown', 'featured_hardware', 'staff_pick'];
const invalidTiers = deals.filter(d => !validTiers.includes(d.badge_tier));
check('Honest Badging Tiers', invalidTiers.length === 0, `Found ${invalidTiers.length}`);

// 8. Zero Price Inflation Filter
const inflated = deals.filter(d => d.current_price > d.regular_price);
check('Zero Price Inflation (100% current <= regular)', inflated.length === 0, `Found ${inflated.length}`);

// 9. Multi-Word Title Integrity
const shortTitles = deals.filter(d => d.title.split(' ').length < 3);
check('Multi-Word Product Titles (3+ words)', shortTitles.length === 0, `Found ${shortTitles.length}`);

// 10. Staff Picks Department Diversity
const staffCategories = new Set(best.map(b => b.category));
check('Staff Picks Category Breadth (>= 4 departments)', staffCategories.size >= 4, `Found ${staffCategories.size}`);

// 11. Unique Slugs
const slugs = deals.map(d => d.slug);
const duplicateSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
check('Slug Uniqueness (100% unique slugs)', duplicateSlugs.length === 0, `Found duplicates: ${duplicateSlugs.join(', ')}`);

// 12. Rating Integrity
const invalidRatings = deals.filter(d => !d.rating || isNaN(d.rating) || d.rating < 3.0 || d.rating > 5.0);
check('Rating Range Integrity (3.0 - 5.0)', invalidRatings.length === 0, `Found ${invalidRatings.length}`);

// 13. High-Res Image Protocol
const missingImages = deals.filter(d => !d.image_url || d.image_url.length < 10);
check('Image URL Presence (100%)', missingImages.length === 0, `Found ${missingImages.length}`);

// 14. Network Sister Sites Cross-Link Config
const siteConfig = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'site_config.json'), 'utf-8'));
check('Sister Sites Configured (>= 3 network sites)', siteConfig.network_sites && siteConfig.network_sites.length >= 3);

console.log(`\n======================================================`);
console.log(`🎯 AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
console.log(`======================================================\n`);

if (failed > 0) process.exit(1);
