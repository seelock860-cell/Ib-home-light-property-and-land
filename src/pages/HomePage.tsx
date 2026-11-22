import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Fuel,
  Home,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { BRAND_IMAGES, buildWhatsAppUrl } from '../lib/constants';
import { PropertyCard } from '../components/PropertyCard';
import { SmartImage } from '../components/SmartImage';
import { SeoHead } from '../components/SeoHead';

export function HomePage() {
  const { settings, properties, loading } = useSite();
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.company_name}, I would like to explore available properties in Port Harcourt.`
  );

  const displayProperties = [
    ...properties.filter((p) => p.is_featured),
    ...properties.filter((p) => !p.is_featured),
  ].slice(0, 12);

  return (
    <>
      <SeoHead
        title={`${settings.company_name} | Real Estate in Port Harcourt`}
        description="Discover houses for sale, verified land, commercial properties, and fuel station opportunities in Port Harcourt, Rivers State with IB Home Light Property And Land."
      />

      {/* 1. HERO SECTION */}
      <section className="relative bg-[#101C32] text-white overflow-hidden">
        <div className="absolute inset-0">
          <SmartImage
            src={BRAND_IMAGES.heroVilla}
            alt="Luxury modern residential villa in Port Harcourt, Rivers State"
            fallbackTitle="IB Home Light Property And Land"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101C32]/92 via-[#101C32]/75 to-[#101C32]/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#D6AD32] tracking-wide mb-4">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{settings.hero_location_label}</span>
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6 [text-wrap:balance]">
              {settings.hero_heading}
            </h1>

            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl mb-9">
              {settings.hero_description}
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                to="/properties"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors duration-200 whitespace-nowrap"
              >
                <span>Explore Properties</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white border border-white/40 hover:border-[#D6AD32] hover:text-[#D6AD32] rounded-sm transition-colors duration-200 whitespace-nowrap"
              >
                <span>Contact Us</span>
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors duration-200 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp Now</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURED / PUBLISHED PROPERTIES SECTION */}
      <section className="py-16 sm:py-24 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-semibold text-[#B58F21] mb-2">
                Curated Port Harcourt Portfolio
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#101C32] tracking-tight">
                Available Properties & Land
              </h2>
            </div>
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#101C32] hover:text-[#B58F21] transition-colors whitespace-nowrap"
            >
              <span>View All Properties</span>
              <ArrowRight className="w-4 h-4 text-[#D6AD32]" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#101C32]/10 rounded-sm overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-[#101C32]/10" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-[#101C32]/10 w-1/3 rounded-sm" />
                    <div className="h-5 bg-[#101C32]/10 w-3/4 rounded-sm" />
                    <div className="h-4 bg-[#101C32]/10 w-full rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#101C32]/12 rounded-sm p-10 sm:p-14 text-center max-w-3xl mx-auto">
              <Building2 className="w-10 h-10 text-[#D6AD32] mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="font-display text-2xl font-bold text-[#101C32] mb-3">
                Verified Listings Updated Directly by Our Advisory Team
              </h3>
              <p className="text-sm sm:text-base text-[#202020]/75 leading-relaxed mb-7">
                Every house, land parcel, commercial plaza, and fuel station opportunity is vetted for authentic title documentation before publication. Contact us directly on WhatsApp or visit our Igwuruta office for current private and off-market opportunities in Port Harcourt.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Request Current Inventory</span>
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#101C32] border border-[#101C32]/25 hover:border-[#D6AD32] rounded-sm transition-colors"
                >
                  <span>Schedule Consultation</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. SERVICES BENTO SHOWCASE */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#101C32]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-semibold text-[#B58F21] mb-2">
                Core Capabilities
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#101C32] tracking-tight">
                Real Estate & Investment Services
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#101C32] hover:text-[#B58F21] transition-colors whitespace-nowrap"
            >
              <span>Explore All Services</span>
              <ArrowRight className="w-4 h-4 text-[#D6AD32]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group relative rounded-sm overflow-hidden border border-[#101C32]/12 bg-[#101C32] text-white min-h-[320px] flex items-end">
              <SmartImage
                src={BRAND_IMAGES.serviceHouses}
                alt="Modern residential houses for sale in Port Harcourt"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101C32] via-[#101C32]/65 to-transparent" />
              <div className="relative p-7">
                <p className="text-xs font-semibold text-[#D6AD32] mb-2 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>01. House & Residential Sales</span>
                </p>
                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  Luxury Duplexes & Family Residences
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Move-in-ready homes and gated estate residences across GRA, Igwuruta, Rukpokwu, and key Port Harcourt corridors.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-sm overflow-hidden border border-[#101C32]/12 bg-[#101C32] text-white min-h-[320px] flex items-end">
              <SmartImage
                src={BRAND_IMAGES.serviceLand}
                alt="Verified dry land for sale in Port Harcourt"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101C32] via-[#101C32]/70 to-transparent" />
              <div className="relative p-7">
                <p className="text-xs font-semibold text-[#D6AD32] mb-2 flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  <span>02. Verified Land Sales</span>
                </p>
                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  Dry Plots & Acreage
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Surveyed, encumbrance-free residential and commercial land with verified title documentation.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative rounded-sm overflow-hidden border border-[#101C32]/12 bg-[#101C32] text-white min-h-[320px] flex items-end">
              <SmartImage
                src={BRAND_IMAGES.serviceFuelStation}
                alt="Fuel station property opportunities in Port Harcourt Nigeria"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101C32] via-[#101C32]/65 to-transparent" />
              <div className="relative p-7">
                <p className="text-xs font-semibold text-[#D6AD32] mb-2 flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  <span>03. Fuel Station & Energy Properties</span>
                </p>
                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  Turnkey Filling Stations & Highway Corridors
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Specialized brokerage for operational fuel stations and approved highway sites across Rivers State and neighboring commercial routes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ABOUT & TRUST SPLIT */}
      <section className="py-16 sm:py-24 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">
            <div className="relative rounded-sm overflow-hidden border border-[#101C32]/12 min-h-[340px]">
              <SmartImage
                src={BRAND_IMAGES.aboutArchitecture}
                alt="IB Home Light Property And Land interior craftsmanship"
                className="w-full h-full lg:h-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-center space-y-6">
              <div>
                <p className="text-sm font-semibold text-[#B58F21] mb-2">
                  About {settings.company_name}
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#101C32] tracking-tight mb-4 [text-wrap:balance]">
                  Transparent Title Verification & Enduring Value in Rivers State
                </h2>
                <p className="text-base text-[#202020]/80 leading-relaxed">
                  Headquartered in Igwuruta, Port Harcourt, we guide individual homeowners, diaspora investors, and institutional buyers through secure acquisitions—covering residential homes, dry estate plots, commercial buildings, and specialized fuel station properties.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="bg-white p-5 border border-[#101C32]/10 rounded-sm">
                  <ShieldCheck className="w-6 h-6 text-[#D6AD32] mb-2.5" />
                  <h3 className="font-display text-lg font-semibold text-[#101C32] mb-1">
                    Due Diligence First
                  </h3>
                  <p className="text-xs sm:text-sm text-[#202020]/75 leading-relaxed">
                    Physical site inspection, boundary confirmation, and legal document verification before transaction.
                  </p>
                </div>

                <div className="bg-white p-5 border border-[#101C32]/10 rounded-sm">
                  <TrendingUp className="w-6 h-6 text-[#D6AD32] mb-2.5" />
                  <h3 className="font-display text-lg font-semibold text-[#101C32] mb-1">
                    Investment Clarity
                  </h3>
                  <p className="text-xs sm:text-sm text-[#202020]/75 leading-relaxed">
                    Honest market guidance tailored to high-appreciation corridors in Port Harcourt and beyond.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm transition-colors"
                >
                  <span>Discover Our Story & Values</span>
                  <ArrowRight className="w-4 h-4 text-[#D6AD32]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONTACT CONVERSION BAND */}
      <section className="bg-[#101C32] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#D6AD32] mb-2">
              Direct Advisory Desk
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Ready to Inspect a Property or Discuss an Acquisition?
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              Visit us at {settings.office_address} or connect instantly with our Port Harcourt team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 shrink-0">
            <a
              href={`tel:${settings.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors whitespace-nowrap"
            >
              <Phone className="w-4 h-4" />
              <span className="tabular-nums">{settings.phone}</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Now</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
