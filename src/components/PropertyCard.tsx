import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, MessageCircle } from 'lucide-react';
import { Property } from '../types';
import { useSite } from '../context/SiteContext';
import { buildPropertyWhatsAppUrl, formatNaira } from '../lib/constants';
import { SmartImage } from './SmartImage';

interface PropertyCardProps {
  property: Property;
}

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available',
  sold: 'Sold',
  rented: 'Rented',
  unavailable: 'Unavailable',
};

const AVAILABILITY_TEXT_CLASS: Record<string, string> = {
  available: 'text-[#16A34A] font-semibold',
  sold: 'text-red-700 font-semibold',
  rented: 'text-[#B58F21] font-semibold',
  unavailable: 'text-[#202020]/60 font-semibold',
};

export function PropertyCard({ property }: PropertyCardProps) {
  const { settings } = useSite();
  const primaryImg =
    property.images?.find((img) => img.is_primary)?.image_url ||
    property.images?.[0]?.image_url;
  const whatsappUrl = buildPropertyWhatsAppUrl(property.title, settings.whatsapp);
  const specItems = [
    property.bedrooms !== null && property.bedrooms !== undefined
      ? `${property.bedrooms} ${property.bedrooms === 1 ? 'Bed' : 'Beds'}`
      : null,
    property.bathrooms !== null && property.bathrooms !== undefined
      ? `${property.bathrooms} ${property.bathrooms === 1 ? 'Bath' : 'Baths'}`
      : null,
    property.property_size?.trim() ? property.property_size.trim() : null,
  ].filter(Boolean) as string[];

  return (
    <article className="group bg-white border border-[#101C32]/12 rounded-sm overflow-hidden flex flex-col transition-all duration-200 hover:border-[#D6AD32]">
      <Link to={`/properties/${property.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-[#101C32]">
        <SmartImage
          src={primaryImg}
          alt={`${property.title} — ${property.location}`}
          fallbackTitle={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101C32]/75 via-[#101C32]/15 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
          <p className="text-lg font-bold text-white tabular-nums tracking-tight">
            {formatNaira(property.price, property.price_display)}
          </p>
          {property.is_featured && (
            <span className="text-xs font-semibold text-[#D6AD32] tracking-wide">
              Featured
            </span>
          )}
        </div>
      </Link>

      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {/* Zero-pill clean unboxed metadata row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#202020]/70 mb-2">
          <span className="font-semibold text-[#B58F21]">{property.listing_type || 'For Sale'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-[#101C32]">{property.category_name}</span>
          <span aria-hidden="true">·</span>
          <span className={AVAILABILITY_TEXT_CLASS[property.availability] || 'text-[#101C32]'}>
            {AVAILABILITY_LABELS[property.availability] || property.availability}
          </span>
        </div>

        <h3 className="font-display text-xl font-semibold text-[#101C32] leading-snug mb-2 group-hover:text-[#B58F21] transition-colors">
          <Link to={`/properties/${property.slug}`}>{property.title}</Link>
        </h3>

        <p className="flex items-center gap-1.5 text-xs text-[#202020]/75 mb-2">
          <MapPin className="w-3.5 h-3.5 text-[#D6AD32] shrink-0" />
          <span className="truncate">{property.location}</span>
        </p>

        {specItems.length > 0 && (
          <p className="text-xs font-medium text-[#101C32]/75 mb-3 tabular-nums">
            {specItems.join(' · ')}
          </p>
        )}

        <p className="text-sm text-[#202020]/80 leading-relaxed line-clamp-2 mb-5 flex-1">
          {property.short_description || property.full_description}
        </p>

        <div className="pt-4 border-t border-[#101C32]/10 flex items-center gap-2.5">
          <Link
            to={`/properties/${property.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm transition-colors whitespace-nowrap"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#D6AD32]" />
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors whitespace-nowrap"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}
