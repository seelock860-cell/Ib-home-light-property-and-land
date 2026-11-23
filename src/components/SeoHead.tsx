import { useEffect } from 'react';
import { DEFAULT_OG_IMAGE, SITE_URL } from '../lib/constants';

interface SeoHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function resolveCanonicalUrl(canonicalPath?: string): string {
  const path = canonicalPath ?? window.location.pathname;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath === '/' ? '/' : cleanPath.replace(/\/+$/, '')}`;
}

function resolveAbsoluteImageUrl(img?: string): string {
  if (!img || !img.trim()) return DEFAULT_OG_IMAGE;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return `${SITE_URL}${img.startsWith('/') ? img : `/${img}`}`;
}

export function SeoHead({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage,
  ogType = 'website',
  noIndex = false,
  structuredData,
}: SeoHeadProps) {
  const serializedSchema = structuredData ? JSON.stringify(structuredData) : '';

  useEffect(() => {
    const canonicalUrl = resolveCanonicalUrl(canonicalPath);
    const resolvedImage = resolveAbsoluteImageUrl(ogImage);
    const robotsValue = noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    document.title = title;
    upsertMeta('name', 'description', description);
    if (keywords) {
      upsertMeta('name', 'keywords', keywords);
    }
    upsertMeta('name', 'robots', robotsValue);
    upsertMeta('name', 'googlebot', robotsValue);
    upsertCanonical(canonicalUrl);

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', resolvedImage);

    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', resolvedImage);

    const existingScript = document.querySelector('script[data-seo-head="true"]');
    if (serializedSchema) {
      const script = existingScript || document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo-head', 'true');
      script.textContent = serializedSchema;
      if (!existingScript) {
        document.head.appendChild(script);
      }
    } else if (existingScript) {
      existingScript.remove();
    }

    return () => {
      const dynamicScript = document.querySelector('script[data-seo-head="true"]');
      if (dynamicScript) {
        dynamicScript.remove();
      }
    };
  }, [title, description, keywords, canonicalPath, ogImage, ogType, noIndex, serializedSchema]);

  return null;
}
