import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { OFFICIAL_CATEGORIES, buildInstagramUrl, buildWhatsAppUrl } from '../lib/constants';

export function Footer() {
  const { settings } = useSite();
  const whatsappHref = buildWhatsAppUrl(settings.whatsapp);
  const instagramHref = buildInstagramUrl(settings.instagram);
  const telHref = `tel:${settings.phone.replace(/\s+/g, '')}`;
  const emailAddress = settings.email || 'Ibilateberepele17@gmail.com';

  return (
    <footer className="bg-[#101C32] text-white border-t border-[#D6AD32]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-white">
              <span className="w-9 h-9 rounded-sm bg-[#D6AD32] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#101C32]" strokeWidth={1.8} />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">
                {settings.company_name}
              </span>
            </Link>
            <p className="text-sm text-white/75 leading-relaxed">
              {settings.company_description}
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-[#D6AD32] mb-4 font-sans">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link to="/" className="hover:text-[#D6AD32] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#D6AD32] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-[#D6AD32] transition-colors">
                  Property Listings
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#D6AD32] transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-[#D6AD32] transition-colors">
                  Property Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#D6AD32] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Property Categories */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-[#D6AD32] mb-4 font-sans">
              Property Categories
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              {OFFICIAL_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    to={`/properties?category=${encodeURIComponent(category)}`}
                    className="hover:text-[#D6AD32] transition-colors"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-[#D6AD32] mb-4 font-sans">
              Port Harcourt Office
            </h3>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D6AD32] shrink-0 mt-0.5" />
                <span>{settings.office_address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D6AD32] shrink-0" />
                <a href={telHref} className="hover:text-[#D6AD32] transition-colors tabular-nums">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D6AD32] transition-colors"
                >
                  WhatsApp: {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Instagram className="w-4 h-4 text-[#D6AD32] shrink-0" />
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D6AD32] transition-colors"
                >
                  {settings.instagram}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D6AD32] shrink-0" />
                <a
                  href={`mailto:${emailAddress}`}
                  className="hover:text-[#D6AD32] transition-colors break-all"
                >
                  {emailAddress}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>
            &copy; {new Date().getFullYear()} {settings.company_name}. All rights reserved.
          </p>
          <p>Port Harcourt, Rivers State · Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
