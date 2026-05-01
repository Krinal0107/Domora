'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  MapPin, Bed, Bath, Square, Car, Calendar, Shield, Eye,
  Heart, Share2, Phone, MessageSquare, ChevronLeft, ChevronRight,
  CheckCircle, AlertTriangle, TrendingUp, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatArea, formatRelativeTime } from '@/lib/utils';
import ScheduleVisit from '@/components/ScheduleVisit';
import NegotiationModal from '@/components/NegotiationModal';
import LeadForm from '@/components/LeadForm';
import InvestmentCalculator from '@/components/InvestmentCalculator';
import type { Property } from '@/types';
import toast from 'react-hot-toast';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [imgIndex, setImgIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<'lead' | 'visit' | 'negotiation' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get(`/properties/${id}`).then(r => r.data.data as Property)
  });

  const property = data;

  const handleSave = async () => {
    if (!user) { router.push('/login'); return; }
    try {
      await api.post(`/users/save/${id}`);
      toast.success('Saved to favourites');
    } catch { toast.error('Please login to save'); }
  };

  const handleShare = () => {
    navigator.share?.({ title: property?.title, url: window.location.href });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!property) {
    return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Property not found</div>;
  }

  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'];

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button onClick={() => router.back()} className="hover:text-blue-600 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span>/</span>
          <span>{property.location.area}</span>
          <span>/</span>
          <span className="text-gray-800 dark:text-white truncate max-w-xs">{property.title}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-video group">
              <Image
                src={images[imgIndex]}
                alt={property.title}
                fill
                className="object-cover"
                priority
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setImgIndex(i => (i + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-white w-5' : 'bg-white/50'}`} />
                ))}
              </div>
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {property.isVerified && (
                  <span className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
                {property.isFeatured && (
                  <span className="bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-medium">Featured</span>
                )}
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handleSave} className="bg-white/90 backdrop-blur-sm text-gray-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
                <button onClick={handleShare} className="bg-white/90 backdrop-blur-sm text-gray-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? 'border-blue-600' : 'border-transparent'}`}>
                    <Image src={img} alt="" width={80} height={64} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}

            {/* Property Info */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {property.location.address}, {property.location.area}, Surat
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{property.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="capitalize bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{property.type}</span>
                    <span className="capitalize bg-green-100 text-green-700 px-2 py-0.5 rounded">{property.listingType}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{property.viewCount} views</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{formatPrice(property.price)}</div>
                  {property.priceUnit !== 'total' && <div className="text-sm text-gray-500">{property.priceUnit.replace(/_/g, ' ')}</div>}
                  <div className="text-sm text-gray-500 mt-1">₹{Math.round(property.price / property.area).toLocaleString('en-IN')}/sqft</div>
                </div>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y dark:border-gray-700">
                {property.bedrooms !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Bed className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{property.bedrooms}</div>
                      <div className="text-gray-500 text-xs">Bedrooms</div>
                    </div>
                  </div>
                )}
                {property.bathrooms !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Bath className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{property.bathrooms}</div>
                      <div className="text-gray-500 text-xs">Bathrooms</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Square className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">{formatArea(property.area)}</div>
                    <div className="text-gray-500 text-xs">Carpet Area</div>
                  </div>
                </div>
                {property.parking !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Car className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold">{property.parking}</div>
                      <div className="text-gray-500 text-xs">Parking</div>
                    </div>
                  </div>
                )}
              </div>

              {/* More Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-sm">
                {[
                  { label: 'Furnishing', value: property.furnishing },
                  { label: 'Facing', value: property.facing },
                  { label: 'Floor', value: property.floor !== undefined ? `${property.floor}/${property.totalFloors}` : '—' },
                  { label: 'Property Age', value: property.age === 0 ? 'New' : `${property.age} yrs` },
                  { label: 'Listed', value: formatRelativeTime(property.createdAt) },
                  { label: 'Status', value: property.status }
                ].map(d => d.value && (
                  <div key={d.label}>
                    <div className="text-gray-500">{d.label}</div>
                    <div className="font-medium capitalize">{d.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map(a => (
                    <span key={a} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fraud Score */}
            {property.fraudScore !== undefined && (
              <div className={`bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border-l-4 ${property.fraudScore < 20 ? 'border-green-500' : property.fraudScore < 50 ? 'border-yellow-500' : 'border-red-500'}`}>
                <div className="flex items-center gap-3">
                  {property.fraudScore < 20 ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                  <div>
                    <h3 className="font-semibold">AI Risk Assessment</h3>
                    <p className="text-sm text-gray-500">
                      {property.fraudScore < 20 ? 'Low risk — Listing appears genuine' :
                        property.fraudScore < 50 ? 'Medium risk — Verify before proceeding' :
                          'High risk — Exercise caution'}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-bold">{100 - property.fraudScore}%</div>
                    <div className="text-xs text-gray-500">Trust Score</div>
                  </div>
                </div>
              </div>
            )}

            {/* Investment Calculator */}
            {property.listingType === 'buy' && (
              <InvestmentCalculator property={property} />
            )}
          </div>

          {/* Right Column — Contact */}
          <div className="space-y-4">
            {/* Owner/Broker Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {(property.owner as any)?.name?.[0] || 'O'}
                </div>
                <div>
                  <div className="font-semibold">{(property.owner as any)?.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{(property.owner as any)?.role}</div>
                  {(property.owner as any)?.isVerified && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                      <Shield className="w-3 h-3" /> KYC Verified
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full" onClick={() => setActiveModal('lead')}>
                  <Phone className="w-4 h-4 mr-2" /> Contact Owner
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setActiveModal('visit')}>
                  <Calendar className="w-4 h-4 mr-2" /> Schedule Visit
                </Button>
                {property.listingType === 'buy' && (
                  <Button variant="outline" className="w-full" onClick={() => setActiveModal('negotiation')}>
                    <TrendingUp className="w-4 h-4 mr-2" /> Make an Offer
                  </Button>
                )}
              </div>

              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="text-xs text-gray-400 text-center">
                  🔒 Your info is safe. We don't spam.
                </div>
              </div>
            </div>

            {/* Solana Verification */}
            {property.solanaTokenId && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-sm">On-Chain Verified</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Ownership and documents verified on Solana blockchain.
                </p>
                <div className="font-mono text-xs text-purple-700 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded truncate">
                  {property.solanaTokenId}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'lead' && (
        <LeadForm property={property} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'visit' && (
        <ScheduleVisit property={property} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'negotiation' && (
        <NegotiationModal property={property} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
