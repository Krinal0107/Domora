'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Home, BarChart3, Calculator, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { AREA_INSIGHTS } from '@/lib/constants';
import type { AreaInsight } from '@/types';

export default function InvestmentPage() {
  const [selectedArea, setSelectedArea] = useState('Vesu');
  const [budget, setBudget] = useState(5000000);
  const [holdingYears, setHoldingYears] = useState(5);
  const [propertyType, setPropertyType] = useState('apartment');
  const [roiData, setRoiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const insight = AREA_INSIGHTS.find(a => a.area === selectedArea);

  const calcROI = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/roi-predict', {
        area: selectedArea, type: propertyType,
        purchasePrice: budget, holdingYears
      });
      setRoiData(res.data.data);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Investment Intelligence</h1>
            <p className="text-gray-500">AI-powered ROI predictions and market analytics for Surat real estate</p>
          </div>

          {/* Area Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {AREA_INSIGHTS.slice(0, 6).map((area, i) => (
              <motion.button
                key={area.area}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedArea(area.area)}
                className={`text-left p-5 rounded-2xl border-2 transition-all ${selectedArea === area.area ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent bg-white dark:bg-gray-900'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                      <MapPin className="w-3 h-3" /> Surat
                    </div>
                    <div className="font-bold text-lg">{area.area}</div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    {area.priceGrowth}%
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Buy</span>
                    <span className="font-medium">₹{area.avgPriceBuy}/sqft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Rent</span>
                    <span className="font-medium">₹{area.avgPriceRent}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Overall Score</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-blue-600">{area.overall}</span>
                      <span className="text-gray-400">/10</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* ROI Calculator */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" /> ROI Calculator
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Area</label>
                  <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 dark:bg-gray-800 dark:border-gray-700">
                    {AREA_INSIGHTS.map(a => <option key={a.area}>{a.area}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Property Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {['apartment', 'villa', 'plot', 'commercial'].map(t => (
                      <button key={t} onClick={() => setPropertyType(t)}
                        className={`px-4 py-2 rounded-xl text-sm capitalize border transition-all ${propertyType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Investment Budget: <span className="text-blue-600 font-bold">{formatPrice(budget)}</span>
                  </label>
                  <input type="range" min={1000000} max={50000000} step={500000}
                    value={budget} onChange={e => setBudget(Number(e.target.value))}
                    className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>₹10L</span><span>₹5Cr</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Holding Period: <span className="text-blue-600 font-bold">{holdingYears} years</span>
                  </label>
                  <input type="range" min={1} max={20} value={holdingYears}
                    onChange={e => setHoldingYears(Number(e.target.value))}
                    className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 yr</span><span>20 yrs</span>
                  </div>
                </div>

                <Button onClick={calcROI} disabled={loading} className="w-full" size="lg">
                  {loading ? 'Calculating...' : 'Calculate ROI'}
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {roiData ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Projected Value', value: formatPrice(roiData.projectedValue), icon: Home, color: 'text-blue-600 bg-blue-100' },
                      { label: 'Total Appreciation', value: `+${roiData.appreciationPercent}%`, icon: TrendingUp, color: 'text-green-600 bg-green-100' },
                      { label: 'Rental Yield', value: `${roiData.rentalYield}% p.a.`, icon: DollarSign, color: 'text-purple-600 bg-purple-100' },
                      { label: 'Total ROI', value: `${roiData.totalROI}%`, icon: BarChart3, color: 'text-orange-600 bg-orange-100' }
                    ].map(stat => (
                      <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {roiData.aiInsight && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
                      <div className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">🤖 AI Insight</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{roiData.aiInsight}</p>
                    </div>
                  )}

                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold mb-3">Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Purchase Price', value: formatPrice(roiData.purchasePrice) },
                        { label: 'Projected Value', value: formatPrice(roiData.projectedValue) },
                        { label: `Monthly Rent (${selectedArea})`, value: `₹${roiData.monthlyRent?.toLocaleString('en-IN')}/mo` },
                        { label: `Annual Rental Income`, value: formatPrice(roiData.annualRent) },
                        { label: 'Holding Period', value: `${roiData.holdingYears} years` }
                      ].map(row => (
                        <div key={row.label} className="flex justify-between">
                          <span className="text-gray-500">{row.label}</span>
                          <span className="font-medium">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : insight && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">{selectedArea} Overview</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{insight.description}</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Connectivity', value: insight.connectivity },
                      { label: 'Safety', value: insight.safety },
                      { label: 'Amenities', value: insight.amenities },
                      { label: 'Schools', value: insight.schools },
                      { label: 'Hospitals', value: insight.hospitals }
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{s.label}</span><span className="font-medium">{s.value}/10</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${s.value * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
