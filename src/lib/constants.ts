import { FeeVisibility, ListingType, Property, WebsiteSettings } from '../types';

export const BRAND_IMAGES = {
  heroVilla: '/src/assets/images/hero_luxury_villa_1795174334662.jpg',
  serviceHouses: '/src/assets/images/service_houses_1795174335043.jpg',
  serviceLand: '/src/assets/images/service_land_1795174335074.jpg',
  serviceCommercial: '/src/assets/images/service_commercial_1795174334417.jpg',
  serviceFuelStation: '/src/assets/images/service_fuel_station_1795174336553.jpg',
  aboutArchitecture: '/src/assets/images/about_architecture_1795174334676.jpg',
};

export const DEFAULT_SETTINGS: WebsiteSettings = {
  company_name: 'Ib home light property and land',
  company_description:
    'Ib home light property and land is a real estate business offering houses, land, commercial properties and fuel station property opportunities.',
  phone: '+234 806 366 9688',
  whatsapp: '+2348063669688',
  instagram: '@alabo007',
  email: 'Ibilateberepele17@gmail.com',
  office_address: 'No. 4 Central Estate, Army Range, Igwuruta, Port Harcourt, Nigeria.',
  hero_location_label: 'Port Harcourt, Rivers State · Nigeria',
  hero_heading: 'FIND YOUR DREAM PROPERTY WITH IB HOME LIGHT.',
  hero_description:
    'Your trusted partner for buying and selling houses, lands and commercial properties in Port Harcourt and beyond.',
  logo_url: '',
};

export const OFFICIAL_CATEGORIES = [
  'Houses for Sale',
  'Lands for Sale',
  'Commercial Properties',
  'Fuel Station Properties',
  'Residential Properties',
  'Investment Properties',
] as const;

export const PROPERTY_FILTER_CATEGORIES = [
  'Self-contained',
  'One-bedroom flat',
  'Two-bedroom flat',
  'Duplex',
  'Land',
  'Other',
  'Commercial Properties',
  'Fuel Station Properties',
] as const;

export const ADMIN_PROPERTY_CATEGORIES = [
  'Self-contained',
  'One-bedroom flat',
  'Two-bedroom flat',
  'Duplex',
  'Land',
  'Other',
  'Houses for Sale',
  'Lands for Sale',
  'Commercial Properties',
  'Fuel Station Properties',
] as const;

export const LISTING_TYPES: ListingType[] = ['For Rent', 'For Sale'];

export const PRESET_PROPERTY_FEATURES = [
  'Solar-powered water pumping',
  'Fenced estate',
  '24-hour security',
  'Good road access',
  'Electricity',
  'Parking space',
  'Close to the main road',
] as const;

export const DEFAULT_FEE_VISIBILITY: FeeVisibility = {
  caution_fee: true,
  drinking_money: true,
  movement_fee: true,
  agreement_fee: true,
  legal_fee: true,
  agent_commission: true,
};

export function calculatePropertyTotals(
  input: Pick<
    Property,
    | 'price'
    | 'caution_fee'
    | 'drinking_money'
    | 'movement_fee'
    | 'agreement_fee'
    | 'legal_fee'
    | 'agent_commission_amount'
    | 'fee_visibility'
  >
) {
  const vis = { ...DEFAULT_FEE_VISIBILITY, ...(input.fee_visibility || {}) };
  const basePrice = Number(input.price) || 0;
  const caution = Number(input.caution_fee) || 0;
  const drinking = Number(input.drinking_money) || 0;
  const movement = Number(input.movement_fee) || 0;
  const agreement = Number(input.agreement_fee) || 0;
  const legal = Number(input.legal_fee) || 0;
  const commission = Number(input.agent_commission_amount) || 0;

  const refundableTotal = caution;
  const nonRefundableTotal = drinking + movement + agreement + legal + commission;
  const totalPayable = basePrice + refundableTotal + nonRefundableTotal;

  const visibleRefundableTotal = vis.caution_fee ? caution : 0;
  const visibleNonRefundableTotal =
    (vis.drinking_money ? drinking : 0) +
    (vis.movement_fee ? movement : 0) +
    (vis.agreement_fee ? agreement : 0) +
    (vis.legal_fee ? legal : 0) +
    (vis.agent_commission ? commission : 0);
  const visibleTotalPayable = basePrice + visibleRefundableTotal + visibleNonRefundableTotal;

  return {
    basePrice,
    refundableTotal,
    nonRefundableTotal,
    totalPayable,
    visibleRefundableTotal,
    visibleNonRefundableTotal,
    visibleTotalPayable,
  };
}

export function buildWhatsAppUrl(
  whatsappNumber: string = '2348063669688',
  customMessage?: string
): string {
  const digits = whatsappNumber.replace(/\D/g, '') || '2348063669688';
  const normalized = digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
  const text =
    customMessage ||
    'Hello IB Home Light Property And Land, I would like to enquire about your real estate opportunities in Port Harcourt.';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function buildPropertyWhatsAppUrl(propertyTitle: string, whatsappNumber?: string): string {
  const message = `Hello IB Home Light Property And Land, I am interested in this property (${propertyTitle}). Please provide more information.`;
  return buildWhatsAppUrl(whatsappNumber, message);
}

export function buildInstagramUrl(handle: string = '@alabo007'): string {
  const clean = handle.replace(/^@/, '').trim() || 'alabo007';
  return `https://instagram.com/${clean}`;
}

export function formatNaira(amount: number, display?: string): string {
  if (display && display.trim().length > 0) return display;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}
