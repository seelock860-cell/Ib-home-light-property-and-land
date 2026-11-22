import React, { useEffect, useMemo, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { BRAND_IMAGES } from '../lib/constants';
import { SmartImage } from '../components/SmartImage';
import { SeoHead } from '../components/SeoHead';

interface GalleryDisplayItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
}

const PORTFOLIO_HIGHLIGHTS: GalleryDisplayItem[] = [
  {
    id: 'showcase-villa',
    title: 'Contemporary Port Harcourt Residential Architecture',
    category: 'Architectural Showcase',
    image_url: BRAND_IMAGES.heroVilla,
  },
  {
    id: 'showcase-duplex',
    title: 'Modern Gated Estate Residence',
    category: 'Residential Portfolio',
    image_url: BRAND_IMAGES.serviceHouses,
  },
  {
    id: 'showcase-land',
    title: 'Surveyed Estate Land & Paved Access Corridor',
    category: 'Land Development',
    image_url: BRAND_IMAGES.serviceLand,
  },
  {
    id: 'showcase-commercial',
    title: 'Metropolitan Commercial & Office Complex',
    category: 'Commercial Assets',
    image_url: BRAND_IMAGES.serviceCommercial,
  },
  {
    id: 'showcase-fuel',
    title: 'Modern Highway Fuel Station Forecourt',
    category: 'Fuel Station Opportunities',
    image_url: BRAND_IMAGES.serviceFuelStation,
  },
  {
    id: 'showcase-interior',
    title: 'Bespoke Interior & Travertine Living Space',
    category: 'Interior Design',
    image_url: BRAND_IMAGES.aboutArchitecture,
  },
];

export function GalleryPage() {
  const { settings, gallery, properties } = useSite();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<GalleryDisplayItem | null>(null);

  const combinedItems = useMemo(() => {
    const adminMedia: GalleryDisplayItem[] = gallery.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category || 'Property Photography',
      image_url: g.image_url,
    }));

    const propertyPhotos: GalleryDisplayItem[] = [];
    for (const p of properties) {
      for (const img of p.images || []) {
        if (!adminMedia.some((m) => m.image_url === img.image_url)) {
          propertyPhotos.push({
            id: img.id || `${p.id}-${img.image_url}`,
            title: img.caption || p.title,
            category: p.category_name,
            image_url: img.image_url,
          });
        }
      }
    }

    const uploaded = [...adminMedia, ...propertyPhotos];
    return uploaded.length > 0 ? uploaded : PORTFOLIO_HIGHLIGHTS;
  }, [gallery, properties]);

  const categories = useMemo(() => {
    const set = new Set(combinedItems.map((item) => item.category));
    return ['All', ...Array.from(set)];
  }, [combinedItems]);

  const visibleItems = useMemo(() => {
    if (activeCategory === 'All') return combinedItems;
    return combinedItems.filter((item) => item.category === activeCategory);
  }, [combinedItems, activeCategory]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedItem(null);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <SeoHead
        title={`Property Gallery | ${settings.company_name}`}
        description="Browse curated real estate photography of residential homes, surveyed land, commercial plazas, and fuel station assets in Port Harcourt."
      />

      <section className="bg-[#101C32] text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-[#D6AD32] mb-2">
            Visual Portfolio
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Property Gallery
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl">
            Explore photographs of properties, estate developments, and commercial real estate opportunities curated by our team.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#F8F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-sm transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[#101C32] text-white'
                    : 'bg-white text-[#101C32] border border-[#101C32]/12 hover:border-[#D6AD32]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Responsive Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="group text-left bg-white border border-[#101C32]/12 hover:border-[#D6AD32] rounded-sm overflow-hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AD32]"
              >
                <div className="relative aspect-[4/3] bg-[#101C32] overflow-hidden">
                  <SmartImage
                    src={item.image_url}
                    alt={item.title}
                    fallbackTitle={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#101C32]/0 group-hover:bg-[#101C32]/35 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#101C32] text-white rounded-sm">
                      <Maximize2 className="w-3.5 h-3.5 text-[#D6AD32]" />
                      <span>Enlarge Photo</span>
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#B58F21] font-semibold mb-1">{item.category}</p>
                  <h2 className="font-display text-lg font-semibold text-[#101C32] line-clamp-1">
                    {item.title}
                  </h2>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-[#101C32]/95 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            aria-label="Close enlarged photo"
            className="absolute top-4 right-4 w-11 h-11 rounded-sm bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="max-w-5xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedItem.image_url}
              alt={selectedItem.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-sm"
            />
            <div className="mt-4 text-center text-white">
              <p className="text-xs font-semibold text-[#D6AD32]">{selectedItem.category}</p>
              <p className="font-display text-xl font-semibold mt-1">{selectedItem.title}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
