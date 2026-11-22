import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { DEFAULT_SETTINGS } from '../lib/constants';
import { GalleryItem, Property, PropertyCategory, WebsiteSettings } from '../types';

interface SiteContextValue {
  settings: WebsiteSettings;
  categories: PropertyCategory[];
  properties: Property[];
  gallery: GalleryItem[];
  loading: boolean;
  error: string | null;
  refreshSiteData: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue>({
  settings: DEFAULT_SETTINGS,
  categories: [],
  properties: [],
  gallery: [],
  loading: true,
  error: null,
  refreshSiteData: async () => {},
});

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAtRef = useRef<number>(0);

  const refreshSiteData = useCallback(async () => {
    try {
      setError(null);
      lastFetchedAtRef.current = Date.now();
      const data = await api.getPublicBootstrap();
      setSettings(data.settings || DEFAULT_SETTINGS);
      setCategories(data.categories || []);
      setProperties(data.properties || []);
      setGallery(data.gallery || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load website data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSiteData();

    const maybeRefresh = () => {
      if (Date.now() - lastFetchedAtRef.current > 2000) {
        refreshSiteData();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        maybeRefresh();
      }
    };

    window.addEventListener('focus', maybeRefresh);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', maybeRefresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshSiteData]);

  return (
    <SiteContext.Provider
      value={{
        settings,
        categories,
        properties,
        gallery,
        loading,
        error,
        refreshSiteData,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
