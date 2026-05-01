'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SURAT_AREAS, AMENITIES_LIST } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import type { PropertyFilters } from '@/types';

interface Props {
  currentFilters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export default function PropertyFiltersPanel({ currentFilters, onFiltersChange }: Props) {
  const [filters, setFilters] = useState<PropertyFilters>(currentFilters);

  const update = (key: keyof PropertyFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const apply = () => onFiltersChange(filters);
  const reset = () => {
    const empty: PropertyFilters = { listingType: 'buy', page: 1, limit: 18 };
    setFilters(empty);
    onFiltersChange(empty);
  };

  const toggleArea = (area: string) => {
    const current = filters.area || [];
    const updated = current.includes(area as any)
      ? current.filter(a => a !== area)
      : [...current, area as any];
    update('area', updated.length ? updated : undefined);
  };

  const toggleBedroom = (n: number) => {
    const current = filters.bedrooms || [];
    const updated = current.includes(n)
      ? current.filter(b => b !== n)
      : [...current, n];
    update('bedrooms', updated.length ? updated : undefined);
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Listing Type */}
      <div>
        <label className="font-medium block mb-2">Listing Type</label>
        <div className="flex gap-2">
          {['buy', 'rent', 'lease'].map(t => (
            <button key={t} onClick={() => update('listingType', t)}
              className={`flex-1 py-2 rounded-xl capitalize border transition-all ${filters.listingType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="font-medium block mb-2">Property Type</label>
        <div className="flex flex-wrap gap-2">
          {['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'].map(t => (
            <button key={t} onClick={() => update('type', filters.type === t ? undefined : t as any)}
              className={`px-3 py-1.5 rounded-xl capitalize border transition-all text-xs ${filters.type === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="font-medium block mb-2">Price Range</label>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">Min: {filters.minPrice ? formatPrice(filters.minPrice) : 'Any'}</div>
            <input type="range" min={0} max={50000000} step={500000}
              value={filters.minPrice || 0}
              onChange={e => update('minPrice', Number(e.target.value) || undefined)}
              className="w-full accent-blue-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Max: {filters.maxPrice ? formatPrice(filters.maxPrice) : 'Any'}</div>
            <input type="range" min={0} max={100000000} step={1000000}
              value={filters.maxPrice || 100000000}
              onChange={e => update('maxPrice', Number(e.target.value) === 100000000 ? undefined : Number(e.target.value))}
              className="w-full accent-blue-600" />
          </div>
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="font-medium block mb-2">Bedrooms</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => toggleBedroom(n)}
              className={`w-10 h-10 rounded-xl border transition-all ${(filters.bedrooms || []).includes(n) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700'}`}>
              {n}+
            </button>
          ))}
        </div>
      </div>

      {/* Areas */}
      <div>
        <label className="font-medium block mb-2">Areas</label>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {SURAT_AREAS.map(area => (
            <button key={area} onClick={() => toggleArea(area)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${(filters.area || []).includes(area as any) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700'}`}>
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Furnishing */}
      <div>
        <label className="font-medium block mb-2">Furnishing</label>
        <div className="flex flex-col gap-1.5">
          {['unfurnished', 'semi-furnished', 'fully-furnished'].map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-blue-600"
                checked={(filters.furnishing || []).includes(f)}
                onChange={e => {
                  const curr = filters.furnishing || [];
                  update('furnishing', e.target.checked ? [...curr, f] : curr.filter(x => x !== f));
                }} />
              <span className="capitalize">{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Verified Only */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-blue-600"
            checked={filters.isVerified || false}
            onChange={e => update('isVerified', e.target.checked || undefined)} />
          <span className="font-medium">Verified Listings Only</span>
        </label>
      </div>

      {/* Sort */}
      <div>
        <label className="font-medium block mb-2">Sort By</label>
        <select value={filters.sortBy || 'newest'} onChange={e => update('sortBy', e.target.value as any)}
          className="w-full border dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 outline-none">
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
          <option value="area_asc">Area: Small to Large</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={reset}>Reset</Button>
        <Button size="sm" className="flex-1" onClick={apply}>Apply Filters</Button>
      </div>
    </div>
  );
}
