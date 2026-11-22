import {
  clearRuntimeSupabaseConfig,
  getSupabaseClient,
  getSupabaseConfigInfo,
  getSupabaseCredentials,
  initRuntimeSupabaseFromServer,
  setRuntimeSupabaseConfig,
} from './supabase';
import { DEFAULT_FEE_VISIBILITY, DEFAULT_SETTINGS, slugifyText } from './constants';
import {
  AdminUser,
  Customer,
  DashboardStats,
  Enquiry,
  EnquiryStatus,
  GalleryItem,
  Property,
  PropertyCategory,
  PropertyImage,
  PropertyVideo,
  WebsiteSettings,
} from '../types';

export interface SupabaseProbeResult {
  url: string;
  reachable: boolean;
  schemaReady: boolean;
  propertiesReady: boolean;
  videosReady: boolean;
  storageReady: boolean;
  error?: string;
}

export interface SupabaseConnectionStatus {
  configured: boolean;
  source: 'env' | 'dashboard' | 'none';
  url: string;
  masked_key: string;
  connected_at: string | null;
}

const LOCAL_TOKEN_KEY = 'ib_admin_session_token';

function getStoredLocalToken(): string | null {
  try {
    return window.sessionStorage.getItem(LOCAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredLocalToken(token: string | null) {
  try {
    if (token) {
      window.sessionStorage.setItem(LOCAL_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(LOCAL_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

class PreviewApiUnavailableError extends Error {
  constructor() {
    super('Preview server API is unavailable in static deployment.');
    this.name = 'PreviewApiUnavailableError';
  }
}

function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return trimmed;
  }
}

function maskKey(key: string): string {
  if (!key || key.length < 16) return key ? '••••••••' : '';
  return `${key.slice(0, 12)}••••••••${key.slice(-6)}`;
}

async function probeSupabaseFromBrowser(
  rawUrl: string,
  rawKey: string
): Promise<SupabaseProbeResult> {
  const url = normalizeSupabaseUrl(rawUrl);
  const key = rawKey.trim();
  const result: SupabaseProbeResult = {
    url,
    reachable: false,
    schemaReady: false,
    propertiesReady: false,
    videosReady: false,
    storageReady: false,
  };

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  try {
    const settingsRes = await fetch(
      `${url}/rest/v1/website_settings?select=id&limit=1`,
      { headers }
    );
    const categoriesRes = await fetch(
      `${url}/rest/v1/property_categories?select=id&limit=1`,
      { headers }
    );
    const propertiesRes = await fetch(
      `${url}/rest/v1/properties?select=id&limit=1`,
      { headers }
    );
    const videosRes = await fetch(
      `${url}/rest/v1/property_videos?select=id&limit=1`,
      { headers }
    );

    result.reachable =
      settingsRes.status < 500 &&
      settingsRes.status !== 401 &&
      settingsRes.status !== 403;
    result.schemaReady = settingsRes.ok && categoriesRes.ok;
    result.propertiesReady = propertiesRes.ok;
    result.videosReady = videosRes.ok;

    const bucketRes = await fetch(`${url}/storage/v1/object/list/property-media`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 1 }),
    });
    result.storageReady = bucketRes.ok;
  } catch (err: any) {
    result.error = err?.message || 'Unable to reach Supabase project.';
  }

  return result;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredLocalToken();
  let sbAccessToken: string | null = null;
  if (url.startsWith('/api/admin/supabase')) {
    try {
      const sb = getSupabaseClient();
      if (sb) {
        const { data } = await sb.auth.getSession();
        sbAccessToken = data.session?.access_token || null;
      }
    } catch {
      sbAccessToken = null;
    }
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(sbAccessToken ? { 'X-Supabase-Access-Token': sbAccessToken } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new PreviewApiUnavailableError();
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.startsWith('/api/admin/supabase')) {
    setStoredLocalToken(null);
  }
  if (!res.ok) {
    const err: any = new Error(data.error || `Request failed (${res.status})`);
    if (data.probe) err.probe = data.probe;
    throw err;
  }
  return data as T;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function normalizeProperty(row: any): Property {
  const imgs: PropertyImage[] = Array.isArray(row.property_images)
    ? [...row.property_images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : Array.isArray(row.images)
    ? [...row.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];

  const vids: PropertyVideo[] = Array.isArray(row.property_videos)
    ? [...row.property_videos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : Array.isArray(row.videos)
    ? [...row.videos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category_id: row.category_id,
    category_name: row.category_name,
    listing_type: row.listing_type || 'For Sale',
    location: row.location,
    bedrooms: row.bedrooms !== undefined && row.bedrooms !== null ? Number(row.bedrooms) : null,
    bathrooms: row.bathrooms !== undefined && row.bathrooms !== null ? Number(row.bathrooms) : null,
    property_size: row.property_size || '',
    price: Number(row.price) || 0,
    price_display: row.price_display || '',
    caution_fee: Number(row.caution_fee) || 0,
    drinking_money: Number(row.drinking_money) || 0,
    movement_fee: Number(row.movement_fee) || 0,
    agreement_fee: Number(row.agreement_fee) || 0,
    legal_fee: Number(row.legal_fee) || 0,
    agent_commission_percent: Number(row.agent_commission_percent) || 0,
    agent_commission_amount: Number(row.agent_commission_amount) || 0,
    fee_visibility: { ...DEFAULT_FEE_VISIBILITY, ...(row.fee_visibility || {}) },
    short_description: row.short_description || '',
    full_description: row.full_description || '',
    features: Array.isArray(row.features) ? row.features : [],
    availability: row.availability || 'available',
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    created_at: row.created_at,
    updated_at: row.updated_at,
    images: imgs,
    videos: vids,
  };
}

async function getAdminSupabaseClient() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    if (!data.session?.user) return null;
    return sb;
  } catch {
    return null;
  }
}

export const api = {
  get mode(): 'supabase' | 'local' {
    return getSupabaseClient() ? 'supabase' : 'local';
  },

  // --------------------------------------------------------------------------
  // PUBLIC OPERATIONS
  // --------------------------------------------------------------------------
  async getPublicBootstrap(): Promise<{
    settings: WebsiteSettings;
    categories: PropertyCategory[];
    properties: Property[];
    gallery: GalleryItem[];
  }> {
    await initRuntimeSupabaseFromServer();
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const [settingsRes, categoriesRes, propertiesRes, galleryRes] = await Promise.all([
          sb.from('website_settings').select('*').eq('id', 1).maybeSingle(),
          sb.from('property_categories').select('*').order('sort_order', { ascending: true }),
          sb
            .from('properties')
            .select('*, property_images(*), property_videos(*)')
            .eq('is_published', true)
            .order('created_at', { ascending: false }),
          sb
            .from('gallery_items')
            .select('*')
            .eq('show_in_gallery', true)
            .order('created_at', { ascending: false }),
        ]);

        if (!settingsRes.error && !categoriesRes.error && !propertiesRes.error) {
          const properties = (propertiesRes.data || []).map(normalizeProperty);
          const categories = (categoriesRes.data || []).map((cat: any) => ({
            ...cat,
            property_count: properties.filter((p) => p.category_name === cat.name).length,
          }));

          return {
            settings: settingsRes.data || DEFAULT_SETTINGS,
            categories,
            properties,
            gallery: galleryRes.data || [],
          };
        }
      } catch {
        // Fall back to local server storage if Supabase schema is not yet initialized
      }
    }

    const res = await fetchJson<{
      settings: WebsiteSettings;
      categories: PropertyCategory[];
      properties: any[];
      gallery: GalleryItem[];
    }>('/api/public/bootstrap');
    return {
      ...res,
      properties: (res.properties || []).map(normalizeProperty),
    };
  },

  async getPropertyBySlug(slug: string): Promise<Property | null> {
    await initRuntimeSupabaseFromServer();
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('properties')
          .select('*, property_images(*), property_videos(*)')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (!error && data) {
          return normalizeProperty(data);
        }
      } catch {
        // Fall through to local fallback
      }
    }

    try {
      const res = await fetchJson<{ property: any }>(
        `/api/public/properties/${encodeURIComponent(slug)}`
      );
      return res.property ? normalizeProperty(res.property) : null;
    } catch {
      return null;
    }
  },

  async submitEnquiry(payload: {
    full_name: string;
    phone: string;
    email: string;
    property_id?: string | null;
    property_interest: string;
    message: string;
  }): Promise<void> {
    await initRuntimeSupabaseFromServer();
    const sb = getSupabaseClient();
    if (!sb) {
      await fetchJson('/api/public/enquiries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return;
    }

    const { error } = await sb.from('enquiries').insert({
      full_name: payload.full_name.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      property_id: payload.property_id || null,
      property_interest: payload.property_interest.trim() || 'General Enquiry',
      message: payload.message.trim(),
      status: 'new',
    });

    if (error) throw new Error(error.message);
  },

  // --------------------------------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------------------------------
  async getAuthStatus(): Promise<{
    isProvisioned: boolean;
    authenticated: boolean;
    user: AdminUser | null;
    mode: 'supabase' | 'local';
  }> {
    await initRuntimeSupabaseFromServer();
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data: sessionData } = await sb.auth.getSession();
        if (sessionData.session?.user) {
          const { data: adminRow } = await sb
            .from('admin_users')
            .select('*')
            .eq('auth_user_id', sessionData.session.user.id)
            .maybeSingle();

          if (adminRow) {
            return {
              isProvisioned: true,
              authenticated: true,
              user: {
                id: adminRow.id,
                username: adminRow.username,
                email: adminRow.email,
                full_name: adminRow.full_name,
                role: adminRow.role,
              },
              mode: 'supabase',
            };
          }
        }
      } catch {
        // Fall through to local Express auth check
      }
    }

    try {
      const res = await fetchJson<{
        isProvisioned: boolean;
        authenticated: boolean;
        user: AdminUser | null;
      }>('/api/auth/status');
      return {
        ...res,
        mode: sb && res.authenticated ? 'local' : sb ? 'supabase' : 'local',
      };
    } catch (err) {
      if (sb) {
        return {
          isProvisioned: true,
          authenticated: false,
          user: null,
          mode: 'supabase',
        };
      }
      throw err;
    }
  },

  async provisionInitialAdmin(username: string, password: string): Promise<AdminUser> {
    const res = await fetchJson<{ user: AdminUser; token?: string }>('/api/auth/provision-initial', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.token) setStoredLocalToken(res.token);
    return res.user;
  },

  async loginAdmin(
    usernameOrEmail: string,
    password: string,
    allowEmail = false
  ): Promise<AdminUser> {
    await initRuntimeSupabaseFromServer();
    const sb = getSupabaseClient();
    const trimmedInput = usernameOrEmail.trim();

    if (!allowEmail && trimmedInput.includes('@')) {
      throw new Error('Please sign in using your administrator username.');
    }

    let supabaseAuthError: string | null = null;

    if (sb) {
      try {
        let emailToUse = '';
        if (!trimmedInput.includes('@')) {
          const { data: resolvedEmail, error: rpcError } = await sb.rpc(
            'get_admin_email_by_username',
            { p_username: trimmedInput }
          );
          if (!rpcError && resolvedEmail) {
            emailToUse = resolvedEmail;
          } else {
            supabaseAuthError = 'Invalid administrator username or password.';
          }
        } else if (allowEmail) {
          emailToUse = trimmedInput;
        }

        if (emailToUse.includes('@')) {
          const { data, error } = await sb.auth.signInWithPassword({
            email: emailToUse,
            password,
          });
          if (error) {
            supabaseAuthError = error.message || 'Invalid administrator username or password.';
          } else if (data.user) {
            const { data: adminRow } = await sb
              .from('admin_users')
              .select('*')
              .eq('auth_user_id', data.user.id)
              .maybeSingle();

            if (adminRow) {
              return {
                id: adminRow.id,
                username: adminRow.username,
                email: adminRow.email,
                full_name: adminRow.full_name,
                role: adminRow.role,
              };
            }
            await sb.auth.signOut();
            supabaseAuthError =
              'Account is not linked in admin_users table. Run the Admin Link SQL in Supabase SQL Editor.';
          }
        }
      } catch (err: any) {
        supabaseAuthError = err?.message || 'Unable to authenticate with Supabase.';
      }
    }

    try {
      const res = await fetchJson<{ user: AdminUser; token?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });
      if (res.token) setStoredLocalToken(res.token);
      return res.user;
    } catch (err) {
      if (err instanceof PreviewApiUnavailableError || sb) {
        throw new Error(supabaseAuthError || 'Invalid administrator username or password.');
      }
      throw err;
    }
  },

  async logoutAdmin(): Promise<void> {
    setStoredLocalToken(null);
    await fetchJson('/api/auth/logout', { method: 'POST' }).catch(() => {});
    const sb = getSupabaseClient();
    if (sb) {
      await sb.auth.signOut().catch(() => {});
    }
  },

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      await fetchJson('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return;
    }

    const { data: userData } = await sb.auth.getUser();
    const email = userData.user?.email;
    if (!email) throw new Error('Active administrator session not found.');

    const { error: verifyErr } = await sb.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyErr) {
      throw new Error('Current password is incorrect.');
    }

    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  async changeAdminUsername(newUsername: string, currentPassword: string): Promise<AdminUser> {
    const cleanUsername = newUsername.trim();
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(cleanUsername)) {
      throw new Error(
        'Username must be 3–40 characters and contain only letters, numbers, dots, underscores, or hyphens.'
      );
    }

    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ user: AdminUser; token?: string }>(
        '/api/admin/change-username',
        {
          method: 'POST',
          body: JSON.stringify({ newUsername: cleanUsername, currentPassword }),
        }
      );
      if (res.token) setStoredLocalToken(res.token);
      return res.user;
    }

    const { data: userData } = await sb.auth.getUser();
    const userId = userData.user?.id;
    const email = userData.user?.email;
    if (!userId || !email) throw new Error('Active administrator session not found.');

    const { error: verifyErr } = await sb.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyErr) {
      throw new Error('Current password is incorrect.');
    }

    const { data: updatedRow, error } = await sb
      .from('admin_users')
      .update({ username: cleanUsername })
      .eq('auth_user_id', userId)
      .select()
      .single();

    if (error || !updatedRow) {
      throw new Error(error?.message || 'Unable to update administrator username.');
    }

    return {
      id: updatedRow.id,
      username: updatedRow.username,
      email: updatedRow.email,
      full_name: updatedRow.full_name,
      role: updatedRow.role,
    };
  },

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD & CRUD
  // --------------------------------------------------------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<DashboardStats>('/api/admin/dashboard');
      return {
        ...res,
        unavailableProperties: res.unavailableProperties ?? 0,
        recentProperties: (res.recentProperties || []).map(normalizeProperty),
      };
    }

    const [propsRes, catsRes, enqsRes, custsRes] = await Promise.all([
      sb
        .from('properties')
        .select('*, property_images(*), property_videos(*)')
        .order('created_at', { ascending: false }),
      sb.from('property_categories').select('*').order('sort_order', { ascending: true }),
      sb.from('enquiries').select('*').order('created_at', { ascending: false }),
      sb.from('customers').select('id', { count: 'exact', head: true }),
    ]);

    const props = (propsRes.data || []).map(normalizeProperty);
    const enqs = (enqsRes.data || []) as Enquiry[];
    const cats = catsRes.data || [];

    return {
      totalProperties: props.length,
      availableProperties: props.filter((p) => p.availability === 'available').length,
      soldProperties: props.filter((p) => p.availability === 'sold').length,
      rentedProperties: props.filter((p) => p.availability === 'rented').length,
      unavailableProperties: props.filter((p) => p.availability === 'unavailable').length,
      publishedProperties: props.filter((p) => p.is_published).length,
      totalEnquiries: enqs.length,
      newEnquiries: enqs.filter((e) => e.status === 'new').length,
      contactedEnquiries: enqs.filter((e) => e.status === 'contacted').length,
      completedEnquiries: enqs.filter((e) => e.status === 'completed').length,
      totalCustomers: custsRes.count || 0,
      categoryBreakdown: cats.map((c: any) => ({
        name: c.name,
        count: props.filter((p) => p.category_name === c.name).length,
      })),
      recentEnquiries: enqs.slice(0, 6),
      recentProperties: props.slice(0, 6),
    };
  },

  async getAdminProperties(): Promise<Property[]> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ properties: any[] }>('/api/admin/properties');
      return (res.properties || []).map(normalizeProperty);
    }

    const { data, error } = await sb
      .from('properties')
      .select('*, property_images(*), property_videos(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(normalizeProperty);
  },

  async createProperty(payload: Partial<Property>): Promise<Property> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ property: any }>('/api/admin/properties', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return normalizeProperty(res.property);
    }

    const baseSlug = slugifyText(payload.slug || payload.title || '') || `property-${Date.now()}`;
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: catRow } = await sb
      .from('property_categories')
      .select('id')
      .eq('name', payload.category_name)
      .maybeSingle();

    const { data: propRow, error } = await sb
      .from('properties')
      .insert({
        title: payload.title,
        slug: uniqueSlug,
        category_id: catRow?.id || null,
        category_name: payload.category_name,
        listing_type: payload.listing_type || 'For Sale',
        location: payload.location,
        bedrooms: payload.bedrooms ?? null,
        bathrooms: payload.bathrooms ?? null,
        property_size: payload.property_size || '',
        price: payload.price || 0,
        price_display: payload.price_display || '',
        caution_fee: payload.caution_fee || 0,
        drinking_money: payload.drinking_money || 0,
        movement_fee: payload.movement_fee || 0,
        agreement_fee: payload.agreement_fee || 0,
        legal_fee: payload.legal_fee || 0,
        agent_commission_percent: payload.agent_commission_percent || 0,
        agent_commission_amount: payload.agent_commission_amount || 0,
        fee_visibility: payload.fee_visibility || DEFAULT_FEE_VISIBILITY,
        short_description: payload.short_description || '',
        full_description: payload.full_description || '',
        features: payload.features || [],
        availability: payload.availability || 'available',
        is_featured: Boolean(payload.is_featured),
        is_published: payload.is_published ?? true,
      })
      .select()
      .single();

    if (error || !propRow) throw new Error(error?.message || 'Failed to create property');

    const imgs = payload.images || [];
    if (imgs.length > 0) {
      const { error: imgErr } = await sb.from('property_images').insert(
        imgs.map((img, idx) => ({
          property_id: propRow.id,
          image_url: img.image_url,
          storage_path: img.storage_path || '',
          caption: img.caption || '',
          is_primary: idx === 0 ? true : Boolean(img.is_primary),
          sort_order: idx,
        }))
      );
      if (imgErr) throw new Error(imgErr.message);
    }

    const vids = payload.videos || [];
    if (vids.length > 0) {
      const { error: vidErr } = await sb.from('property_videos').insert(
        vids.map((vid, idx) => ({
          property_id: propRow.id,
          video_url: vid.video_url,
          storage_path: vid.storage_path || '',
          caption: vid.caption || '',
          mime_type: vid.mime_type || 'video/mp4',
          sort_order: idx,
        }))
      );
      if (vidErr) throw new Error(vidErr.message);
    }

    const { data: full } = await sb
      .from('properties')
      .select('*, property_images(*), property_videos(*)')
      .eq('id', propRow.id)
      .single();

    return normalizeProperty(full);
  },

  async updateProperty(id: string, payload: Partial<Property>): Promise<Property> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ property: any }>(`/api/admin/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return normalizeProperty(res.property);
    }

    const updateBody: Record<string, any> = {};
    const fields = [
      'title',
      'slug',
      'category_name',
      'listing_type',
      'location',
      'bedrooms',
      'bathrooms',
      'property_size',
      'price',
      'price_display',
      'caution_fee',
      'drinking_money',
      'movement_fee',
      'agreement_fee',
      'legal_fee',
      'agent_commission_percent',
      'agent_commission_amount',
      'fee_visibility',
      'short_description',
      'full_description',
      'features',
      'availability',
      'is_featured',
      'is_published',
    ] as const;

    for (const f of fields) {
      if ((payload as any)[f] !== undefined) updateBody[f] = (payload as any)[f];
    }

    if (payload.category_name) {
      const { data: catRow } = await sb
        .from('property_categories')
        .select('id')
        .eq('name', payload.category_name)
        .maybeSingle();
      if (catRow) updateBody.category_id = catRow.id;
    }

    const { error } = await sb.from('properties').update(updateBody).eq('id', id);
    if (error) throw new Error(error.message);

    if (Array.isArray(payload.images)) {
      await sb.from('property_images').delete().eq('property_id', id);
      if (payload.images.length > 0) {
        const hasPrimary = payload.images.some((i) => i.is_primary);
        await sb.from('property_images').insert(
          payload.images.map((img, idx) => ({
            property_id: id,
            image_url: img.image_url,
            storage_path: img.storage_path || '',
            caption: img.caption || '',
            is_primary: hasPrimary ? Boolean(img.is_primary) : idx === 0,
            sort_order: idx,
          }))
        );
      }
    }

    if (Array.isArray(payload.videos)) {
      await sb.from('property_videos').delete().eq('property_id', id);
      if (payload.videos.length > 0) {
        await sb.from('property_videos').insert(
          payload.videos.map((vid, idx) => ({
            property_id: id,
            video_url: vid.video_url,
            storage_path: vid.storage_path || '',
            caption: vid.caption || '',
            mime_type: vid.mime_type || 'video/mp4',
            sort_order: idx,
          }))
        );
      }
    }

    const { data: full } = await sb
      .from('properties')
      .select('*, property_images(*), property_videos(*)')
      .eq('id', id)
      .single();

    return normalizeProperty(full);
  },

  async deleteProperty(id: string): Promise<void> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      await fetchJson(`/api/admin/properties/${id}`, { method: 'DELETE' });
      return;
    }
    const { error } = await sb.from('properties').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getAdminCategories(): Promise<PropertyCategory[]> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ categories: PropertyCategory[] }>('/api/admin/categories');
      return res.categories;
    }

    const [catsRes, propsRes] = await Promise.all([
      sb.from('property_categories').select('*').order('sort_order', { ascending: true }),
      sb.from('properties').select('category_name'),
    ]);

    const propList = propsRes.data || [];
    return (catsRes.data || []).map((c: any) => ({
      ...c,
      property_count: propList.filter((p: any) => p.category_name === c.name).length,
    }));
  },

  async createCategory(name: string, description: string): Promise<PropertyCategory> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ category: PropertyCategory }>('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      return res.category;
    }
    const { data, error } = await sb
      .from('property_categories')
      .insert({
        name: name.trim(),
        slug: slugifyText(name),
        description: description.trim(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      await fetchJson(`/api/admin/categories/${id}`, { method: 'DELETE' });
      return;
    }
    const { error } = await sb.from('property_categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getAdminEnquiries(): Promise<Enquiry[]> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ enquiries: Enquiry[] }>('/api/admin/enquiries');
      return res.enquiries;
    }
    const { data, error } = await sb
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ enquiry: Enquiry }>(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return res.enquiry;
    }
    const { data, error } = await sb
      .from('enquiries')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteEnquiry(id: string): Promise<void> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      await fetchJson(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
      return;
    }
    const { error } = await sb.from('enquiries').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getAdminCustomers(): Promise<Customer[]> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ customers: Customer[] }>('/api/admin/customers');
      return res.customers;
    }

    const [custRes, enqRes] = await Promise.all([
      sb.from('customers').select('*').order('updated_at', { ascending: false }),
      sb.from('enquiries').select('*').order('created_at', { ascending: false }),
    ]);

    if (custRes.error) throw new Error(custRes.error.message);
    const allEnqs = (enqRes.data || []) as Enquiry[];

    return (custRes.data || []).map((c: any) => {
      const related = allEnqs.filter((e) => e.customer_id === c.id || e.phone === c.phone);
      return {
        ...c,
        enquiry_count: related.length,
        enquiries: related,
      };
    });
  },

  async getAdminMedia(): Promise<GalleryItem[]> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ items: GalleryItem[] }>('/api/admin/media');
      return res.items;
    }
    const { data, error } = await sb
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async uploadMediaFile(
    file: File,
    meta: { title?: string; category?: string; property_id?: string | null; show_in_gallery?: boolean }
  ): Promise<GalleryItem> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetchJson<{ item: GalleryItem }>('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify({
          dataUrl,
          fileName: file.name,
          title: meta.title || file.name.replace(/\.[^.]+$/, ''),
          category: meta.category || 'Property Media',
          property_id: meta.property_id || null,
          show_in_gallery: meta.show_in_gallery ?? true,
        }),
      });
      return res.item;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadErr } = await sb.storage
      .from('property-media')
      .upload(filePath, file, { upsert: false });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: pub } = sb.storage.from('property-media').getPublicUrl(filePath);
    const { data, error } = await sb
      .from('gallery_items')
      .insert({
        title: meta.title || file.name.replace(/\.[^.]+$/, ''),
        category: meta.category || 'Property Media',
        image_url: pub.publicUrl,
        storage_path: filePath,
        property_id: meta.property_id || null,
        show_in_gallery: meta.show_in_gallery ?? true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async uploadPropertyVideoFile(
    file: File,
    caption?: string
  ): Promise<{ video_url: string; storage_path: string; mime_type: string; caption: string }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const allowedExts = ['mp4', 'mov', 'webm'];
    const resolvedExt = allowedExts.includes(ext)
      ? ext
      : file.type.includes('quicktime')
      ? 'mov'
      : file.type.includes('webm')
      ? 'webm'
      : 'mp4';

    const mimeType =
      file.type ||
      (resolvedExt === 'mov'
        ? 'video/quicktime'
        : resolvedExt === 'webm'
        ? 'video/webm'
        : 'video/mp4');

    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const token = getStoredLocalToken();
      const res = await fetch('/api/admin/media/upload-binary', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': mimeType,
          'X-File-Name': encodeURIComponent(file.name),
          'X-Media-Kind': 'video',
          'X-Title': encodeURIComponent(caption || file.name.replace(/\.[^.]+$/, '')),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Video upload requires an active Supabase administrator session in production.'
        );
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Video upload failed.');
      }
      return {
        video_url: data.url,
        storage_path: data.storage_path || '',
        mime_type: data.mime_type || mimeType,
        caption: caption || file.name.replace(/\.[^.]+$/, ''),
      };
    }

    const filePath = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${resolvedExt}`;
    const { error: uploadErr } = await sb.storage
      .from('property-media')
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: pub } = sb.storage.from('property-media').getPublicUrl(filePath);
    return {
      video_url: pub.publicUrl,
      storage_path: filePath,
      mime_type: mimeType,
      caption: caption || file.name.replace(/\.[^.]+$/, ''),
    };
  },

  async updateMediaItem(
    id: string,
    payload: Partial<Pick<GalleryItem, 'title' | 'category' | 'property_id' | 'show_in_gallery'>>
  ): Promise<GalleryItem> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ item: GalleryItem }>(`/api/admin/media/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return res.item;
    }

    const { data, error } = await sb
      .from('gallery_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteMediaItem(item: GalleryItem): Promise<void> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      await fetchJson(`/api/admin/media/${item.id}`, { method: 'DELETE' });
      return;
    }

    if (item.storage_path) {
      await sb.storage.from('property-media').remove([item.storage_path]);
    }
    const { error } = await sb.from('gallery_items').delete().eq('id', item.id);
    if (error) throw new Error(error.message);
  },

  async updateWebsiteSettings(payload: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
    const sb = await getAdminSupabaseClient();
    if (!sb) {
      const res = await fetchJson<{ settings: WebsiteSettings }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.settings;
    }

    const { data, error } = await sb
      .from('website_settings')
      .update(payload)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // --------------------------------------------------------------------------
  // SUPABASE CONNECTION MANAGEMENT
  // --------------------------------------------------------------------------
  async getSupabaseStatus(includeProbe = false): Promise<
    SupabaseConnectionStatus & { probe?: SupabaseProbeResult }
  > {
    try {
      return await fetchJson<SupabaseConnectionStatus & { probe?: SupabaseProbeResult }>(
        includeProbe ? '/api/admin/supabase/status?probe=1' : '/api/admin/supabase/status'
      );
    } catch {
      const info = getSupabaseConfigInfo();
      const creds = getSupabaseCredentials();
      const probe =
        includeProbe && creds
          ? await probeSupabaseFromBrowser(creds.url, creds.anonKey)
          : undefined;
      return {
        configured: info.configured,
        source: info.source,
        url: info.url,
        masked_key: creds ? maskKey(creds.anonKey) : '',
        connected_at: null,
        probe,
      };
    }
  },

  async testSupabaseConnection(
    url: string,
    anonKey: string
  ): Promise<{ ok: boolean; probe: SupabaseProbeResult }> {
    try {
      return await fetchJson<{ ok: boolean; probe: SupabaseProbeResult }>(
        '/api/admin/supabase/test',
        {
          method: 'POST',
          body: JSON.stringify({ url, anon_key: anonKey }),
        }
      );
    } catch (err) {
      if (!(err instanceof PreviewApiUnavailableError)) {
        throw err;
      }
      const probe = await probeSupabaseFromBrowser(url, anonKey);
      if (!probe.reachable) {
        const probeErr: any = new Error(
          probe.error || 'Unable to reach Supabase project with those credentials.'
        );
        probeErr.probe = probe;
        throw probeErr;
      }
      return {
        ok: probe.schemaReady && probe.propertiesReady && probe.videosReady && probe.storageReady,
        probe,
      };
    }
  },

  async connectSupabase(
    url: string,
    anonKey: string
  ): Promise<{ ok: boolean; status: SupabaseConnectionStatus; probe: SupabaseProbeResult }> {
    try {
      const res = await fetchJson<{
        ok: boolean;
        status: SupabaseConnectionStatus;
        probe: SupabaseProbeResult;
      }>('/api/admin/supabase/connect', {
        method: 'POST',
        body: JSON.stringify({ url, anon_key: anonKey }),
      });
      setRuntimeSupabaseConfig(res.status.url, anonKey);
      return res;
    } catch (err) {
      if (!(err instanceof PreviewApiUnavailableError)) {
        throw err;
      }
      const probe = await probeSupabaseFromBrowser(url, anonKey);
      if (!probe.reachable) {
        const probeErr: any = new Error(
          probe.error || 'Unable to reach Supabase project. Please verify your URL and Anon Key.'
        );
        probeErr.probe = probe;
        throw probeErr;
      }
      setRuntimeSupabaseConfig(probe.url, anonKey);
      return {
        ok: true,
        probe,
        status: {
          configured: true,
          source: 'dashboard',
          url: probe.url,
          masked_key: maskKey(anonKey.trim()),
          connected_at: new Date().toISOString(),
        },
      };
    }
  },

  async disconnectSupabase(): Promise<void> {
    const sb = getSupabaseClient();
    await fetchJson('/api/admin/supabase/disconnect', { method: 'POST' }).catch(() => {});
    clearRuntimeSupabaseConfig(true);
    if (sb) {
      await sb.auth.signOut().catch(() => {});
    }
  },

  async getSupabaseAuthSessionStatus(): Promise<{
    active: boolean;
    signedIn: boolean;
    email?: string;
    isAdminRow?: boolean;
  }> {
    const sb = getSupabaseClient();
    if (!sb) {
      return { active: false, signedIn: false };
    }
    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      return { active: true, signedIn: false };
    }
    const { data: adminRow } = await sb
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    return {
      active: true,
      signedIn: true,
      email: user.email,
      isAdminRow: Boolean(adminRow),
    };
  },
};
