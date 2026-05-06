'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Home, TrendingUp, MessageSquare, Calendar, Eye,
  Users, FileText, Bell, Plus, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import type { Property, Lead, Visit } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!user) router.push('/login?redirect=/dashboard');
  }, [user]);

  const { data: listings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/properties/my-listings').then(r => r.data.data as Property[]),
    enabled: !!user
  });

  const { data: leadsData } = useQuery({
    queryKey: ['my-leads'],
    queryFn: () => api.get('/leads/my-leads?limit=5').then(r => r.data),
    enabled: !!user
  });

  const { data: visitsData } = useQuery({
    queryKey: ['my-visits'],
    queryFn: () => api.get('/visits/my?limit=5').then(r => r.data.data as Visit[]),
    enabled: !!user
  });

  const leads: Lead[] = leadsData?.data || [];
  const visits: Visit[] = visitsData || [];
  const totalViews = listings?.reduce((sum, p) => sum + p.viewCount, 0) || 0;

  const stats = [
    { label: 'My Listings', value: listings?.length || 0, icon: Home, color: 'text-blue-600 bg-blue-100', link: '/dashboard/listings' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-purple-600 bg-purple-100', link: '#' },
    { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-green-600 bg-green-100', link: '/dashboard/leads' },
    { label: 'Upcoming Visits', value: visits.filter(v => v.status === 'scheduled').length, icon: Calendar, color: 'text-orange-600 bg-orange-100', link: '/dashboard/visits' }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
            <p className="text-gray-500 mt-1">{user.role === 'broker' ? 'Broker Dashboard' : 'Property Owner Dashboard'}</p>
          </div>
          <Button onClick={() => router.push('/dashboard/list-property')}>
            <Plus className="w-4 h-4 mr-2" /> List Property
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={stat.link}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow block">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Listings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Listings</h2>
              <Link href="/dashboard/listings" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {!listings?.length ? (
              <div className="text-center py-8 text-gray-500">
                <Home className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No listings yet</p>
                <Button size="sm" className="mt-3" onClick={() => router.push('/dashboard/list-property')}>
                  List your first property
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.slice(0, 5).map(p => (
                  <Link key={p._id} href={`/properties/${p._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{p.title}</div>
                      <div className="text-xs text-gray-500">{p.location.area} · {formatPrice(p.price)}</div>
                      <div className={`text-xs mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        p.status === 'active' ? 'bg-green-100 text-green-700' :
                          p.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-gray-500"><Eye className="w-3 h-3" />{p.viewCount}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Leads */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Leads</h2>
              <Link href="/dashboard/leads" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {!leads.length ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No leads yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map(lead => {
                  const buyerInfo = typeof lead.buyer === 'object' ? lead.buyer : null;
                  const buyerName = buyerInfo?.name || 'Unknown';
                  const buyerPhone = buyerInfo?.phone || '';
                  return (
                    <div key={lead._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {buyerName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{buyerName}</div>
                        <div className="text-xs text-gray-500">{buyerPhone}</div>
                        <div className="text-xs text-gray-400 truncate">{(lead.property as any)?.title}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          lead.status === 'new' ? 'bg-yellow-100 text-yellow-700' :
                            lead.status === 'converted' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                        }`}>
                          {lead.status}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">{formatRelativeTime(lead.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Visits */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upcoming Visits</h2>
              <Link href="/dashboard/visits" className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {visits.filter(v => v.status === 'scheduled').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No upcoming visits</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visits.filter(v => v.status === 'scheduled').slice(0, 4).map(visit => (
                  <div key={visit._id} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{(visit.visitor as any)?.name}</div>
                      <div className="text-xs text-gray-500">{(visit.property as any)?.title}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{new Date(visit.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      <div className="text-gray-500 text-xs">{new Date(visit.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'List Property', icon: Plus, href: '/dashboard/list-property', color: 'bg-blue-600 text-white' },
                { label: 'Upload KYC', icon: FileText, href: '/dashboard/kyc', color: 'bg-purple-600 text-white' },
                { label: 'View Negotiations', icon: TrendingUp, href: '/dashboard/negotiations', color: 'bg-green-600 text-white' },
                { label: 'Messages', icon: MessageSquare, href: '/chat', color: 'bg-orange-600 text-white' }
              ].map(action => (
                <Link key={action.label} href={action.href}
                  className={`flex items-center gap-3 p-4 rounded-xl ${action.color} hover:opacity-90 transition-opacity`}>
                  <action.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
