'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, X, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { SURAT_AREAS, AMENITIES_LIST } from '@/lib/constants';
import toast from 'react-hot-toast';

const STEPS = ['Basic Info', 'Location', 'Details', 'Amenities', 'Review'];

export default function ListPropertyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'apartment',
    listingType: 'buy',
    price: '',
    priceUnit: 'total',
    area: '',
    areaUnit: 'sqft',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    floor: '',
    totalFloors: '',
    furnishing: 'unfurnished',
    facing: 'East',
    age: '0',
    location: {
      address: '',
      area: 'Vesu',
      coordinates: { lat: '21.1497', lng: '72.7749' }
    },
    amenities: [] as string[],
    features: [] as string[]
  });

  const update = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const toggleAmenity = (a: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a]
    }));
  };

  const handleSubmit = async () => {
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        area: Number(form.area),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        parking: form.parking ? Number(form.parking) : undefined,
        floor: form.floor ? Number(form.floor) : undefined,
        totalFloors: form.totalFloors ? Number(form.totalFloors) : undefined,
        age: Number(form.age),
        location: {
          ...form.location,
          coordinates: {
            lat: Number(form.location.coordinates.lat),
            lng: Number(form.location.coordinates.lng)
          }
        }
      };

      const res = await api.post('/properties', payload);
      const propertyId = res.data.data._id;

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));
        await api.post(`/properties/${propertyId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Property listed successfully!');
      router.push(`/properties/${propertyId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to list property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">List Your Property</h1>
        <p className="text-gray-500 mb-8">Reach thousands of buyers and renters in Surat</p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full transition-all ${i <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`text-xs mt-1 text-center hidden sm:block ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="font-semibold text-lg">Basic Information</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Title</label>
                <input value={form.title} onChange={e => update('title', e.target.value)}
                  placeholder="e.g. Luxury 3BHK in Vesu near International School"
                  className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  rows={4} placeholder="Describe your property..."
                  className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Property Type</label>
                  <select value={form.type} onChange={e => update('type', e.target.value)}
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none">
                    {['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Listing For</label>
                  <select value={form.listingType} onChange={e => update('listingType', e.target.value)}
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none">
                    {['buy', 'rent', 'lease'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="font-semibold text-lg">Location Details</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Area</label>
                <select value={form.location.area}
                  onChange={e => setForm(f => ({ ...f, location: { ...f.location, area: e.target.value } }))}
                  className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none">
                  {SURAT_AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Address</label>
                <input value={form.location.address}
                  onChange={e => setForm(f => ({ ...f, location: { ...f.location, address: e.target.value } }))}
                  placeholder="Building, Street, Landmark"
                  className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Latitude</label>
                  <input value={form.location.coordinates.lat}
                    onChange={e => setForm(f => ({ ...f, location: { ...f.location, coordinates: { ...f.location.coordinates, lat: e.target.value } } }))}
                    placeholder="21.1497"
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Longitude</label>
                  <input value={form.location.coordinates.lng}
                    onChange={e => setForm(f => ({ ...f, location: { ...f.location, coordinates: { ...f.location.coordinates, lng: e.target.value } } }))}
                    placeholder="72.7749"
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="font-semibold text-lg">Property Details & Pricing</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => update('price', e.target.value)}
                    placeholder="5000000"
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price Unit</label>
                  <select value={form.priceUnit} onChange={e => update('priceUnit', e.target.value)}
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none">
                    <option value="total">Total</option>
                    <option value="per_sqft">Per Sqft</option>
                    <option value="per_month">Per Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Area (sqft)</label>
                  <input type="number" value={form.area} onChange={e => update('area', e.target.value)}
                    placeholder="1200"
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Furnishing</label>
                  <select value={form.furnishing} onChange={e => update('furnishing', e.target.value)}
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none">
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi-furnished">Semi-Furnished</option>
                    <option value="fully-furnished">Fully Furnished</option>
                  </select>
                </div>
                {form.type !== 'plot' && <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Bedrooms</label>
                    <input type="number" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)}
                      min="1" max="10" placeholder="3"
                      className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Bathrooms</label>
                    <input type="number" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)}
                      min="1" max="10" placeholder="2"
                      className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none" />
                  </div>
                </>}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Property Age (yrs)</label>
                  <input type="number" value={form.age} onChange={e => update('age', e.target.value)}
                    min="0" placeholder="0 = New"
                    className="w-full border dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 outline-none" />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Property Photos</label>
                <label className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload photos (max 20)</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />
                </label>
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="w-20 h-16 object-cover rounded-lg" />
                        <button onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="font-semibold text-lg">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {AMENITIES_LIST.map(a => (
                  <button key={a} onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${form.amenities.includes(a) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="font-semibold text-lg">Review & Submit</h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 text-sm">
                {[
                  { label: 'Title', value: form.title },
                  { label: 'Type', value: `${form.type} for ${form.listingType}` },
                  { label: 'Location', value: `${form.location.address}, ${form.location.area}` },
                  { label: 'Price', value: `₹${Number(form.price).toLocaleString('en-IN')} (${form.priceUnit})` },
                  { label: 'Area', value: `${form.area} sqft` },
                  { label: 'Images', value: `${images.length} photos` },
                  { label: 'Amenities', value: `${form.amenities.length} selected` }
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-medium capitalize">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                Your listing will be reviewed by our team and verified within 24-48 hours. Verified listings get 3x more visibility.
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                Previous
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="flex-1"
                disabled={step === 0 && (!form.title || !form.description)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? 'Submitting...' : 'Submit Listing'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
