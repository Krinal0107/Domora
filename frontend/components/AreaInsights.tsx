'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MapPin, TrendingUp, Star, Home } from 'lucide-react';
import { AREA_INSIGHTS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import type { AreaInsight } from '@/types';

export default function AreaInsights() {
  const router = useRouter();
  const [selected, setSelected] = useState<AreaInsight | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {AREA_INSIGHTS.slice(0, 12).map((area, i) => (
          <motion.button
            key={area.area}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            viewport={{ once: true }}
            onClick={() => setSelected(area === selected ? null : area)}
            whileHover={{ y: -2 }}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              selected?.area === area.area
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-transparent bg-white dark:bg-gray-900 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-base">{area.area}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold">{area.overall}</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Buy</span>
                <span className="font-medium">₹{area.avgPriceBuy}/sqft</span>
              </div>
              <div className="flex justify-between">
                <span>Rent</span>
                <span className="font-medium">₹{area.avgPriceRent}/mo</span>
              </div>
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <TrendingUp className="w-3 h-3" />
                +{area.priceGrowth}% YoY
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selected Area Detail */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-900"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <MapPin className="w-4 h-4" /> Surat, Gujarat
              </div>
              <h3 className="text-2xl font-bold">{selected.area}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{selected.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{selected.overall}/10</div>
              <div className="text-sm text-gray-500">Overall Score</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Area Scores</h4>
              {[
                { label: 'Connectivity', value: selected.connectivity },
                { label: 'Safety', value: selected.safety },
                { label: 'Amenities', value: selected.amenities },
                { label: 'Schools', value: selected.schools },
                { label: 'Hospitals', value: selected.hospitals }
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{s.label}</span>
                    <span className="font-semibold">{s.value}/10</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.value * 10}%` }}
                      className={`h-full rounded-full ${s.value >= 8 ? 'bg-green-500' : s.value >= 6 ? 'bg-blue-500' : 'bg-orange-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Market Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Avg Buy Price', value: `₹${selected.avgPriceBuy}/sqft`, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Avg Monthly Rent', value: `₹${selected.avgPriceRent?.toLocaleString('en-IN')}`, color: 'bg-green-50 text-green-700' },
                  { label: 'Price Growth', value: `+${selected.priceGrowth}% p.a.`, color: 'bg-purple-50 text-purple-700' },
                  { label: 'Overall Score', value: `${selected.overall}/10`, color: 'bg-yellow-50 text-yellow-700' }
                ].map(stat => (
                  <div key={stat.label} className={`p-3 rounded-xl ${stat.color}`}>
                    <div className="font-bold text-sm">{stat.value}</div>
                    <div className="text-xs opacity-70 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push(`/properties?area=${selected.area}`)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                View Properties in {selected.area}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
