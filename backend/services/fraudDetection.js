const { AREA_INSIGHTS } = require('../utils/areaData');

async function analyze(propertyData) {
  let score = 0;
  const flags = [];

  const insight = AREA_INSIGHTS.find(a => a.area === propertyData.location?.area);
  if (insight) {
    const pricePerSqft = propertyData.price / Math.max(propertyData.area, 1);
    const expectedMin = insight.avgPriceBuy * 0.3;
    const expectedMax = insight.avgPriceBuy * 3;

    if (pricePerSqft < expectedMin) {
      score += 35;
      flags.push('price_suspiciously_low');
    } else if (pricePerSqft > expectedMax) {
      score += 20;
      flags.push('price_above_market');
    }
  }

  const title = propertyData.title?.toLowerCase() || '';
  const desc = propertyData.description?.toLowerCase() || '';
  const urgencyWords = ['urgent', 'emergency', 'going abroad', 'leaving india', 'distress'];
  if (urgencyWords.some(w => title.includes(w) || desc.includes(w))) {
    score += 20;
    flags.push('urgency_language');
  }

  if (!propertyData.images || propertyData.images.length === 0) {
    score += 10;
    flags.push('no_images');
  }

  if (propertyData.area > 10000 && propertyData.type === 'apartment') {
    score += 15;
    flags.push('unrealistic_apartment_size');
  }

  if (propertyData.listingType === 'rent' && propertyData.price < 2000) {
    score += 25;
    flags.push('rent_too_low');
  }

  return { score: Math.min(score, 100), flags };
}

module.exports = { analyze };
