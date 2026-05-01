'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import type { Property } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  property: Property;
  onClose: () => void;
}

const TIME_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export default function ScheduleVisit({ property, onClose }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const minDate = new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0];
  const maxDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }
    setLoading(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      await api.post('/visits', {
        propertyId: property._id,
        scheduledAt,
        notes
      });
      toast.success('Visit scheduled! Owner will confirm shortly.');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule visit');
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
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Schedule a Visit</h2>
            <p className="text-green-200 text-sm truncate max-w-xs">{property.title}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4 text-green-600" /> Select Date
            </label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              required
              className="w-full border dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Clock className="w-4 h-4 text-green-600" /> Select Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2 rounded-xl text-sm border transition-all ${
                    selectedTime === slot
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-4 h-4 text-green-600" /> Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any specific requirements or questions..."
              className="w-full border dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-green-500 resize-none"
            />
          </div>

          {selectedDate && selectedTime && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-sm">
              <div className="font-medium text-green-800 dark:text-green-300">Visit Summary</div>
              <div className="text-green-700 dark:text-green-400 mt-1">
                {new Date(`${selectedDate}T${selectedTime}:00`).toLocaleString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700" size="lg">
            {loading ? 'Scheduling...' : 'Confirm Visit'}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
