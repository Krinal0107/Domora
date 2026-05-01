'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Map, List, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/PropertyCard';
import PropertyFilters from '@/components/PropertyFilters';
import PropertyMap from '@/components/PropertyMap';
import { api } from '@/lib/api';
import type { Property, PropertyFilters as Filters } from '@/types';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const getFiltersFromParams = (): Filters => ({
    listingType: searchParams.get('listingType') as Filters['listingType'] || 'buy',
    type: searchParams.get('type') as Filters['type'] || undefined,
    area: searchParams.get('area')?.split(',') as Filters['area'] || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    bedrooms: searchParams.get('bedrooms')?.split(',').map(Number) as Filters['bedrooms'] || undefined,
    isVerified: searchParams.get('isVerified') === 'true' || undefined,
    sortBy: searchParams.get('sortBy') as Filters['sortBy'] || 'newest',
    page,
    limit: 18
  });

  const filters = getFiltersFromParams();

  const { data, isLoading } = useQuery({
    queryKey: ['properties', filters, page],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
      return api.get(`/properties?${params}`).then(r => r.data);
    }
  });

  const properties: Property[] = data?.data || [];
  const total: number = data?.total || 0;
  const totalPages: number = data?.totalPages || 1;

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b sticky top-16 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-gray-800 dark:text-white">
              {total.toLocaleString()} Properties
            </span>
            {filters.area && <span className="text-gray-500 text-sm ml-2">in {Array.isArray(filters.area) ? filters.area.join(', ') : filters.area}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
            <div className="flex border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('map')}
                className={`p-2 ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600'}`}>
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-72 flex-shrink-0"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 sticky top-36">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filters</h3>
                    <button onClick={() => setFiltersOpen(false)}>
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <PropertyFilters
                    currentFilters={filters}
                    onFiltersChange={(newFilters) => {
                      const params = new URLSearchParams();
                      Object.entries(newFilters).forEach(([k, v]) => {
                        if (v !== undefined && v !== null) params.set(k, String(v));
                      });
                      router.push(`/properties?${params}`);
                      setPage(1);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1">
            {viewMode === 'map' ? (
              <div className="h-[calc(100vh-200px)] rounded-2xl overflow-hidden">
                <PropertyMap properties={properties} />
              </div>
            ) : (
              <>
                {isLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-80 animate-pulse" />
                    ))}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🏠</div>
                    <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                    <p className="text-gray-500">Try adjusting your filters</p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {properties.map((property, i) => (
                      <motion.div
                        key={property._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <PropertyCard property={property} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center">Loading...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}
