'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Property } from '@/types';

interface Props {
  property: Property;
}

export default function InvestmentCalculator({ property }: Props) {
  const [years, setYears] = useState(5);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/roi-predict', {
        area: property.location.area,
        type: property.type,
        purchasePrice: property.price,
        holdingYears: years
      });
      setResult(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" /> Investment Calculator
      </h2>

      <div className="space-y-4">
        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-600 dark:text-gray-400">Property Price</div>
          <div className="ml-auto font-bold text-blue-600">{formatPrice(property.price)}</div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">
            Investment Horizon: <span className="text-blue-600">{years} years</span>
          </label>
          <input type="range" min={1} max={20} value={years}
            onChange={e => setYears(Number(e.target.value))}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 year</span><span>20 years</span>
          </div>
        </div>

        <Button onClick={calculate} disabled={loading} className="w-full">
          {loading ? 'Calculating...' : 'Calculate ROI'}
        </Button>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Projected Value', value: formatPrice(result.projectedValue), color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
                { label: 'Appreciation', value: `+${result.appreciationPercent}%`, color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' },
                { label: 'Rental Yield', value: `${result.rentalYield}% p.a.`, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' },
                { label: 'Total ROI', value: `${result.totalROI}%`, color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' }
              ].map(s => (
                <div key={s.label} className={`p-3 rounded-xl ${s.color}`}>
                  <div className="font-bold text-sm">{s.value}</div>
                  <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {result.aiInsight && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm text-blue-800 dark:text-blue-300">
                <div className="font-semibold mb-1">🤖 AI Insight</div>
                {result.aiInsight}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
