import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Loader2,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useSite } from '../context/SiteContext';
import { Property } from '../types';
import {
  DEFAULT_FEE_VISIBILITY,
  SITE_URL,
  buildPropertyWhatsAppUrl,
  calculatePropertyTotals,
  formatNaira,
} from '../lib/constants';
import { SmartImage } from '../components/SmartImage';
import { EnquiryForm } from '../components/EnquiryForm';
import { SeoHead } from '../components/SeoHead';

const AVAILABILITY_TEXT_STYLE: Record<string, string> = {
  available: 'text-[#16A34A]',
  rented: 'text-[#B58F21]',
  sold: 'text-red-700',
  unavailable: 'text-[#202020]/60',
};

export function PropertyDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSite();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await api.getPropertyBySlug(slug);
      if (active) {
        setProperty(data);
        setActiveIndex(0);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F8F7F3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D6AD32]" />
      </div>
    );
  }

  if (!property) {
    return (
      <section className="py-24 bg-[#F8F7F3] text-center px-4">
        <SeoHead
          title={`Property Not Found | ${settings.company_name}`}
          description="The requested property listing is currently unavailable."
          noIndex
        />
        <h1 className="font-display text-3xl font-bold text-[#101C32] mb-3">
          Property Not Found
        </h1>
        <p className="text-sm text-[#202020]/75 mb-6">
          This listing may have been removed or unpublished by the administrator.
        </p>
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Properties</span>
        </Link>
      </section>
    );
  }

  const images = property.images || [];
  const videos = property.videos || [];
  const currentImg = images[activeIndex]?.image_url;
  const listingType = property.listing_type || 'For Sale';
  const whatsappUrl = buildPropertyWhatsAppUrl(
    `${property.title} (${listingType})`,
    settings.whatsapp
  );
  const telHref = `tel:${settings.phone.replace(/\s+/g, '')}`;

  const visibility = { ...DEFAULT_FEE_VISIBILITY, ...(property.fee_visibility || {}) };
  const totals = calculatePropertyTotals(property);
  const priceLabel = listingType === 'For Sale' ? 'Selling Price' : 'Property Rent';

  const visibleExtraFees = [
    {
      key: 'caution_fee',
      label: 'Caution Fee',
      amount: Number(property.caution_fee) || 0,
      visible: visibility.caution_fee,
      refundable: true,
    },
    {
      key: 'drinking_money',
      label: 'Drinking Money',
      amount: Number(property.drinking_money) || 0,
      visible: visibility.drinking_money,
      refundable: false,
    },
    {
      key: 'movement_fee',
      label: 'Movement Fee',
      amount: Number(property.movement_fee) || 0,
      visible: visibility.movement_fee,
      refundable: false,
    },
    {
      key: 'agreement_fee',
      label: 'Agreement Fee',
      amount: Number(property.agreement_fee) || 0,
      visible: visibility.agreement_fee,
      refundable: false,
    },
    {
      key: 'legal_fee',
      label: 'Legal Fee',
      amount: Number(property.legal_fee) || 0,
      visible: visibility.legal_fee,
      refundable: false,
    },
    {
      key: 'agent_commission',
      label:
        Number(property.agent_commission_percent) > 0
          ? `Agent Commission (${property.agent_commission_percent}%)`
          : 'Agent Commission',
      amount: Number(property.agent_commission_amount) || 0,
      visible: visibility.agent_commission,
      refundable: false,
    },
  ].filter((fee) => fee.visible && fee.amount > 0);

  const hasSpecs =
    (property.bedrooms !== null && property.bedrooms !== undefined) ||
    (property.bathrooms !== null && property.bathrooms !== undefined) ||
    Boolean(property.property_size?.trim());

  const primaryImage =
    images.find((img) => img.is_primary)?.image_url || images[0]?.image_url;
  const propertyDesc =
    property.short_description ||
    `${property.title} in ${property.location} (${listingType}). Listed by ${settings.company_name}.`;

  return (
    <>
      <SeoHead
        title={`${property.title} — ${property.location} | ${settings.company_name}`}
        description={propertyDesc}
        keywords={`${property.title}, ${property.category_name} in ${property.location}, ${listingType} Port Harcourt, ${settings.company_name}`}
        canonicalPath={`/properties/${property.slug}`}
        ogType="article"
        ogImage={primaryImage}
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: property.title,
            description: propertyDesc,
            url: `${SITE_URL}/properties/${property.slug}`,
            datePosted: property.created_at,
            ...(primaryImage ? { image: [primaryImage] } : {}),
            offers: {
              '@type': 'Offer',
              price: Number(property.price) || 0,
              priceCurrency: 'NGN',
              availability:
                property.availability === 'available'
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/SoldOut',
              seller: {
                '@id': `${SITE_URL}/#organization`,
              },
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${SITE_URL}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Properties',
                item: `${SITE_URL}/properties`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: property.title,
                item: `${SITE_URL}/properties/${property.slug}`,
              },
            ],
          },
        ]}
      />

      <section className="bg-[#101C32] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#D6AD32] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Property Listings</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/75 mb-2">
                <span className="text-[#D6AD32] font-semibold">{listingType}</span>
                <span aria-hidden="true">·</span>
                <span className="text-white font-medium">{property.category_name}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{property.availability}</span>
                <span aria-hidden="true">·</span>
                <span>{property.location}</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {property.title}
              </h1>
            </div>

            <div className="lg:text-right">
              <p className="text-xs text-white/65 mb-1">{priceLabel}</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#D6AD32] tabular-nums">
                {formatNaira(property.price, property.price_display)}
              </p>
              {visibleExtraFees.length > 0 && totals.visibleTotalPayable > totals.basePrice && (
                <p className="text-xs text-white/75 mt-1 tabular-nums">
                  Total Payable: {formatNaira(totals.visibleTotalPayable)}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Gallery + Videos + Overview + Pricing Breakdown */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white border border-[#101C32]/12 rounded-sm overflow-hidden">
              <div className="relative aspect-[16/10] bg-[#101C32]">
                <SmartImage
                  src={currentImg}
                  alt={`${property.title} photo ${activeIndex + 1}`}
                  fallbackTitle={property.title}
                  className="w-full h-full object-cover"
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
                      }
                      aria-label="Previous property image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-sm bg-[#101C32]/80 hover:bg-[#101C32] text-white flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
                      aria-label="Next property image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-sm bg-[#101C32]/80 hover:bg-[#101C32] text-white flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {currentImg && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    aria-label="Enlarge property photograph"
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#101C32]/85 hover:bg-[#101C32] text-white rounded-sm transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#D6AD32]" />
                    <span>Enlarge</span>
                  </button>
                )}
              </div>

              {images.length > 1 && (
                <div className="p-3 bg-white border-t border-[#101C32]/10 flex items-center gap-2.5 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`w-20 h-14 rounded-sm overflow-hidden border-2 shrink-0 transition-all ${
                        idx === activeIndex
                          ? 'border-[#D6AD32]'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <SmartImage
                        src={img.image_url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Videos */}
            {videos.length > 0 && (
              <div className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2.5">
                  <Film className="w-5 h-5 text-[#D6AD32]" />
                  <h2 className="font-display text-2xl font-bold text-[#101C32]">
                    Property Video Tour{videos.length > 1 ? 's' : ''}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {videos.map((vid, idx) => (
                    <div
                      key={vid.id || idx}
                      className="border border-[#101C32]/12 rounded-sm overflow-hidden bg-[#101C32]"
                    >
                      <video
                        src={vid.video_url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-[460px] bg-black"
                      />
                      {vid.caption && (
                        <div className="px-4 py-2.5 bg-white border-t border-[#101C32]/10 text-xs font-medium text-[#101C32]">
                          {vid.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Key Specifications */}
            <div className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#101C32] mb-3">
                  Property Overview
                </h2>
                {property.short_description &&
                  property.full_description &&
                  property.short_description.trim() !== property.full_description.trim() && (
                    <p className="text-sm sm:text-base font-medium text-[#101C32] mb-3 leading-relaxed">
                      {property.short_description}
                    </p>
                  )}
                <p className="text-sm sm:text-base text-[#202020]/85 leading-relaxed whitespace-pre-line">
                  {property.full_description || property.short_description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-[#101C32]/10">
                <div>
                  <p className="text-xs text-[#202020]/60 mb-1">Location</p>
                  <p className="text-sm font-semibold text-[#101C32] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D6AD32] shrink-0" />
                    <span>{property.location}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#202020]/60 mb-1">Category</p>
                  <p className="text-sm font-semibold text-[#101C32]">
                    {property.category_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#202020]/60 mb-1">Listing Type</p>
                  <p className="text-sm font-semibold text-[#101C32]">{listingType}</p>
                </div>
                <div>
                  <p className="text-xs text-[#202020]/60 mb-1">Availability</p>
                  <p
                    className={`text-sm font-semibold capitalize ${
                      AVAILABILITY_TEXT_STYLE[property.availability] || 'text-[#101C32]'
                    }`}
                  >
                    {property.availability}
                  </p>
                </div>
              </div>

              {hasSpecs && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-[#101C32]/10">
                  {property.bedrooms !== null && property.bedrooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm">
                      <BedDouble className="w-5 h-5 text-[#D6AD32] shrink-0" />
                      <div>
                        <p className="text-xs text-[#202020]/60">Bedrooms</p>
                        <p className="text-sm font-semibold text-[#101C32] tabular-nums">
                          {property.bedrooms}
                        </p>
                      </div>
                    </div>
                  )}
                  {property.bathrooms !== null && property.bathrooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm">
                      <Bath className="w-5 h-5 text-[#D6AD32] shrink-0" />
                      <div>
                        <p className="text-xs text-[#202020]/60">Bathrooms</p>
                        <p className="text-sm font-semibold text-[#101C32] tabular-nums">
                          {property.bathrooms}
                        </p>
                      </div>
                    </div>
                  )}
                  {property.property_size?.trim() && (
                    <div className="flex items-center gap-3 p-3 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm">
                      <Ruler className="w-5 h-5 text-[#D6AD32] shrink-0" />
                      <div>
                        <p className="text-xs text-[#202020]/60">Property Size</p>
                        <p className="text-sm font-semibold text-[#101C32]">
                          {property.property_size}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {property.features && property.features.length > 0 && (
                <div className="pt-5 border-t border-[#101C32]/10">
                  <h3 className="font-display text-xl font-semibold text-[#101C32] mb-4">
                    Property Features
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {property.features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 text-sm text-[#202020]/85"
                      >
                        <Check className="w-4 h-4 text-[#D6AD32] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Pricing & Applicable Fees Breakdown */}
            <div className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#101C32]/10">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#101C32]">
                    Pricing & Applicable Charges
                  </h2>
                  <p className="text-xs text-[#202020]/65 mt-1">
                    Transparent breakdown of property price, refundable security deposit, and applicable fees.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#101C32]/10">
                {/* Base Price / Rent */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#101C32]">{priceLabel}</p>
                    <p className="text-xs text-[#202020]/60">Base property consideration</p>
                  </div>
                  <p className="text-base font-bold text-[#101C32] tabular-nums">
                    {formatNaira(property.price, property.price_display)}
                  </p>
                </div>

                {/* Visible Refundable & Non-Refundable Charges */}
                {visibleExtraFees.map((fee) => (
                  <div
                    key={fee.key}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#101C32]">{fee.label}</p>
                      <p
                        className={`text-xs font-semibold mt-0.5 ${
                          fee.refundable ? 'text-[#16A34A]' : 'text-[#202020]/60'
                        }`}
                      >
                        {fee.refundable ? 'Refundable' : 'Non-Refundable'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#101C32] tabular-nums">
                      {formatNaira(fee.amount)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="bg-[#101C32] text-white rounded-sm p-5 space-y-3">
                {totals.visibleRefundableTotal > 0 && (
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                      Refundable Charges Subtotal
                    </span>
                    <span className="font-semibold text-white tabular-nums">
                      {formatNaira(totals.visibleRefundableTotal)}
                    </span>
                  </div>
                )}

                {totals.visibleNonRefundableTotal > 0 && (
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Non-Refundable Charges Subtotal</span>
                    <span className="font-semibold text-white tabular-nums">
                      {formatNaira(totals.visibleNonRefundableTotal)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-white">
                    Total Amount Payable
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#D6AD32] tabular-nums">
                    {formatNaira(totals.visibleTotalPayable)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Enquiry */}
          <div className="space-y-6">
            <div className="bg-[#101C32] text-white rounded-sm p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-white">
                Enquire About This Property
              </h2>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                Speak directly with {settings.company_name} to schedule a physical inspection or verify documentation.
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enquire on WhatsApp</span>
              </a>

              <a
                href={telHref}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors tabular-nums"
              >
                <Phone className="w-4 h-4" />
                <span>Call {settings.phone}</span>
              </a>

              <div className="pt-3 border-t border-white/10 text-xs text-white/70 space-y-1">
                <p className="font-semibold text-white">{settings.company_name}</p>
                <p>{settings.office_address}</p>
              </div>
            </div>

            <div className="bg-white border border-[#101C32]/12 rounded-sm p-6">
              <h3 className="font-display text-xl font-semibold text-[#101C32] mb-4">
                Send Direct Message
              </h3>
              <EnquiryForm
                compact
                propertyId={property.id}
                defaultPropertyInterest={property.title}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Image Lightbox */}
      {lightboxOpen && currentImg && (
        <div
          className="fixed inset-0 z-50 bg-[#101C32]/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image preview"
            className="absolute top-4 right-4 w-11 h-11 rounded-sm bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentImg}
            alt={property.title}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88vh] object-contain rounded-sm"
          />
        </div>
      )}
    </>
  );
}

