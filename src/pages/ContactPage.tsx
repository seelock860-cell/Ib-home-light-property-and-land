import React from 'react';
import { Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { buildInstagramUrl, buildWhatsAppUrl } from '../lib/constants';
import { EnquiryForm } from '../components/EnquiryForm';
import { SeoHead } from '../components/SeoHead';

export function ContactPage() {
  const { settings, properties } = useSite();
  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.company_name}, I would like to schedule a property enquiry or consultation.`
  );
  const instagramUrl = buildInstagramUrl(settings.instagram);
  const telHref = `tel:${settings.phone.replace(/\s+/g, '')}`;
  const emailAddress = settings.email || 'Ibilateberepele17@gmail.com';
  const propertyTitles = properties.map((p) => p.title);

  return (
    <>
      <SeoHead
        title={`Contact Us | ${settings.company_name}`}
        description={`Contact ${settings.company_name} in Port Harcourt. Call ${settings.phone}, message on WhatsApp, or visit ${settings.office_address}`}
      />

      <section className="bg-[#101C32] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[#D6AD32] mb-2">
            Get In Touch
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Contact {settings.company_name}
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl">
            Reach our Port Harcourt advisory desk by phone, WhatsApp, Instagram, or visit our office in Igwuruta.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#101C32] mb-2">
                  Office & Direct Lines
                </h2>
                <p className="text-sm text-[#202020]/75 leading-relaxed">
                  {settings.company_name}
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#D6AD32] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#101C32]">Office Address</p>
                    <p className="text-[#202020]/80 mt-0.5">{settings.office_address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#D6AD32] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#101C32]">Phone</p>
                    <p className="text-[#202020]/80 mt-0.5 tabular-nums">{settings.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#101C32]">WhatsApp</p>
                    <p className="text-[#202020]/80 mt-0.5 tabular-nums">{settings.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Instagram className="w-5 h-5 text-[#D6AD32] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#101C32]">Instagram</p>
                    <p className="text-[#202020]/80 mt-0.5">{settings.instagram}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#D6AD32] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#101C32]">Email</p>
                    <a
                      href={`mailto:${emailAddress}`}
                      className="text-[#202020]/80 hover:text-[#101C32] mt-0.5 block break-all"
                    >
                      {emailAddress}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#101C32]/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <a
                  href={telHref}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm transition-colors whitespace-nowrap"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D6AD32]" />
                  <span>Call Now</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors whitespace-nowrap"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>

            {/* Google Maps Location Section */}
            <div className="bg-white border border-[#101C32]/12 rounded-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#101C32]/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#101C32]">
                  Igwuruta, Port Harcourt Location
                </h3>
                <a
                  href="https://maps.google.com/?q=Army+Range+Igwuruta+Port+Harcourt+Nigeria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#B58F21] hover:underline"
                >
                  Open in Maps
                </a>
              </div>
              <div className="aspect-[16/10] bg-[#101C32]/5">
                <iframe
                  title="IB Home Light Property And Land Office Location"
                  src="https://www.google.com/maps?q=Army+Range+Igwuruta+Port+Harcourt+Rivers+State+Nigeria&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-10">
              <p className="text-sm font-semibold text-[#B58F21] mb-1">
                Property Enquiry Form
              </p>
              <h2 className="font-display text-3xl font-bold text-[#101C32] mb-2">
                Send Us a Direct Message
              </h2>
              <p className="text-sm text-[#202020]/75 mb-7">
                Complete the form below and our team will contact you promptly with verified property options and inspection availability.
              </p>

              <EnquiryForm propertyOptions={propertyTitles} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
