import type { SuratArea, AreaInsight } from '../types';

export const SURAT_AREAS: SuratArea[] = [
  'Vesu', 'Adajan', 'Piplod', 'Althan', 'Pal', 'Sarthana',
  'Katargam', 'Varachha', 'Udhna', 'Rander', 'Jahangirpura',
  'Dumas', 'Bhatar', 'Athwalines', 'City Light', 'Puna',
  'Limbayat', 'Sachin', 'Hazira'
];

export const AREA_INSIGHTS: AreaInsight[] = [
  {
    area: 'Vesu',
    avgPriceBuy: 6500,
    avgPriceRent: 22000,
    priceGrowth: 12.5,
    connectivity: 8,
    safety: 9,
    amenities: 9,
    schools: 9,
    hospitals: 8,
    overall: 9,
    description: 'Premium residential hub with world-class amenities. High-rise apartments, malls, and top schools make it Surat\'s most sought-after area.',
    coordinates: { lat: 21.1497, lng: 72.7749 }
  },
  {
    area: 'Adajan',
    avgPriceBuy: 5800,
    avgPriceRent: 18000,
    priceGrowth: 11.2,
    connectivity: 9,
    safety: 9,
    amenities: 9,
    schools: 8,
    hospitals: 9,
    overall: 9,
    description: 'Elite locality with excellent connectivity. Home to top hospitals and shopping destinations.',
    coordinates: { lat: 21.1843, lng: 72.7856 }
  },
  {
    area: 'Piplod',
    avgPriceBuy: 5200,
    avgPriceRent: 16000,
    priceGrowth: 9.8,
    connectivity: 8,
    safety: 8,
    amenities: 8,
    schools: 8,
    hospitals: 7,
    overall: 8,
    description: 'Rapidly developing premium zone adjacent to Vesu. Great investment potential.',
    coordinates: { lat: 21.1562, lng: 72.7821 }
  },
  {
    area: 'Althan',
    avgPriceBuy: 4800,
    avgPriceRent: 14000,
    priceGrowth: 10.5,
    connectivity: 7,
    safety: 8,
    amenities: 7,
    schools: 8,
    hospitals: 7,
    overall: 8,
    description: 'Emerging residential area with affordable premium properties. Strong rental demand.',
    coordinates: { lat: 21.1634, lng: 72.7945 }
  },
  {
    area: 'Pal',
    avgPriceBuy: 4200,
    avgPriceRent: 12000,
    priceGrowth: 8.9,
    connectivity: 7,
    safety: 8,
    amenities: 7,
    schools: 7,
    hospitals: 7,
    overall: 7,
    description: 'Growing middle-class residential area with good schools and peaceful environment.',
    coordinates: { lat: 21.1721, lng: 72.8012 }
  },
  {
    area: 'Katargam',
    avgPriceBuy: 3200,
    avgPriceRent: 9000,
    priceGrowth: 7.5,
    connectivity: 9,
    safety: 7,
    amenities: 7,
    schools: 7,
    hospitals: 7,
    overall: 7,
    description: 'Textile hub with excellent transport links. Affordable housing with strong commercial activity.',
    coordinates: { lat: 21.2145, lng: 72.8456 }
  },
  {
    area: 'Varachha',
    avgPriceBuy: 3500,
    avgPriceRent: 10000,
    priceGrowth: 8.2,
    connectivity: 8,
    safety: 7,
    amenities: 7,
    schools: 8,
    hospitals: 7,
    overall: 7,
    description: 'Densely populated area with high rental demand. Good connectivity and commercial activity.',
    coordinates: { lat: 21.2213, lng: 72.8712 }
  },
  {
    area: 'Dumas',
    avgPriceBuy: 7200,
    avgPriceRent: 25000,
    priceGrowth: 14.2,
    connectivity: 6,
    safety: 9,
    amenities: 8,
    schools: 7,
    hospitals: 6,
    overall: 8,
    description: 'Exclusive beachside locality. Ultra-premium villas and bungalows. Best sea-facing properties.',
    coordinates: { lat: 21.0876, lng: 72.7123 }
  },
  {
    area: 'Bhatar',
    avgPriceBuy: 4500,
    avgPriceRent: 13000,
    priceGrowth: 9.1,
    connectivity: 7,
    safety: 8,
    amenities: 7,
    schools: 8,
    hospitals: 7,
    overall: 7,
    description: 'Developing residential area with good schools and affordable premium properties.',
    coordinates: { lat: 21.1834, lng: 72.8234 }
  },
  {
    area: 'City Light',
    avgPriceBuy: 5500,
    avgPriceRent: 17000,
    priceGrowth: 10.8,
    connectivity: 9,
    safety: 9,
    amenities: 9,
    schools: 9,
    hospitals: 9,
    overall: 9,
    description: 'Central premium area with best-in-class amenities, connectivity, and lifestyle.',
    coordinates: { lat: 21.1712, lng: 72.8145 }
  },
  {
    area: 'Athwalines',
    avgPriceBuy: 5000,
    avgPriceRent: 15500,
    priceGrowth: 9.5,
    connectivity: 9,
    safety: 9,
    amenities: 9,
    schools: 9,
    hospitals: 9,
    overall: 9,
    description: 'Historic premium area with excellent infrastructure and cultural hub.',
    coordinates: { lat: 21.1765, lng: 72.8178 }
  },
  {
    area: 'Rander',
    avgPriceBuy: 3800,
    avgPriceRent: 11000,
    priceGrowth: 8.0,
    connectivity: 7,
    safety: 8,
    amenities: 6,
    schools: 7,
    hospitals: 6,
    overall: 7,
    description: 'Traditional area across the Tapi River. Growing infrastructure with heritage charm.',
    coordinates: { lat: 21.2234, lng: 72.7934 }
  }
];

export const AMENITIES_LIST = [
  'Swimming Pool', 'Gym', 'Club House', 'Children Play Area',
  'Security', '24/7 Water Supply', 'Power Backup', 'Lift',
  'Parking', 'Garden', 'Tennis Court', 'Badminton Court',
  'CCTV', 'Intercom', 'Fire Safety', 'Rainwater Harvesting',
  'Solar Panel', 'Jogging Track', 'Amphitheatre', 'Indoor Games'
];

export const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'];

export const FACING_OPTIONS = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];

export const FURNISHING_OPTIONS = ['unfurnished', 'semi-furnished', 'fully-furnished'];

export const SOLANA_NETWORK = 'devnet';
export const PROGRAM_ID = '8i766exkHgJefjwC8zcfagKQJvny93rsgeNn47wuuwC1';
