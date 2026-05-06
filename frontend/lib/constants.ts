import type { SuratArea, AreaInsight } from '@/types';

export const AMENITIES_LIST = [
  'Swimming Pool',
  'Gym',
  'Garden',
  'Parking',
  'Security',
  'Power Backup',
  'Lift',
  'Clubhouse',
  'Children Play Area',
  'Indoor Games',
  'Fire Safety',
  'Intercom',
  'Gas Pipeline',
  'Rainwater Harvesting',
  'Vastu Compliant',
  'Pet Friendly',
  'Visitor Parking',
  'Jogging Track',
  'Tennis Court',
  'Basketball Court',
  'Spa',
  'Jacuzzi',
  'Multipurpose Hall',
  'Library',
  'Cafeteria',
  'ATM',
  'Pharmacy',
  'Grocery Store',
  'Solar Panels',
  'EV Charging'
] as const;

export const SURAT_AREAS: SuratArea[] = [
  'Vesu', 'Adajan', 'Piplod', 'Althan', 'Pal', 'Sarthana',
  'Katargam', 'Varachha', 'Udhna', 'Rander', 'Jahangirpura',
  'Dumas', 'Bhatar', 'Athwalines', 'City Light', 'Puna',
  'Limbayat', 'Sachin', 'Hazira'
];

