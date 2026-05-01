'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import type { Property } from '@/types';

interface Props {
  properties: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function PropertyMap({ properties, center, zoom = 12 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const router = useRouter();

  const defaultCenter = center || { lat: 21.1702, lng: 72.8311 };

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      const map = L.map(mapRef.current!, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      properties.forEach(property => {
        const { lat, lng } = property.location.coordinates;
        if (!lat || !lng) return;

        const el = document.createElement('div');
        el.className = 'property-marker';
        el.innerHTML = `<div style="
          background: ${property.isVerified ? '#2563eb' : '#374151'};
          color: white;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          border: 2px solid white;
        ">${formatPrice(property.price)}</div>`;

        const icon = L.divIcon({
          html: el,
          className: '',
          iconAnchor: [40, 20]
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width: 200px; font-family: sans-serif;">
            <img src="${property.images?.[0] || ''}" style="width:100%; height:100px; object-fit:cover; border-radius:8px; margin-bottom:8px;" />
            <div style="font-weight:600; font-size:14px; margin-bottom:4px;">${property.title}</div>
            <div style="color:#6b7280; font-size:12px; margin-bottom:4px;">${property.location.area}, Surat</div>
            <div style="font-size:16px; font-weight:700; color:#2563eb; margin-bottom:8px;">${formatPrice(property.price)}</div>
            <a href="/properties/${property._id}" style="display:block; text-align:center; background:#2563eb; color:white; padding:6px 12px; border-radius:8px; text-decoration:none; font-size:12px; font-weight:600;">View Details</a>
          </div>
        `);
      });

      mapInstance.current = map;
    };

    initMap();

    return () => {
      mapInstance.current?.remove();
    };
  }, [properties, defaultCenter.lat, defaultCenter.lng, zoom]);

  return <div ref={mapRef} className="w-full h-full rounded-2xl" />;
}
