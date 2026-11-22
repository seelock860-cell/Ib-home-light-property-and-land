import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Building2, CheckCircle2, Compass, Eye, ShieldCheck } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { BRAND_IMAGES } from '../lib/constants';
import { SmartImage } from '../components/SmartImage';
import { SeoHead } from '../components/SeoHead';

const VALUES = [
  {
    title: 'Verified Documentation',
    description:
      'Every transaction prioritizes authentic survey plans, deeds of conveyance, and clear title verification before commitment.',
    icon: ShieldCheck,
  },
  {
    title: 'Client-First Transparency',
    description:
      'Straightforward pricing, physical site inspections, and clear communication from initial enquiry to key handover.',
    icon: CheckCircle2,
  },
  {
    title: 'Port Harcourt Market Mastery',
    description:
      'Deep local knowledge across Igwuruta, GRA, Eneka, Ada George, Eleme, and high-growth Rivers State corridors.',
    icon: Compass,
  },
  {
    title: 'Long-Term Asset Value',
    description:
      'We advise buyers and commercial investors on locations with strong infrastructure growth and enduring resale demand.',
    icon: Award,
  },
];

export function AboutPage() {
  const { settings } = useSite();

  return (
    <>
      <SeoHead
        title={`About Us | ${settings.company_name}`}
        description="Learn about IB Home Light Property And Land — our mission, vision, values, and real estate advisory services in Port Harcourt, Rivers State."
      />

      {/* Page Header */}
      <section className="bg-[#101C32] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[#D6AD32] mb-2">
            Port Harcourt, Rivers State · Nigeria
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            About {settings.company_name}
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed">
            {settings.company_description}
          </p>
        </div>
      </section>

      {/* Company Introduction */}
      <section className="py-16 sm:py-20 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            <div className="rounded-sm overflow-hidden border border-[#101C32]/12 min-h-[340px]">
              <SmartImage
                src={BRAND_IMAGES.aboutArchitecture}
                alt="IB Home Light Property And Land modern architectural interior"
                className="w-full h-full lg:h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center space-y-5">
              <h2 className="font-display text-3xl font-bold text-[#101C32] tracking-tight">
                A Trusted Real Estate Partner Built on Integrity & Results
              </h2>
              <p className="text-base text-[#202020]/80 leading-relaxed">
                Operating from {settings.office_address}, IB Home Light Property And Land connects discerning buyers, families, and commercial enterprises with verified houses, dry land, commercial buildings, and specialized fuel station properties across Rivers State.
              </p>
              <p className="text-base text-[#202020]/80 leading-relaxed">
                Buying property in Nigeria requires more than a listing—it requires reliable ground verification, honest pricing advice, and responsive personal support. Our team accompanies clients through every stage, from site inspection and legal diligence to final acquisition.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/properties"
                  className="px-6 py-3 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors"
                >
                  Browse Available Properties
                </Link>
                <Link
                  to="/contact"
                  className="px-6 py-3 text-sm font-semibold text-[#101C32] border border-[#101C32]/25 hover:border-[#101C32] rounded-sm transition-colors"
                >
                  Speak With Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white border-y border-[#101C32]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-[#101C32] text-white rounded-sm">
            <Building2 className="w-8 h-8 text-[#D6AD32] mb-4" strokeWidth={1.6} />
            <h2 className="font-display text-2xl font-bold text-white mb-3">Our Mission</h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              To simplify residential, commercial, and land ownership in Port Harcourt and across Nigeria by providing thoroughly vetted properties, transparent advisory, and seamless customer care that protects every client’s investment.
            </p>
          </div>

          <div className="p-8 bg-[#F8F7F3] border border-[#101C32]/12 rounded-sm">
            <Eye className="w-8 h-8 text-[#D6AD32] mb-4" strokeWidth={1.6} />
            <h2 className="font-display text-2xl font-bold text-[#101C32] mb-3">Our Vision</h2>
            <p className="text-sm sm:text-base text-[#202020]/80 leading-relaxed">
              To be the premier, most trusted real estate brokerage and property advisory brand in Rivers State—recognized for genuine land titles, high-performing commercial and fuel station opportunities, and lasting client relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Business Values */}
      <section className="py-16 sm:py-20 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-[#B58F21] mb-2">Business Values</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#101C32] tracking-tight">
              Principles That Guide Every Transaction
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className="bg-white p-6 border border-[#101C32]/12 rounded-sm"
                >
                  <Icon className="w-7 h-7 text-[#D6AD32] mb-4" strokeWidth={1.6} />
                  <h3 className="font-display text-xl font-semibold text-[#101C32] mb-2">
                    {val.title}
                  </h3>
                  <p className="text-sm text-[#202020]/75 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
