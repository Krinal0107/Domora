const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const OpenAI = require('openai');
const Property = require('../models/Property');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimit');
const { AREA_INSIGHTS } = require('../utils/areaData');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `You are an expert real estate advisor for Surat, Gujarat, India.
You help buyers, sellers, and brokers with property queries.
You know about all major areas of Surat: Vesu, Adajan, Piplod, Althan, City Light, Dumas, etc.
When recommending properties, be specific about area characteristics, price ranges, and investment potential.
Respond concisely in 2-4 sentences. If asked about listings, say you'll search the database.
Currency is INR. Price format: use L (lakh) or Cr (crore).`;

router.post('/chat',
  aiLimiter,
  optionalAuth,
  [body('message').trim().notEmpty().isLength({ max: 500 })],
  validate,
  async (req, res, next) => {
    try {
      const { message, history = [] } = req.body;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const reply = completion.choices[0].message.content;

      let properties = [];
      const keywords = ['2bhk', '3bhk', 'apartment', 'villa', 'plot', 'office', 'shop', 'commercial'];
      const hasPropertyQuery = keywords.some(k => message.toLowerCase().includes(k));

      if (hasPropertyQuery) {
        const priceMatch = message.match(/(\d+)\s*l/i);
        const areaMatch = AREA_INSIGHTS.find(a => message.toLowerCase().includes(a.area.toLowerCase()));
        const bedroomMatch = message.match(/(\d)bhk/i);

        const filter = { status: 'active' };
        if (priceMatch) filter.price = { $lte: Number(priceMatch[1]) * 100000 };
        if (areaMatch) filter['location.area'] = areaMatch.area;
        if (bedroomMatch) filter.bedrooms = Number(bedroomMatch[1]);

        properties = await Property.find(filter)
          .populate('owner', 'name avatar')
          .sort({ isVerified: -1, viewCount: -1 })
          .limit(5)
          .lean();
      }

      res.json({ success: true, reply, properties });
    } catch (err) { next(err); }
  }
);

router.post('/recommend',
  aiLimiter,
  optionalAuth,
  async (req, res, next) => {
    try {
      const { budget, type, area, bedrooms, purpose } = req.body;

      const filter = { status: 'active' };
      if (type) filter.type = type;
      if (area?.length) filter['location.area'] = { $in: area };
      if (bedrooms) filter.bedrooms = { $in: bedrooms };
      if (budget?.max) filter.price = { $lte: budget.max };
      if (budget?.min) filter.price = { ...filter.price, $gte: budget.min };

      const properties = await Property.find(filter)
        .populate('owner', 'name avatar phone')
        .sort({ isVerified: -1, fraudScore: 1, viewCount: -1 })
        .limit(20)
        .lean();

      const scored = properties.map(p => {
        let score = 50;
        if (p.isVerified) score += 20;
        if (p.fraudScore < 20) score += 10;
        if (area?.includes(p.location.area)) score += 10;
        if (p.bedrooms === bedrooms?.[0]) score += 5;
        if (p.amenities?.length > 5) score += 5;

        const insight = AREA_INSIGHTS.find(a => a.area === p.location.area);
        const reasons = [];
        if (p.isVerified) reasons.push('Verified listing');
        if (insight?.overall >= 8) reasons.push(`Top-rated area (${insight.overall}/10)`);
        if (insight?.priceGrowth > 10) reasons.push(`High price growth (${insight.priceGrowth}% YoY)`);
        if (p.fraudScore < 10) reasons.push('Low fraud risk');
        if (purpose === 'investment' && insight?.rentalYield > 4) reasons.push('Good rental yield');

        return { property: p, score, reasons, matchPercent: Math.min(score, 100) };
      });

      scored.sort((a, b) => b.score - a.score);
      res.json({ success: true, data: scored.slice(0, 10) });
    } catch (err) { next(err); }
  }
);

router.post('/roi-predict', aiLimiter, async (req, res, next) => {
  try {
    const { area, type, purchasePrice, holdingYears = 5 } = req.body;
    const insight = AREA_INSIGHTS.find(a => a.area === area);

    if (!insight) return res.status(400).json({ success: false, message: 'Area not found' });

    const annualGrowthRate = insight.priceGrowth / 100;
    const projectedValue = purchasePrice * Math.pow(1 + annualGrowthRate, holdingYears);
    const appreciation = projectedValue - purchasePrice;
    const appreciationPercent = (appreciation / purchasePrice) * 100;
    const monthlyRent = insight.avgPriceRent;
    const annualRent = monthlyRent * 12;
    const rentalYield = (annualRent / purchasePrice) * 100;
    const totalROI = ((appreciation + annualRent * holdingYears) / purchasePrice) * 100;

    const prompt = `Analyze investment for a ${type} in ${area}, Surat at ₹${(purchasePrice / 100000).toFixed(1)}L for ${holdingYears} years.
    Projected value: ₹${(projectedValue / 100000).toFixed(1)}L. Growth rate: ${insight.priceGrowth}%/year.
    Give a 2-sentence investment recommendation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200
    });

    res.json({
      success: true,
      data: {
        purchasePrice,
        projectedValue: Math.round(projectedValue),
        appreciation: Math.round(appreciation),
        appreciationPercent: appreciationPercent.toFixed(1),
        rentalYield: rentalYield.toFixed(2),
        monthlyRent,
        annualRent,
        totalROI: totalROI.toFixed(1),
        holdingYears,
        aiInsight: completion.choices[0].message.content,
        areaScore: insight.overall
      }
    });
  } catch (err) { next(err); }
});

router.get('/area-analysis/:area', aiLimiter, async (req, res, next) => {
  try {
    const insight = AREA_INSIGHTS.find(a => a.area === req.params.area);
    if (!insight) return res.status(404).json({ success: false, message: 'Area not found' });

    const recentSales = await Property.find({
      'location.area': req.params.area,
      status: { $in: ['active', 'sold'] }
    }).select('price area type listingType createdAt').sort({ createdAt: -1 }).limit(50).lean();

    res.json({ success: true, data: { insight, recentSales } });
  } catch (err) { next(err); }
});

module.exports = router;
