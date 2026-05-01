'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import type { Property } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  property: Property;
  onClose: () => void;
}

export default function NegotiationModal({ property, onClose }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [offer, setOffer] = useState(Math.round(property.price * 0.9));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const discount = ((property.price - offer) / property.price * 100).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    try {
      await api.post('/negotiations', {
        propertyId: property._id,
        offerAmount: offer,
        message
      });
      toast.success('Offer submitted! Owner will respond within 24 hours.');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Make an Offer</h2>
            <p className="text-purple-200 text-sm">Asking: {formatPrice(property.price)}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Make a reasonable offer. Typically buyers negotiate 5-15% below asking price.
                The seller will accept, reject, or counter your offer.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              Your Offer: <span className="text-purple-600 font-bold text-lg">{formatPrice(offer)}</span>
              {Number(discount) > 0 && (
                <span className="ml-2 text-sm text-green-600">({discount}% below asking)</span>
              )}
            </label>
            <input
              type="range"
              min={Math.round(property.price * 0.5)}
              max={property.price}
              step={50000}
              value={offer}
              onChange={e => setOffer(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatPrice(Math.round(property.price * 0.5))}</span>
              <span>{formatPrice(property.price)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Enter Custom Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input
                type="number"
                value={offer}
                onChange={e => setOffer(Number(e.target.value))}
                min={property.price * 0.3}
                max={property.price * 1.5}
                className="w-full pl-7 pr-4 py-2.5 border dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Message to Owner (Optional)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Explain your offer, e.g. 'Ready for immediate registration, flexible on possession date...'"
              className="w-full border dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {[
              { label: 'Your Offer', value: formatPrice(offer), color: 'text-purple-600' },
              { label: 'Savings', value: formatPrice(property.price - offer), color: 'text-green-600' },
              { label: 'Asking', value: formatPrice(property.price), color: 'text-gray-600' }
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className={`font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
            {loading ? 'Submitting...' : `Submit Offer of ${formatPrice(offer)}`}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
