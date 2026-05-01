'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Square, Heart, Shield, Eye, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Property } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  property: Property;
  compact?: boolean;
}

export default function PropertyCard({ property, compact = false }: Props) {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState(
    user?.savedProperties?.includes(property._id) || false
  );
  const [imgError, setImgError] = useState(false);

  const image = !imgError && property.images?.[0]
    ? property.images[0]
    : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600';

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login to save'); return; }
    try {
      await api.post(`/users/save/${property._id}`);
      setSaved(!saved);
      toast.success(saved ? 'Removed from saved' : 'Saved!');
    } catch { toast.error('Something went wrong'); }
  };

  return (
    <Link href={`/properties/${property._id}`}>
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border dark:border-gray-800 cursor-pointer group"
      >
        {/* Image */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <Image
            src={image}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
              property.listingType === 'buy' ? 'bg-blue-600 text-white' :
                property.listingType === 'rent' ? 'bg-green-600 text-white' :
                  'bg-purple-600 text-white'
            }`}>
              {property.listingType}
            </span>
            {property.isVerified && (
              <span className="flex items-center gap-1 bg-white/90 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
            {property.isFeatured && (
              <span className="bg-yellow-500 text-black text-xs px-2.5 py-1 rounded-full font-semibold">⭐ Featured</span>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>

          {/* Price */}
          <div className="absolute bottom-3 left-3">
            <div className="text-white font-bold text-lg drop-shadow">{formatPrice(property.price)}</div>
            {property.priceUnit !== 'total' && (
              <div className="text-white/80 text-xs">{property.priceUnit.replace(/_/g, ' ')}</div>
            )}
          </div>

          {/* Views */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white/80 text-xs">
            <Eye className="w-3 h-3" /> {property.viewCount}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
            {property.title}
          </h3>

          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{property.location.area}, Surat</span>
          </div>

          {!compact && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              {property.bedrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" /> {property.bedrooms} BHK
                </span>
              )}
              {property.bathrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5" /> {property.bathrooms}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Square className="w-3.5 h-3.5" /> {property.area.toLocaleString()} sqft
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                {(property.owner as any)?.name?.[0] || 'O'}
              </div>
              <span className="text-xs text-gray-500">{(property.owner as any)?.name || 'Owner'}</span>
            </div>
            <div className="flex items-center gap-2">
              {property.fraudScore !== undefined && property.fraudScore < 20 && (
                <div className="flex items-center gap-0.5 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3" /> Low Risk
                </div>
              )}
              <span className="text-xs text-gray-400">{formatRelativeTime(property.createdAt)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
