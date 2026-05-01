'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, MapPin, TrendingUp, Shield, Zap, Brain, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PropertyCard from '@/components/PropertyCard';
import AreaInsights from '@/components/AreaInsights';
import AIChat from '@/components/AIChat';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Property } from '@/types';

const LISTING_TYPES = ['buy', 'rent', 'lease'];
const QUICK_AREAS = ['Vesu', 'Adajan', 'Piplod', 'City Light', 'Dumas', 'Althan'];
const STATS = [
  { value: '50,000+', label: 'Properties Listed' },
  { value: '12,000+', label: 'Happy Buyers' },
  { value: '₹2,500 Cr', label: 'Deals Closed' },
  { value: '19', label: 'Areas Covered' }
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const { data: featuredData } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => api.get('/properties/featured').then(r => r.data.data as Property[])
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ listingType: activeTab });
    if (searchQuery) params.set('search', searchQuery);
    router.push(`/properties?${params}`);
  };

  const handleAreaClick = (area: string) => {
    router.push(`/properties?area=${area}&listingType=${activeTab}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 container mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm mb-6"
          >
            <Brain className="w-4 h-4 text-yellow-400" />
            AI-Powered Real Estate for Surat
            <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full font-semibold">NEW</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Find Your Dream
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Home in Surat
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            AI-powered recommendations, blockchain-verified listings, and real-time market insights for Surat's top localities.
          </p>

          {/* Search Box */}
          <div className="max-w-3xl mx-auto">
            <div className="flex mb-4 bg-white/10 backdrop-blur-sm rounded-full p-1 w-fit mx-auto border border-white/20">
              {LISTING_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold capitalize transition-all ${activeTab === t ? 'bg-white text-blue-900' : 'text-white hover:bg-white/20'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-2 flex gap-2 items-center">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by area, locality, project name..."
                  className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent text-base"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {QUICK_AREAS.map(area => (
                <button
                  key={area}
                  onClick={() => handleAreaClick(area)}
                  className="flex items-center gap-1 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full border border-white/20 transition-all"
                >
                  <MapPin className="w-3 h-3" />
                  {area}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center text-white"
              >
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose SuratEstate?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">The most advanced real estate platform in Surat, powered by AI and blockchain technology.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: 'AI Property Advisor', desc: 'Get personalized recommendations based on your budget, preferences, and investment goals.', color: 'text-purple-600 bg-purple-100' },
              { icon: Shield, title: 'Blockchain Verified', desc: 'Every listing verified on Solana blockchain. No frauds, no duplicates, full ownership transparency.', color: 'text-blue-600 bg-blue-100' },
              { icon: TrendingUp, title: 'ROI Intelligence', desc: 'Real-time market data and AI-powered ROI predictions for every area in Surat.', color: 'text-green-600 bg-green-100' },
              { icon: MapPin, title: 'Hyperlocal Insights', desc: 'Deep insights for every Surat locality — connectivity, safety, amenities, schools, and hospitals.', color: 'text-orange-600 bg-orange-100' },
              { icon: Zap, title: 'Real-Time Updates', desc: 'Instant notifications for new listings, price drops, and availability changes.', color: 'text-yellow-600 bg-yellow-100' },
              { icon: Search, title: 'Smart Search', desc: 'Natural language search. Just ask "Best 2BHK under 50L in Vesu" and get instant results.', color: 'text-red-600 bg-red-100' }
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredData && featuredData.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-bold">Featured Properties</h2>
                <p className="text-gray-500 mt-2">Hand-picked premium listings across Surat</p>
              </div>
              <Button variant="outline" onClick={() => router.push('/properties')}>View All</Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredData.slice(0, 6).map((property, i) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Area Insights */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Surat Locality Intelligence</h2>
            <p className="text-gray-500">Comprehensive insights for every major area</p>
          </motion.div>
          <AreaInsights />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Find Your Perfect Property?</h2>
            <p className="text-blue-200 mb-8 max-w-xl mx-auto">
              Talk to our AI advisor or browse thousands of verified listings in Surat.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 rounded-xl px-8"
                onClick={() => router.push('/properties')}>
                Browse Properties
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-xl px-8"
                onClick={() => setChatOpen(true)}>
                <Brain className="w-5 h-5 mr-2" /> Ask AI Advisor
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold gradient-text mb-3">SuratEstate</div>
              <p className="text-gray-400 text-sm">Next-generation real estate platform for Surat, Gujarat.</p>
            </div>
            {[
              { title: 'Quick Links', links: ['Properties', 'Investment', 'Reels', 'Map Search'] },
              { title: 'Areas', links: ['Vesu', 'Adajan', 'City Light', 'Dumas', 'Piplod'] },
              { title: 'Company', links: ['About', 'Contact', 'Privacy', 'Terms'] }
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            © 2024 SuratEstate. All rights reserved. Built with ❤️ for Surat.
          </div>
        </div>
      </footer>

      {/* AI Chat */}
      {chatOpen && <AIChat onClose={() => setChatOpen(false)} />}

      {/* Floating AI Button */}
      {!chatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-colors"
        >
          <Brain className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}