export const AREA_INSIGHTS: AreaInsight[] = [
  { area: 'Vesu', avgPriceBuy: 6500, avgPriceRent: 22000, priceGrowth: 12.5, connectivity: 8, safety: 9, amenities: 9, schools: 9, hospitals: 8, overall: 9, description: "Premium residential hub with world-class amenities.", coordinates: { lat: 21.1497, lng: 72.7749 } },
  { area: 'Adajan', avgPriceBuy: 5800, avgPriceRent: 18000, priceGrowth: 11.2, connectivity: 9, safety: 9, amenities: 9, schools: 8, hospitals: 9, overall: 9, description: 'Elite locality with excellent connectivity.', coordinates: { lat: 21.1843, lng: 72.7856 } },
  { area: 'Piplod', avgPriceBuy: 5200, avgPriceRent: 16000, priceGrowth: 9.8, connectivity: 8, safety: 8, amenities: 8, schools: 8, hospitals: 7, overall: 8, description: 'Rapidly developing premium zone adjacent to Vesu.', coordinates: { lat: 21.1562, lng: 72.7821 } },
  { area: 'Althan', avgPriceBuy: 4800, avgPriceRent: 14000, priceGrowth: 10.5, connectivity: 7, safety: 8, amenities: 7, schools: 8, hospitals: 7, overall: 8, description: 'Emerging residential area with affordable premium properties.', coordinates: { lat: 21.1634, lng: 72.7945 } },
  { area: 'Pal', avgPriceBuy: 4200, avgPriceRent: 12000, priceGrowth: 8.9, connectivity: 7, safety: 8, amenities: 7, schools: 7, hospitals: 7, overall: 7, description: 'Growing middle-class residential area.', coordinates: { lat: 21.1721, lng: 72.8012 } },
  { area: 'Katargam', avgPriceBuy: 3200, avgPriceRent: 9000, priceGrowth: 7.5, connectivity: 9, safety: 7, amenities: 7, schools: 7, hospitals: 7, overall: 7, description: 'Textile hub with excellent transport links.', coordinates: { lat: 21.2145, lng: 72.8456 } },
  { area: 'Varachha', avgPriceBuy: 3500, avgPriceRent: 10000, priceGrowth: 8.2, connectivity: 8, safety: 7, amenities: 7, schools: 8, hospitals: 7, overall: 7, description: 'Densely populated area with high rental demand.', coordinates: { lat: 21.2213, lng: 72.8712 } },
  { area: 'Dumas', avgPriceBuy: 7200, avgPriceRent: 25000, priceGrowth: 14.2, connectivity: 6, safety: 9, amenities: 8, schools: 7, hospitals: 6, overall: 8, description: 'Exclusive beachside locality with ultra-premium villas.', coordinates: { lat: 21.0876, lng: 72.7123 } },
  { area: 'Bhatar', avgPriceBuy: 4500, avgPriceRent: 13000, priceGrowth: 9.1, connectivity: 7, safety: 8, amenities: 7, schools: 8, hospitals: 7, overall: 7, description: 'Developing residential area with good schools.', coordinates: { lat: 21.1834, lng: 72.8234 } },
  { area: 'City Light', avgPriceBuy: 5500, avgPriceRent: 17000, priceGrowth: 10.8, connectivity: 9, safety: 9, amenities: 9, schools: 9, hospitals: 9, overall: 9, description: 'Central premium area with best-in-class amenities.', coordinates: { lat: 21.1712, lng: 72.8145 } },
  { area: 'Athwalines', avgPriceBuy: 5000, avgPriceRent: 15500, priceGrowth: 9.5, connectivity: 9, safety: 9, amenities: 9, schools: 9, hospitals: 9, overall: 9, description: 'Historic premium area with excellent infrastructure.', coordinates: { lat: 21.1765, lng: 72.8178 } },
  { area: 'Rander', avgPriceBuy: 3800, avgPriceRent: 11000, priceGrowth: 8.0, connectivity: 7, safety: 8, amenities: 6, schools: 7, hospitals: 6, overall: 7, description: 'Traditional area across the Tapi River.', coordinates: { lat: 21.2234, lng: 72.7934 } },
  { area: 'Jahangirpura', avgPriceBuy: 3600, avgPriceRent: 10500, priceGrowth: 8.5, connectivity: 7, safety: 7, amenities: 6, schools: 7, hospitals: 6, overall: 7, description: 'Upcoming area with affordable options.', coordinates: { lat: 21.1956, lng: 72.8312 } },
  { area: 'Udhna', avgPriceBuy: 2800, avgPriceRent: 8000, priceGrowth: 7.0, connectivity: 8, safety: 7, amenities: 6, schools: 6, hospitals: 6, overall: 6, description: 'Industrial area with very affordable housing.', coordinates: { lat: 21.1589, lng: 72.8678 } },
  { area: 'Sarthana', avgPriceBuy: 3100, avgPriceRent: 9500, priceGrowth: 7.8, connectivity: 7, safety: 7, amenities: 6, schools: 7, hospitals: 6, overall: 7, description: 'Growing residential area near the river.', coordinates: { lat: 21.2078, lng: 72.8567 } },
  { area: 'Hazira', avgPriceBuy: 3400, avgPriceRent: 9800, priceGrowth: 9.0, connectivity: 6, safety: 7, amenities: 5, schools: 6, hospitals: 5, overall: 6, description: 'Industrial port area with growing residential demand.', coordinates: { lat: 21.0945, lng: 72.6234 } },
  { area: 'Sachin', avgPriceBuy: 2500, avgPriceRent: 7500, priceGrowth: 7.2, connectivity: 7, safety: 7, amenities: 5, schools: 6, hospitals: 5, overall: 6, description: 'Industrial suburb with very affordable housing.', coordinates: { lat: 21.0834, lng: 72.8912 } },
  { area: 'Puna', avgPriceBuy: 3300, avgPriceRent: 9200, priceGrowth: 8.3, connectivity: 7, safety: 7, amenities: 6, schools: 7, hospitals: 6, overall: 7, description: 'Developing residential area with good connectivity.', coordinates: { lat: 21.1423, lng: 72.8534 } },
  { area: 'Limbayat', avgPriceBuy: 2900, avgPriceRent: 8500, priceGrowth: 7.5, connectivity: 7, safety: 7, amenities: 5, schools: 6, hospitals: 6, overall: 6, description: 'Affordable residential area near industrial belt.', coordinates: { lat: 21.1634, lng: 72.8823 } }
];
