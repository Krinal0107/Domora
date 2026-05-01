'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Users, Home, FileText, CheckCircle, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'kyc' | 'users'>('overview');

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
    if (!user) router.push('/login');
  }, [user]);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data.data),
    enabled: user?.role === 'admin'
  });

  const { data: pendingListings } = useQuery({
    queryKey: ['admin-pending-listings'],
    queryFn: () => api.get('/admin/properties/pending').then(r => r.data.data),
    enabled: user?.role === 'admin' && activeTab === 'listings'
  });

  const { data: pendingKYC } = useQuery({
    queryKey: ['admin-pending-kyc'],
    queryFn: () => api.get('/kyc/pending').then(r => r.data.data),
    enabled: user?.role === 'admin' && activeTab === 'kyc'
  });

  const verifyListingMutation = useMutation({
    mutationFn: ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) =>
      api.put(`/admin/properties/${id}/verify`, { approved, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Done');
    }
  });

  const reviewKYCMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.put(`/kyc/${id}/review`, { status, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-kyc'] });
      toast.success('KYC reviewed');
    }
  });

  if (!user || user.role !== 'admin') return null;

  const TABS = [
    { key: 'overview', label: 'Overview', icon: Home },
    { key: 'listings', label: 'Pending Listings', icon: Eye },
    { key: 'kyc', label: 'KYC Documents', icon: FileText },
    { key: 'users', label: 'Users', icon: Users }
  ];

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-gray-500 text-sm">Platform management & moderation</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Properties', value: stats.totalProperties, icon: Home, color: 'bg-blue-100 text-blue-700' },
                { label: 'Active Listings', value: stats.activeProperties, icon: CheckCircle, color: 'bg-green-100 text-green-700' },
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-purple-100 text-purple-700' },
                { label: 'Brokers', value: stats.totalBrokers, icon: Shield, color: 'bg-orange-100 text-orange-700' },
                { label: 'Pending KYC', value: stats.pendingKYC, icon: FileText, color: 'bg-red-100 text-red-700' },
                { label: 'Total Leads', value: stats.totalLeads, icon: Eye, color: 'bg-yellow-100 text-yellow-700' }
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-sm text-gray-500">{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Top Areas */}
            {stats.topAreas && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold mb-4">Top Areas by Listings</h2>
                <div className="space-y-3">
                  {stats.topAreas.slice(0, 5).map((area: any) => (
                    <div key={area._id} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">{area._id}</div>
                      <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${(area.count / stats.topAreas[0].count) * 100}%` }} />
                      </div>
                      <div className="text-sm text-gray-500 w-12 text-right">{area.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-4">
            {!pendingListings?.length ? (
              <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-900 rounded-2xl">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No pending listings</p>
              </div>
            ) : pendingListings.map((property: any) => (
              <div key={property._id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  {property.images?.[0] && (
                    <img src={property.images[0]} alt="" className="w-20 h-16 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{property.title}</div>
                    <div className="text-sm text-gray-500">{property.location?.area} · {formatPrice(property.price)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Owner: {property.owner?.name} ({property.owner?.email}) · KYC: {property.owner?.kycStatus}
                    </div>
                    {property.fraudScore > 30 && (
                      <div className="text-xs text-red-600 mt-1">⚠ Fraud Score: {property.fraudScore}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/properties/${property._id}`} target="_blank">
                      <Button size="sm" variant="outline"><Eye className="w-4 h-4" /></Button>
                    </Link>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => verifyListingMutation.mutate({ id: property._id, approved: true })}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive"
                      onClick={() => verifyListingMutation.mutate({ id: property._id, approved: false, notes: 'Rejected by admin' })}>
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="space-y-4">
            {!pendingKYC?.length ? (
              <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-900 rounded-2xl">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No pending KYC documents</p>
              </div>
            ) : pendingKYC.map((doc: any) => (
              <div key={doc._id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium">{doc.user?.name}</div>
                  <div className="text-sm text-gray-500">{doc.user?.email} · {doc.docType}</div>
                  <div className="text-xs text-gray-400">{formatRelativeTime(doc.createdAt)}</div>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"><Eye className="w-4 h-4 mr-1" /> View Doc</Button>
                </a>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => reviewKYCMutation.mutate({ id: doc._id, status: 'approved' })}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive"
                  onClick={() => reviewKYCMutation.mutate({ id: doc._id, status: 'rejected', reason: 'Document unclear' })}>
                  Reject
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
