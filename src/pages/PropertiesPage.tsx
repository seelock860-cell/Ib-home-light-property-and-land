import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Building2, MessageCircle, SlidersHorizontal, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { PROPERTY_FILTER_CATEGORIES, buildWhatsAppUrl } from '../lib/constants';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

export function PropertiesPage() {
  const { settings, properties, loading } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const categoryList = useMemo(() => [...PROPERTY_FILTER_CATEGORIES], []);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (selectedCategory === 'All') return true;
      if (prop.category_name === selectedCategory) return true;
      // Support legacy category names cleanly
      if (selectedCategory === 'Land' && prop.category_name === 'Lands for Sale') return true;
      if (
        selectedCategory === 'Other' &&
        (prop.category_name === 'Residential Properties' ||
          prop.category_name === 'Investment Properties')
      ) {
        return true;
      }
      if (
        selectedCategory === 'Duplex' &&
        prop.category_name === 'Houses for Sale' &&
        `${prop.title} ${prop.short_description}`.toLowerCase().includes('duplex')
      ) {
        return true;
      }
      return false;
    });
  }, [properties, selectedCategory]);

  function handleCategoryChange(cat: string) {
    setSelectedCategory(cat);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams, { replace: true });
  }

  function resetFilters() {
    handleCategoryChange('All');
  }

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.company_name}, I would like to enquire about available properties in Port Harcourt.`
  );

  return (
    <>
      <SeoHead
        title={`Properties for Sale & Rent in Port Harcourt | ${settings.company_name}`}
        description="Browse verified houses, duplexes, self-contained flats, dry land, and fuel station properties for sale or rent in Port Harcourt, Rivers State."
        keywords="Properties in Port Harcourt, Houses for sale Port Harcourt, Land for sale Igwuruta, Duplexes for sale Rivers State, Self-contained apartments Port Harcourt"
        canonicalPath="/properties"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `Property Listings — ${settings.company_name}`,
          url: 'https://ibhomelightpropertyandland.com/properties',
          description:
            'Verified houses, land, commercial assets, and fuel station opportunities in Port Harcourt, Rivers State.',
        }}
      />

      <section className="bg-[#101C32] text-white pt-14 pb-16 sm:pt-18 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[#D6AD32] mb-2">
            Property Marketplace
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            Verified Properties in Port Harcourt
          </h1>
          <p className="text-base text-white/80 max-w-2xl">
            Browse our verified portfolio by property category across Port Harcourt and Rivers State.
          </p>
        </div>
      </section>

      <section className="pb-12 sm:pb-16 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Card (replacing search/dropdown filter box) */}
          <div className="-mt-8 relative z-10 bg-white rounded-2xl border border-[#101C32]/10 shadow-sm p-5 sm:p-6 mb-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleCategoryChange('All')}
                className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                  selectedCategory === 'All'
                    ? 'bg-[#101C32] text-white'
                    : 'bg-[#F1F5F9] text-[#101C32] hover:bg-[#101C32]/10'
                }`}
              >
                All Categories
              </button>
              {categoryList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#101C32] text-white'
                      : 'bg-[#F1F5F9] text-[#101C32] hover:bg-[#101C32]/10'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 ml-auto px-3 py-2 text-xs font-semibold text-[#B58F21] hover:text-[#101C32] whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Show All</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6 text-sm text-[#202020]/75">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#D6AD32]" />
              <span className="tabular-nums font-medium text-[#101C32]">
                {filteredProperties.length}
              </span>{' '}
              {filteredProperties.length === 1 ? 'property' : 'properties'} found
            </span>
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
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#101C32]/12 rounded-sm p-10 sm:p-14 text-center max-w-2xl mx-auto">
              <Building2 className="w-10 h-10 text-[#D6AD32] mx-auto mb-4" strokeWidth={1.5} />
              <h2 className="font-display text-2xl font-bold text-[#101C32] mb-2">
                {properties.length === 0
                  ? 'New Verified Listings Coming Soon'
                  : 'No Properties Found in This Category'}
              </h2>
              <p className="text-sm text-[#202020]/75 leading-relaxed mb-6">
                {properties.length === 0
                  ? 'We only publish genuine properties approved by our administration team. Reach out directly on WhatsApp or via our enquiry form to receive immediate options matching your budget in Port Harcourt.'
                  : 'Select another category above or message our advisory desk directly for off-market options.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {properties.length > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-5 py-2.5 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors"
                  >
                    Show All Categories
                  </button>
                )}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enquire on WhatsApp</span>
                </a>
                <Link
                  to="/contact"
                  className="px-5 py-2.5 text-sm font-semibold text-[#101C32] border border-[#101C32]/25 hover:border-[#D6AD32] rounded-sm transition-colors"
                >
                  Submit Property Request
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
