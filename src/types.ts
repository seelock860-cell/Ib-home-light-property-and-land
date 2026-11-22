export type PropertyAvailability = 'available' | 'sold' | 'rented' | 'unavailable';
export type ListingType = 'For Rent' | 'For Sale' | 'House Rent' | 'To Let' | 'Short Let';
export type EnquiryStatus = 'new' | 'contacted' | 'completed';

export interface FeeVisibility {
  caution_fee: boolean;
  drinking_money: boolean;
  movement_fee: boolean;
  agreement_fee: boolean;
  legal_fee: boolean;
  agent_commission: boolean;
}

export interface WebsiteSettings {
  id?: number;
  company_name: string;
  company_description: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  email?: string;
  office_address: string;
  hero_location_label: string;
  hero_heading: string;
  hero_description: string;
  logo_url: string;
  updated_at?: string;
}

export interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  property_count?: number;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  storage_path?: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface PropertyVideo {
  id: string;
  property_id: string;
  video_url: string;
  storage_path?: string;
  caption?: string;
  mime_type?: string;
  sort_order: number;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  category_id?: string | null;
  category_name: string;
  listing_type: ListingType;
  location: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  property_size: string;
  price: number;
  price_display: string;
  caution_fee: number;
  drinking_money: number;
  movement_fee: number;
  agreement_fee: number;
  legal_fee: number;
  agent_commission_percent: number;
  agent_commission_amount: number;
  fee_visibility: FeeVisibility;
  short_description: string;
  full_description: string;
  features: string[];
  availability: PropertyAvailability;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
  videos: PropertyVideo[];
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  storage_path?: string;
  property_id?: string | null;
  show_in_gallery: boolean;
  created_at: string;
}

export interface Enquiry {
  id: string;
  customer_id?: string | null;
  full_name: string;
  phone: string;
  email: string;
  property_id?: string | null;
  property_interest: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  enquiries?: Enquiry[];
  enquiry_count?: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface DashboardStats {
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  rentedProperties: number;
  unavailableProperties: number;
  publishedProperties: number;
  totalEnquiries: number;
  newEnquiries: number;
  contactedEnquiries: number;
  completedEnquiries: number;
  totalCustomers: number;
  categoryBreakdown: { name: string; count: number }[];
  recentEnquiries: Enquiry[];
  recentProperties: Property[];
}
