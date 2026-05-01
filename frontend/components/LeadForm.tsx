'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import type { Property } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  property: Property;
  onClose: () => void;
}

export default function LeadForm({ property, onClose }: Props) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: `I'm interested in "${property.title}"`
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leads', {
        propertyId: property._id,
        ...form
      });
      toast.success('Request sent! Owner will contact you soon.');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Contact Owner</h2>
            <p className="text-blue-200 text-sm">{formatPrice(property.price)} · {property.location.area}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-2.5 border dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
                type="tel"
                placeholder="+91 9876543210"
                className="w-full pl-10 pr-4 py-2.5 border dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                type="email"
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-2.5 border dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Message</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder="Write your message..."
                className="w-full pl-10 pr-4 py-2.5 border dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Sending...' : 'Send Request'}
          </Button>

          <p className="text-xs text-center text-gray-400">
            🔒 Your information is private and won't be shared with third parties.
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
