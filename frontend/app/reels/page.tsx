'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Heart, Share2, MessageSquare, MapPin, Bed, Square,
  Volume2, VolumeX, ChevronUp, ChevronDown, Shield, Play
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Property } from '@/types';
import toast from 'react-hot-toast';

export default function ReelsPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  const { data } = useQuery({
    queryKey: ['reels'],
    queryFn: () => api.get('/properties/reels?limit=20').then(r => r.data.data as Property[])
  });

  const properties = data || [];

  useEffect(() => {
    const videos = videoRefs.current;
    videos.forEach((video, index) => {
      if (index === current) {
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [current]);

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && current < properties.length - 1) setCurrent(c => c + 1);
    if (direction === 'up' && current > 0) setCurrent(c => c - 1);
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) handleScroll('down');
      else handleScroll('up');
    };
    const el = containerRef.current;
    el?.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [current, properties.length]);

  const handleLike = (id: string) => {
    setLiked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); toast.success('Added to favourites!'); }
      return next;
    });
  };

  if (!properties.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-xl">No reels available yet</p>
        </div>
      </div>
    );
  }

  const property = properties[current];

  return (
    <div ref={containerRef} className="h-screen w-full bg-black overflow-hidden relative select-none">
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          {property.videos?.[0] ? (
            <video
              ref={el => { if (el) videoRefs.current.set(current, el); }}
              src={property.videos[0]}
              className="w-full h-full object-cover"
              loop
              muted={muted}
              playsInline
            />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-safe">
        <div className="flex items-center justify-between p-4">
          <div className="text-white font-bold text-xl">SuratEstate Reels</div>
          <div className="flex gap-1">
            {properties.map((_, i) => (
              <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i === current ? 'bg-white' : 'bg-white/30'}`}
                style={{ width: `${100 / Math.min(properties.length, 10)}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Property Info */}
      <motion.div
        key={`info-${current}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-safe"
      >
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            {property.isVerified && (
              <div className="flex items-center gap-1 text-blue-400 text-xs mb-2">
                <Shield className="w-3 h-3" /> Verified Listing
              </div>
            )}
            <h2 className="text-white text-xl font-bold mb-1 line-clamp-2">{property.title}</h2>
            <div className="flex items-center gap-1 text-white/80 text-sm mb-2">
              <MapPin className="w-3.5 h-3.5" /> {property.location.area}, Surat
            </div>
            <div className="text-2xl font-bold text-yellow-400 mb-3">{formatPrice(property.price)}</div>
            <div className="flex gap-3 text-white/80 text-sm">
              {property.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {property.bedrooms} BHK</span>}
              <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" /> {property.area} sqft</span>
              <span className="capitalize bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs">{property.listingType}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-5 items-center">
            <button onClick={() => handleLike(property._id)} className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${liked.has(property._id) ? 'bg-red-500 scale-110' : 'bg-white/20'}`}>
                <Heart className={`w-6 h-6 ${liked.has(property._id) ? 'text-white fill-white' : 'text-white'}`} />
              </div>
              <span className="text-white text-xs">{liked.has(property._id) ? 'Liked' : 'Like'}</span>
            </button>
            <button onClick={() => router.push(`/properties/${property._id}`)} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs">Details</span>
            </button>
            <button onClick={() => navigator.share?.({ url: window.location.href })} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs">Share</span>
            </button>
            {property.videos?.[0] && (
              <button onClick={() => setMuted(m => !m)} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {muted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                </div>
                <span className="text-white text-xs">{muted ? 'Unmute' : 'Mute'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Hints */}
        <div className="flex justify-center gap-6 mt-4">
          <button onClick={() => handleScroll('up')} disabled={current === 0}
            className="text-white/50 disabled:opacity-20 flex items-center gap-1 text-xs">
            <ChevronUp className="w-4 h-4" /> Previous
          </button>
          <button onClick={() => handleScroll('down')} disabled={current === properties.length - 1}
            className="text-white/50 disabled:opacity-20 flex items-center gap-1 text-xs">
            Next <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
