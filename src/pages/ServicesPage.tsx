import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Fuel,
  Home,
  Landmark,
  MessageCircle,
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { BRAND_IMAGES, buildWhatsAppUrl } from '../lib/constants';
import { SmartImage } from '../components/SmartImage';
import { SeoHead } from '../components/SeoHead';

const SERVICES = [
  {
    number: '01',
    title: 'House Sales',
    category: 'Houses for Sale',
    description:
      'Acquisition and sales of modern residential homes, detached duplexes, and family residences across prime Port Harcourt estates.',
    image: BRAND_IMAGES.serviceHouses,
    icon: Home,
  },
  {
    number: '02',
    title: 'Land Sales',
    category: 'Lands for Sale',
    description:
      'Verified dry residential, commercial, and estate development plots with clear survey plans and authentic title documentation.',
    image: BRAND_IMAGES.serviceLand,
    icon: Landmark,
  },
  {
    number: '03',
    title: 'Fuel Station Property Opportunities',
    category: 'Fuel Station Properties',
    description:
      'Dedicated brokerage for turnkey filling stations, highway petrol station sites, and downstream energy real estate assets.',
    image: BRAND_IMAGES.serviceFuelStation,
    icon: Fuel,
  },
];

export function ServicesPage() {
  const { settings } = useSite();

  return (
    <>
      <SeoHead
        title={`Our Services | ${settings.company_name}`}
        description="House sales, land sales, and fuel station property opportunities in Port Harcourt."
      />

      <section className="bg-[#101C32] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[#D6AD32] mb-2">
            What We Deliver
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Our Real Estate Services
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed">
            Comprehensive brokerage, land verification, and specialized commercial property advisory tailored to Port Harcourt and Rivers State.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {SERVICES.map((svc) => {
            const Icon = svc.icon;
            const waUrl = buildWhatsAppUrl(
              settings.whatsapp,
              `Hello ${settings.company_name}, I would like to enquire about ${svc.title}.`
            );

            return (
              <article
                key={svc.number}
                className="bg-white border border-[#101C32]/12 rounded-sm overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-[#101C32] overflow-hidden">
                  <SmartImage
                    src={svc.image}
                    alt={svc.title}
                    fallbackTitle={svc.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101C32]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2 text-xs font-semibold text-[#D6AD32]">
                    <Icon className="w-4 h-4" />
                    <span>{svc.number}. {svc.title}</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h2 className="font-display text-2xl font-bold text-[#101C32] mb-2.5">
                    {svc.title}
                  </h2>
                  <p className="text-sm text-[#202020]/80 leading-relaxed mb-6 flex-1">
                    {svc.description}
                  </p>

                  <div className="pt-4 border-t border-[#101C32]/10 flex items-center gap-2.5">
                    {svc.category ? (
                      <Link
                        to={`/properties?category=${encodeURIComponent(svc.category)}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm transition-colors whitespace-nowrap"
                      >
                        <span>View Listings</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D6AD32]" />
                      </Link>
                    ) : (
                      <Link
                        to="/contact"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm transition-colors whitespace-nowrap"
                      >
                        <span>Book Consultation</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D6AD32]" />
                      </Link>
                    )}

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
