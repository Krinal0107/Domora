export type UserRole = 'user' | 'broker' | 'admin';
export type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial' | 'office' | 'shop';
export type ListingType = 'buy' | 'rent' | 'lease';
export type PropertyStatus = 'active' | 'sold' | 'rented' | 'pending' | 'draft';
export type KYCStatus = 'pending' | 'approved' | 'rejected';
export type NegotiationStatus = 'open' | 'countered' | 'accepted' | 'rejected' | 'expired';
export type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  walletAddress?: string;
  isVerified: boolean;
  kycStatus: KYCStatus;
  savedProperties: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: number;
  priceUnit: 'total' | 'per_sqft' | 'per_month';
  area: number;
  areaUnit: 'sqft' | 'sqm' | 'sqyd';
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  floor?: number;
  totalFloors?: number;
  furnishing: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  facing: string;
  age: number;
  location: {
    address: string;
    area: SuratArea;
    city: string;
    state: string;
    pincode: string;
    coordinates: { lat: number; lng: number };
  };
  images: string[];
  videos?: string[];
  amenities: string[];
  features: string[];
  owner: User | string;
  broker?: User | string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: User | string;
  adminNotes?: string;
  solanaTokenId?: string;
  documentHash?: string;
  fraudScore: number;
  fraudFlags?: string[];
  viewCount: number;
  leadCount: number;
  isFeatured: boolean;
  featuredUntil?: string;
  reelVideoUrl?: string;
  reelThumbnail?: string;
  nearbyPlaces?: {
    name: string;
    type: string;
    distance: number;
  }[];
  priceHistory?: {
    price: number;
    date: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type SuratArea =
  | 'Vesu'
  | 'Adajan'
  | 'Piplod'
  | 'Althan'
  | 'Pal'
  | 'Sarthana'
  | 'Katargam'
  | 'Varachha'
  | 'Udhna'
  | 'Rander'
  | 'Jahangirpura'
  | 'Dumas'
  | 'Bhatar'
  | 'Athwalines'
  | 'City Light'
  | 'Puna'
  | 'Limbayat'
  | 'Sachin'
  | 'Hazira';

export interface AreaInsight {
  area: SuratArea;
  avgPriceBuy: number;
  avgPriceRent: number;
  priceGrowth: number;
  connectivity: number;
  safety: number;
  amenities: number;
  schools: number;
  hospitals: number;
  overall: number;
  description: string;
  coordinates: { lat: number; lng: number };
}

export interface Lead {
  _id: string;
  property: Property | string;
  buyer: User | string;
  seller: User | string;
  broker?: User | string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  status: 'new' | 'contacted' | 'visited' | 'converted' | 'lost';
  source: 'direct' | 'chatbot' | 'reels' | 'map';
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User | string;
  receiver: User | string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: (User | string)[];
  property?: Property | string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Negotiation {
  _id: string;
  property: Property | string;
  buyer: User | string;
  seller: User | string;
  initialOffer: number;
  currentOffer: number;
  counterOffer?: number;
  status: NegotiationStatus;
  history: NegotiationEvent[];
  expiresAt: string;
  createdAt: string;
}

export interface NegotiationEvent {
  actor: string;
  action: 'offer' | 'counter' | 'accept' | 'reject';
  amount: number;
  message?: string;
  timestamp: string;
}

export interface Visit {
  _id: string;
  property: Property | string;
  visitor: User | string;
  owner: User | string;
  scheduledAt: string;
  status: VisitStatus;
  notes?: string;
  feedback?: string;
  rating?: number;
  createdAt: string;
}

export interface KYCDocument {
  _id: string;
  user: User | string;
  property?: Property | string;
  docType: 'aadhaar' | 'pan' | 'passport' | 'voter_id' | 'property_deed' | 'sale_agreement';
  fileUrl: string;
  status: KYCStatus;
  reviewedBy?: User | string;
  rejectionReason?: string;
  createdAt: string;
}

export interface InvestmentMetrics {
  propertyId: string;
  purchasePrice: number;
  currentValue: number;
  appreciation: number;
  appreciationPercent: number;
  rentalIncome?: number;
  rentalYield?: number;
  roi: number;
  holdingPeriod: number;
}

export interface AIRecommendation {
  property: Property;
  score: number;
  reasons: string[];
  matchPercent: number;
}

export interface Notification {
  _id: string;
  user: string;
  type: 'lead' | 'message' | 'visit' | 'offer' | 'system' | 'kyc';
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PropertyFilters {
  listingType?: ListingType;
  type?: PropertyType;
  area?: SuratArea[];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number[];
  furnishing?: string[];
  amenities?: string[];
  isVerified?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'area_asc';
  page?: number;
  limit?: number;
}

export interface SolanaPropertyRecord {
  propertyId: string;
  ownerPublicKey: string;
  documentHash: string;
  timestamp: number;
  isVerified: boolean;
  escrowAmount?: number;
}
