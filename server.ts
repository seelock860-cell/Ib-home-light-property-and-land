import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, '.data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'store.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface StoredAdmin {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  password_hash: string | null;
  password_salt: string | null;
}

interface StoredDB {
  admin: StoredAdmin;
  settings: {
    company_name: string;
    company_description: string;
    phone: string;
    whatsapp: string;
    instagram: string;
    email?: string;
    office_address: string;
    hero_location_label: string;
    hero_heading: string;
    hero_description: string;
    logo_url: string;
    updated_at: string;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
    description: string;
    sort_order: number;
  }[];
  properties: any[];
  gallery_items: any[];
  customers: any[];
  enquiries: any[];
  supabase_config?: {
    url: string;
    anon_key: string;
    connected_at: string;
  } | null;
  supabase_disabled?: boolean;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  (() => {
    const secretFile = path.join(DATA_DIR, '.session_secret');
    if (fs.existsSync(secretFile)) {
      return fs.readFileSync(secretFile, 'utf8').trim();
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, generated, 'utf8');
    return generated;
  })();

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash: derived, salt: usedSalt };
}

function verifyPassword(password: string, hash: string, salt: string) {
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

function createInitialDB(): StoredDB {
  let initialHash: string | null = null;
  let initialSalt: string | null = null;
  if (process.env.ADMIN_INITIAL_PASSWORD && process.env.ADMIN_INITIAL_PASSWORD.trim().length >= 6) {
    const res = hashPassword(process.env.ADMIN_INITIAL_PASSWORD.trim());
    initialHash = res.hash;
    initialSalt = res.salt;
  }

  return {
    admin: {
      id: 'admin-ibilate-001',
      username: 'ibilate',
      email: 'admin@ibhomelight.com',
      full_name: 'IB Home Light Administrator',
      role: 'super_admin',
      password_hash: initialHash,
      password_salt: initialSalt,
    },
    settings: {
      company_name: 'Ib home light property and land',
      company_description:
        'Ib home light property and land is a real estate business offering houses, land, commercial properties and fuel station property opportunities.',
      phone: '+234 806 366 9688',
      whatsapp: '+2348063669688',
      instagram: '@alabo007',
      email: 'Ibilateberepele17@gmail.com',
      office_address: 'No. 4 Central Estate, Army Range, Igwuruta, Port Harcourt, Nigeria.',
      hero_location_label: 'Port Harcourt, Rivers State · Nigeria',
      hero_heading: 'FIND YOUR DREAM PROPERTY WITH IB HOME LIGHT.',
      hero_description:
        'Your trusted partner for buying and selling houses, lands and commercial properties in Port Harcourt and beyond.',
      logo_url: '',
      updated_at: new Date().toISOString(),
    },
    categories: [
      {
        id: 'cat-self-contained',
        name: 'Self-contained',
        slug: 'self-contained',
        description: 'Modern self-contained apartments and studio living units.',
        sort_order: 1,
      },
      {
        id: 'cat-one-bedroom',
        name: 'One-bedroom flat',
        slug: 'one-bedroom-flat',
        description: 'Well-finished one-bedroom apartments in accessible residential zones.',
        sort_order: 2,
      },
      {
        id: 'cat-two-bedroom',
        name: 'Two-bedroom flat',
        slug: 'two-bedroom-flat',
        description: 'Spacious two-bedroom residential apartments and flats.',
        sort_order: 3,
      },
      {
        id: 'cat-duplex',
        name: 'Duplex',
        slug: 'duplex',
        description: 'Luxury detached, semi-detached, and terrace duplexes.',
        sort_order: 4,
      },
      {
        id: 'cat-land',
        name: 'Land',
        slug: 'land',
        description: 'Verified dry residential and commercial plots with clean title documentation.',
        sort_order: 5,
      },
      {
        id: 'cat-other',
        name: 'Other',
        slug: 'other',
        description: 'Additional residential, estate, and mixed-use property opportunities.',
        sort_order: 6,
      },
      {
        id: 'cat-houses',
        name: 'Houses for Sale',
        slug: 'houses-for-sale',
        description: 'Completed modern duplexes, detached villas, and residential family homes.',
        sort_order: 7,
      },
      {
        id: 'cat-lands',
        name: 'Lands for Sale',
        slug: 'lands-for-sale',
        description: 'Verified dry residential and commercial plots with clean title documentation.',
        sort_order: 8,
      },
      {
        id: 'cat-commercial',
        name: 'Commercial Properties',
        slug: 'commercial-properties',
        description: 'Office plazas, retail complexes, warehouses, and hospitality assets.',
        sort_order: 9,
      },
      {
        id: 'cat-fuel',
        name: 'Fuel Station Properties',
        slug: 'fuel-station-properties',
        description: 'Operational and development-ready filling stations along strategic corridors.',
        sort_order: 10,
      },
      {
        id: 'cat-residential',
        name: 'Residential Properties',
        slug: 'residential-properties',
        description: 'Gated estate residences and executive residential developments.',
        sort_order: 11,
      },
      {
        id: 'cat-investment',
        name: 'Investment Properties',
        slug: 'investment-properties',
        description: 'High-yield land banking and income-producing real estate assets.',
        sort_order: 12,
      },
    ],
    properties: [],
    gallery_items: [],
    customers: [],
    enquiries: [],
    supabase_config: null,
    supabase_disabled: false,
  };
}

const REQUIRED_CATEGORIES = [
  {
    id: 'cat-self-contained',
    name: 'Self-contained',
    slug: 'self-contained',
    description: 'Modern self-contained apartments and studio living units.',
    sort_order: 1,
  },
  {
    id: 'cat-one-bedroom',
    name: 'One-bedroom flat',
    slug: 'one-bedroom-flat',
    description: 'Well-finished one-bedroom apartments in accessible residential zones.',
    sort_order: 2,
  },
  {
    id: 'cat-two-bedroom',
    name: 'Two-bedroom flat',
    slug: 'two-bedroom-flat',
    description: 'Spacious two-bedroom residential apartments and flats.',
    sort_order: 3,
  },
  {
    id: 'cat-duplex',
    name: 'Duplex',
    slug: 'duplex',
    description: 'Luxury detached, semi-detached, and terrace duplexes.',
    sort_order: 4,
  },
  {
    id: 'cat-land',
    name: 'Land',
    slug: 'land',
    description: 'Verified dry residential and commercial plots with clean title documentation.',
    sort_order: 5,
  },
  {
    id: 'cat-other',
    name: 'Other',
    slug: 'other',
    description: 'Additional residential, estate, and mixed-use property opportunities.',
    sort_order: 6,
  },
];

function readDB(): StoredDB {
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoredDB;
    let changed = false;
    if (!parsed.settings.email) {
      parsed.settings.email = 'Ibilateberepele17@gmail.com';
      changed = true;
    }
    // Sync ADMIN_INITIAL_PASSWORD if newly provided and admin had no password yet
    if (
      !parsed.admin.password_hash &&
      process.env.ADMIN_INITIAL_PASSWORD &&
      process.env.ADMIN_INITIAL_PASSWORD.trim().length >= 6
    ) {
      const res = hashPassword(process.env.ADMIN_INITIAL_PASSWORD.trim());
      parsed.admin.password_hash = res.hash;
      parsed.admin.password_salt = res.salt;
      changed = true;
    }
    const existingNames = new Set((parsed.categories || []).map((c) => c.name));
    const missing = REQUIRED_CATEGORIES.filter((c) => !existingNames.has(c.name));
    if (missing.length > 0) {
      parsed.categories = [...missing, ...(parsed.categories || [])];
      changed = true;
    }
    if (changed) {
      writeDB(parsed);
    }
    return parsed;
  } catch {
    const initial = createInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

function writeDB(db: StoredDB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || '';
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = decodeURIComponent(part.slice(0, idx).trim());
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = val;
  }
  return out;
}

function signToken(payload: { sub: string; username: string; exp: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): { sub: string; username: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req);
  return cookies['ib_admin_session'] || null;
}

function setSessionCookie(req: Request, res: Response, token: string) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('ib_admin_session', token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const verified = verifyToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  (req as Request & { adminUser?: { sub: string; username: string } }).adminUser = verified;
  next();
}

function isServiceRoleOrSecretKey(key: string): boolean {
  const trimmed = key.trim();
  if (trimmed.startsWith('sb_secret_')) return true;
  const parts = trimmed.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (payload?.role === 'service_role') return true;
    } catch {
      // Ignore malformed JWT
    }
  }
  return false;
}

function normalizeSupabaseUrl(raw: string): string {
  const cleaned = String(raw || '').trim().replace(/\/+$/, '');
  const parsed = new URL(cleaned);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Supabase Project URL must start with https://');
  }
  return `${parsed.protocol}//${parsed.host}`;
}

function maskSupabaseKey(key: string): string {
  const trimmed = String(key || '').trim();
  if (trimmed.length <= 16) return trimmed ? '••••••••' : '';
  return `${trimmed.slice(0, 10)}••••••••••••${trimmed.slice(-6)}`;
}

async function probeSupabaseConnection(rawUrl: string, rawKey: string): Promise<{
  url: string;
  reachable: boolean;
  schemaReady: boolean;
  propertiesReady: boolean;
  videosReady: boolean;
  storageReady: boolean;
  error?: string;
}> {
  let url = '';
  try {
    url = normalizeSupabaseUrl(rawUrl);
  } catch (err: any) {
    throw new Error(err?.message || 'Please enter a valid Supabase Project URL (e.g. https://xxxx.supabase.co).');
  }

  const anonKey = String(rawKey || '').trim();
  if (anonKey.length < 20) {
    throw new Error('Please enter a valid Supabase Public Anon / Publishable Key.');
  }
  if (isServiceRoleOrSecretKey(anonKey)) {
    throw new Error(
      'Security block: Do NOT enter a service_role or secret key. Use only the public anon / publishable key from Project Settings -> API.'
    );
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  let reachable = false;
  let schemaReady = false;
  let propertiesReady = false;
  let videosReady = false;
  let storageReady = false;

  try {
    const settingsRes = await fetch(`${url}/rest/v1/website_settings?select=id&limit=1`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    reachable = true;
    if (settingsRes.status === 401) {
      return {
        url,
        reachable: true,
        schemaReady: false,
        propertiesReady: false,
        videosReady: false,
        storageReady: false,
        error: 'Supabase rejected the API key (401 Unauthorized). Please double-check your anon/publishable key.',
      };
    }
    schemaReady = settingsRes.ok;

    const [propsRes, videosRes, storageRes] = await Promise.all([
      fetch(`${url}/rest/v1/properties?select=id&limit=1`, {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${url}/rest/v1/property_videos?select=id&limit=1`, {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${url}/storage/v1/object/list/property-media`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prefix: '', limit: 1 }),
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    propertiesReady = propsRes.ok;
    videosReady = videosRes.ok;

    if (storageRes.ok) {
      storageReady = true;
    } else {
      const storageText = await storageRes.text().catch(() => '');
      const lower = storageText.toLowerCase();
      storageReady = !(lower.includes('not found') || lower.includes('does not exist'));
    }

    return {
      url,
      reachable,
      schemaReady,
      propertiesReady,
      videosReady,
      storageReady,
    };
  } catch (err: any) {
    return {
      url,
      reachable: false,
      schemaReady: false,
      propertiesReady: false,
      videosReady: false,
      storageReady: false,
      error: err?.message || 'Could not reach the Supabase project URL. Please check the URL and network connection.',
    };
  }
}

async function requireDashboardAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractSessionToken(req);
  const verified = token ? verifyToken(token) : null;
  if (verified) {
    (req as Request & { adminUser?: { sub: string; username: string } }).adminUser = verified;
    next();
    return;
  }

  const sbToken = String(req.headers['x-supabase-access-token'] || '').trim();
  const db = readDB();
  const rawSbUrl = db.supabase_config?.url || process.env.VITE_SUPABASE_URL || '';
  let sbUrl = '';
  try {
    if (rawSbUrl.trim()) sbUrl = normalizeSupabaseUrl(rawSbUrl);
  } catch {
    sbUrl = '';
  }
  const sbKey = (db.supabase_config?.anon_key || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (sbToken && sbUrl && sbKey) {
    try {
      const userRes = await fetch(`${sbUrl}/auth/v1/user`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbToken}` },
        signal: AbortSignal.timeout(6000),
      });
      if (userRes.ok) {
        const authUser = (await userRes.json()) as { id?: string };
        if (authUser?.id) {
          const adminRes = await fetch(
            `${sbUrl}/rest/v1/admin_users?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=id,username`,
            {
              headers: { apikey: sbKey, Authorization: `Bearer ${sbToken}` },
              signal: AbortSignal.timeout(6000),
            }
          );
          if (adminRes.ok) {
            const rows = (await adminRes.json()) as { id: string; username: string }[];
            if (Array.isArray(rows) && rows.length > 0) {
              (req as Request & { adminUser?: { sub: string; username: string } }).adminUser = {
                sub: rows[0].id,
                username: rows[0].username,
              };
              next();
              return;
            }
          }
        }
      }
    } catch {
      // Fall through to 401
    }
  }

  res.status(401).json({ error: 'Administrator authentication required.' });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Serve uploaded property media
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Dynamic SEO Sitemap
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const db = readDB();
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const staticRoutes = ['/', '/properties', '/about', '/services', '/gallery', '/contact'];
    const publishedProps = db.properties.filter((p) => p.is_published);
    const urls = [
      ...staticRoutes.map(
        (r) => `<url><loc>${baseUrl}${r}</loc><changefreq>weekly</changefreq><priority>${r === '/' ? '1.0' : '0.8'}</priority></url>`
      ),
      ...publishedProps.map(
        (p) =>
          `<url><loc>${baseUrl}/properties/${p.slug}</loc><lastmod>${(p.updated_at || new Date().toISOString()).slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`
      ),
    ];
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
    );
  });

  // --------------------------------------------------------------------------
  // PUBLIC API ROUTES
  // --------------------------------------------------------------------------
  app.use('/api', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
  });

  app.get('/api/public/bootstrap', (_req: Request, res: Response) => {
    const db = readDB();
    const publishedProperties = db.properties
      .filter((p) => p.is_published)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const visibleGallery = db.gallery_items
      .filter((g) => g.show_in_gallery)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const categories = db.categories.map((cat) => ({
      ...cat,
      property_count: publishedProperties.filter((p) => p.category_name === cat.name).length,
    }));

    res.json({
      settings: db.settings,
      categories,
      properties: publishedProperties,
      gallery: visibleGallery,
    });
  });

  app.get('/api/public/supabase-config', (_req: Request, res: Response) => {
    const db = readDB();
    if (db.supabase_disabled) {
      res.json({
        configured: false,
        disabledByAdmin: true,
        url: '',
        anon_key: '',
      });
      return;
    }
    const cfg = db.supabase_config;
    if (cfg?.url && cfg?.anon_key) {
      res.json({
        configured: true,
        disabledByAdmin: false,
        url: cfg.url,
        anon_key: cfg.anon_key,
      });
      return;
    }

    const rawEnvUrl = (process.env.VITE_SUPABASE_URL || '').trim();
    const envKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    let envUrl = '';
    try {
      if (rawEnvUrl.startsWith('http')) envUrl = normalizeSupabaseUrl(rawEnvUrl);
    } catch {
      envUrl = '';
    }
    const envConfigured = Boolean(envUrl && envKey.length > 20);
    res.json({
      configured: envConfigured,
      disabledByAdmin: false,
      url: envConfigured ? envUrl : '',
      anon_key: envConfigured ? envKey : '',
    });
  });

  app.get('/api/public/properties/:slug', (req: Request, res: Response) => {
    const db = readDB();
    const prop = db.properties.find(
      (p) => p.slug === req.params.slug && p.is_published
    );
    if (!prop) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }
    res.json({ property: prop });
  });

  app.post('/api/public/enquiries', (req: Request, res: Response) => {
    const { full_name, phone, email, property_id, property_interest, message } = req.body || {};
    if (!full_name || String(full_name).trim().length < 2) {
      res.status(400).json({ error: 'Please provide your full name.' });
      return;
    }
    if (!phone || String(phone).trim().length < 6) {
      res.status(400).json({ error: 'Please provide a valid phone number.' });
      return;
    }
    if (!message || String(message).trim().length < 4) {
      res.status(400).json({ error: 'Please enter your enquiry message.' });
      return;
    }

    const db = readDB();
    const cleanPhone = String(phone).trim();
    const cleanName = String(full_name).trim();
    const cleanEmail = String(email || '').trim();
    const now = new Date().toISOString();

    let customer = db.customers.find((c) => c.phone === cleanPhone);
    if (!customer) {
      customer = {
        id: crypto.randomUUID(),
        full_name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        notes: '',
        created_at: now,
        updated_at: now,
      };
      db.customers.push(customer);
    } else {
      customer.full_name = cleanName;
      if (cleanEmail) customer.email = cleanEmail;
      customer.updated_at = now;
    }

    const enquiry = {
      id: crypto.randomUUID(),
      customer_id: customer.id,
      full_name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      property_id: property_id || null,
      property_interest: String(property_interest || 'General Property Enquiry').trim(),
      message: String(message).trim(),
      status: 'new',
      created_at: now,
      updated_at: now,
    };

    db.enquiries.unshift(enquiry);
    writeDB(db);

    res.status(201).json({ enquiry });
  });

  // --------------------------------------------------------------------------
  // AUTH ROUTES
  // --------------------------------------------------------------------------
  app.get('/api/auth/status', (req: Request, res: Response) => {
    const db = readDB();
    const isProvisioned = Boolean(db.admin.password_hash && db.admin.password_salt);
    const token = extractSessionToken(req);
    const verified = token ? verifyToken(token) : null;

    res.json({
      isProvisioned,
      authenticated: Boolean(verified),
      user: verified
        ? {
            id: db.admin.id,
            username: db.admin.username,
            email: db.admin.email,
            full_name: db.admin.full_name,
            role: db.admin.role,
          }
        : null,
    });
  });

  app.post('/api/auth/provision-initial', (req: Request, res: Response) => {
    const db = readDB();
    if (db.admin.password_hash && db.admin.password_salt) {
      res.status(403).json({ error: 'Administrator credentials are already provisioned.' });
      return;
    }
    const { username, password } = req.body || {};
    if (!username || String(username).trim().toLowerCase() !== db.admin.username.toLowerCase()) {
      res.status(401).json({ error: 'Invalid administrator username or password.' });
      return;
    }
    if (!password || String(password).length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters.' });
      return;
    }

    const { hash, salt } = hashPassword(String(password));
    db.admin.password_hash = hash;
    db.admin.password_salt = salt;
    writeDB(db);

    const token = signToken({
      sub: db.admin.id,
      username: db.admin.username,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });

    setSessionCookie(req, res, token);

    res.json({
      token,
      user: {
        id: db.admin.id,
        username: db.admin.username,
        email: db.admin.email,
        full_name: db.admin.full_name,
        role: db.admin.role,
      },
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const db = readDB();
    if (!db.admin.password_hash || !db.admin.password_salt) {
      res.status(400).json({ error: 'Administrator password has not been provisioned yet.' });
      return;
    }
    const { username, password } = req.body || {};
    const cleanInput = String(username || '').trim().toLowerCase();
    const matchesIdentity = cleanInput === db.admin.username.toLowerCase();

    if (
      !matchesIdentity ||
      !password ||
      !verifyPassword(String(password), db.admin.password_hash, db.admin.password_salt)
    ) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const token = signToken({
      sub: db.admin.id,
      username: db.admin.username,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });

    setSessionCookie(req, res, token);

    res.json({
      token,
      user: {
        id: db.admin.id,
        username: db.admin.username,
        email: db.admin.email,
        full_name: db.admin.full_name,
        role: db.admin.role,
      },
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie('ib_admin_session', {
      path: '/',
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
    });
    res.json({ ok: true });
  });

  // --------------------------------------------------------------------------
  // PROTECTED ADMIN ROUTES
  // --------------------------------------------------------------------------
  app.get('/api/admin/dashboard', requireAdmin, (_req: Request, res: Response) => {
    const db = readDB();
    const props = db.properties;
    const enqs = db.enquiries;
    const categoryBreakdown = db.categories.map((cat) => ({
      name: cat.name,
      count: props.filter((p) => p.category_name === cat.name).length,
    }));

    res.json({
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
      totalCustomers: db.customers.length,
      categoryBreakdown,
      recentEnquiries: enqs.slice(0, 6),
      recentProperties: props.slice(0, 6),
    });
  });

  app.get('/api/admin/properties', requireAdmin, (_req: Request, res: Response) => {
    const db = readDB();
    const sorted = [...db.properties].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json({ properties: sorted });
  });

  app.post('/api/admin/properties', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const body = req.body || {};
    if (!body.title || !body.location || !body.category_name) {
      res.status(400).json({ error: 'Title, category, and location are required.' });
      return;
    }

    const baseSlug = slugify(body.slug || body.title);
    let uniqueSlug = baseSlug || `property-${Date.now()}`;
    if (db.properties.some((p) => p.slug === uniqueSlug)) {
      uniqueSlug = `${uniqueSlug}-${crypto.randomBytes(2).toString('hex')}`;
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const cat = db.categories.find((c) => c.name === body.category_name);
    const images = Array.isArray(body.images)
      ? body.images.map((img: any, idx: number) => ({
          id: img.id || crypto.randomUUID(),
          property_id: id,
          image_url: img.image_url,
          storage_path: img.storage_path || '',
          caption: img.caption || '',
          is_primary: idx === 0 ? true : Boolean(img.is_primary),
          sort_order: idx,
        }))
      : [];

    const videos = Array.isArray(body.videos)
      ? body.videos.map((vid: any, idx: number) => ({
          id: vid.id || crypto.randomUUID(),
          property_id: id,
          video_url: vid.video_url,
          storage_path: vid.storage_path || '',
          caption: vid.caption || '',
          mime_type: vid.mime_type || 'video/mp4',
          sort_order: idx,
        }))
      : [];

    const defaultVisibility = {
      caution_fee: true,
      drinking_money: true,
      movement_fee: true,
      agreement_fee: true,
      legal_fee: true,
      agent_commission: true,
    };

    const property = {
      id,
      title: String(body.title).trim(),
      slug: uniqueSlug,
      category_id: cat?.id || null,
      category_name: String(body.category_name).trim(),
      listing_type: body.listing_type || 'For Sale',
      location: String(body.location).trim(),
      bedrooms:
        body.bedrooms !== undefined && body.bedrooms !== null && body.bedrooms !== ''
          ? Number(body.bedrooms)
          : null,
      bathrooms:
        body.bathrooms !== undefined && body.bathrooms !== null && body.bathrooms !== ''
          ? Number(body.bathrooms)
          : null,
      property_size: String(body.property_size || '').trim(),
      price: Number(body.price) || 0,
      price_display: String(
        body.price_display || `₦${(Number(body.price) || 0).toLocaleString('en-NG')}`
      ).trim(),
      caution_fee: Number(body.caution_fee) || 0,
      drinking_money: Number(body.drinking_money) || 0,
      movement_fee: Number(body.movement_fee) || 0,
      agreement_fee: Number(body.agreement_fee) || 0,
      legal_fee: Number(body.legal_fee) || 0,
      agent_commission_percent: Number(body.agent_commission_percent) || 0,
      agent_commission_amount: Number(body.agent_commission_amount) || 0,
      fee_visibility: { ...defaultVisibility, ...(body.fee_visibility || {}) },
      short_description: String(body.short_description || '').trim(),
      full_description: String(body.full_description || '').trim(),
      features: Array.isArray(body.features) ? body.features : [],
      availability: body.availability || 'available',
      is_featured: Boolean(body.is_featured),
      is_published: body.is_published !== undefined ? Boolean(body.is_published) : true,
      created_at: now,
      updated_at: now,
      images,
      videos,
    };

    db.properties.unshift(property);
    writeDB(db);
    res.status(201).json({ property });
  });

  app.put('/api/admin/properties/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const idx = db.properties.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }

    const existing = db.properties[idx];
    const body = req.body || {};
    const cat = body.category_name
      ? db.categories.find((c) => c.name === body.category_name)
      : null;

    const updatedImages = Array.isArray(body.images)
      ? body.images.map((img: any, i: number) => ({
          id: img.id || crypto.randomUUID(),
          property_id: existing.id,
          image_url: img.image_url,
          storage_path: img.storage_path || '',
          caption: img.caption || '',
          is_primary: Boolean(img.is_primary),
          sort_order: i,
        }))
      : existing.images || [];

    if (updatedImages.length > 0 && !updatedImages.some((img: any) => img.is_primary)) {
      updatedImages[0].is_primary = true;
    }

    const updatedVideos = Array.isArray(body.videos)
      ? body.videos.map((vid: any, i: number) => ({
          id: vid.id || crypto.randomUUID(),
          property_id: existing.id,
          video_url: vid.video_url,
          storage_path: vid.storage_path || '',
          caption: vid.caption || '',
          mime_type: vid.mime_type || 'video/mp4',
          sort_order: i,
        }))
      : existing.videos || [];

    const updated = {
      ...existing,
      ...body,
      id: existing.id,
      category_id: cat?.id ?? existing.category_id,
      images: updatedImages,
      videos: updatedVideos,
      updated_at: new Date().toISOString(),
    };

    db.properties[idx] = updated;
    writeDB(db);
    res.json({ property: updated });
  });

  app.delete('/api/admin/properties/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const before = db.properties.length;
    db.properties = db.properties.filter((p) => p.id !== req.params.id);
    if (db.properties.length === before) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }
    writeDB(db);
    res.json({ ok: true });
  });

  app.get('/api/admin/categories', requireAdmin, (_req: Request, res: Response) => {
    const db = readDB();
    const categories = db.categories.map((cat) => ({
      ...cat,
      property_count: db.properties.filter((p) => p.category_name === cat.name).length,
    }));
    res.json({ categories });
  });

  app.post('/api/admin/categories', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const { name, description } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const cleanName = String(name).trim();
    const slug = slugify(cleanName);
    if (db.categories.some((c) => c.slug === slug)) {
      res.status(400).json({ error: 'Category already exists.' });
      return;
    }
    const category = {
      id: crypto.randomUUID(),
      name: cleanName,
      slug,
      description: String(description || '').trim(),
      sort_order: db.categories.length + 1,
    };
    db.categories.push(category);
    writeDB(db);
    res.status(201).json({ category });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
  });

  app.get('/api/admin/enquiries', requireAdmin, (_req: Request, res: Response) => {
    const db = readDB();
    const sorted = [...db.enquiries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json({ enquiries: sorted });
  });

  app.patch('/api/admin/enquiries/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const enquiry = db.enquiries.find((e) => e.id === req.params.id);
    if (!enquiry) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    if (req.body.status && ['new', 'contacted', 'completed'].includes(req.body.status)) {
      enquiry.status = req.body.status;
    }
    enquiry.updated_at = new Date().toISOString();
    writeDB(db);
    res.json({ enquiry });
  });

  app.delete('/api/admin/enquiries/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    db.enquiries = db.enquiries.filter((e) => e.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
  });

  app.get('/api/admin/customers', requireAdmin, (_req: Request, res: Response) => {
    const db = readDB();
    const customers = db.customers
      .map((c) => {
        const custEnquiries = db.enquiries.filter(
          (e) => e.customer_id === c.id || e.phone === c.phone
        );
        return {
          ...c,
          enquiry_count: custEnquiries.length,
          enquiries: custEnquiries,
        };
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    res.json({ customers });
  });

  app.get('/api/admin/media', requireAdmin, (_req: Request, res: Response) => {
    const db = readDB();
    res.json({ items: db.gallery_items });
  });

  app.post('/api/admin/media', requireAdmin, (req: Request, res: Response) => {
    const { dataUrl, fileName, title, category, property_id, show_in_gallery } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Valid image file payload is required.' });
      return;
    }

    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
    if (!match) {
      res.status(400).json({ error: 'Unsupported image format. Use PNG, JPG, or WEBP.' });
      return;
    }

    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size must be under 10MB.' });
      return;
    }

    const safeBase = slugify(path.basename(fileName || 'property-media', path.extname(fileName || ''))) || 'media';
    const storedName = `${safeBase}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
    const fullPath = path.join(UPLOADS_DIR, storedName);
    fs.writeFileSync(fullPath, buffer);

    const imageUrl = `/uploads/${storedName}`;
    const db = readDB();
    const item = {
      id: crypto.randomUUID(),
      title: String(title || safeBase).trim(),
      category: String(category || 'Property Media').trim(),
      image_url: imageUrl,
      storage_path: storedName,
      property_id: property_id || null,
      show_in_gallery: show_in_gallery !== undefined ? Boolean(show_in_gallery) : true,
      created_at: new Date().toISOString(),
    };

    db.gallery_items.unshift(item);
    writeDB(db);
    res.status(201).json({ item });
  });

  app.post(
    '/api/admin/media/upload-binary',
    requireAdmin,
    express.raw({
      type: ['image/*', 'video/*', 'application/octet-stream'],
      limit: '120mb',
    }),
    (req: Request, res: Response) => {
      const buffer = req.body as Buffer;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        res.status(400).json({ error: 'Empty upload payload.' });
        return;
      }

      const rawName = decodeURIComponent(String(req.headers['x-file-name'] || 'upload'));
      const mimeType = String(req.headers['content-type'] || '').toLowerCase();
      const mediaKind = String(req.headers['x-media-kind'] || 'image').toLowerCase();

      const extFromName = path.extname(rawName).toLowerCase().replace('.', '');
      let ext = extFromName;

      if (mediaKind === 'video' || mimeType.startsWith('video/')) {
        const allowedVideo = ['mp4', 'mov', 'webm'];
        if (mimeType.includes('quicktime')) ext = 'mov';
        else if (mimeType.includes('webm')) ext = 'webm';
        else if (mimeType.includes('mp4')) ext = 'mp4';

        if (!allowedVideo.includes(ext)) {
          res.status(400).json({ error: 'Unsupported video format. Please upload MP4, MOV, or WebM.' });
          return;
        }
      } else {
        const allowedImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('gif')) ext = 'gif';
        else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';

        if (!allowedImg.includes(ext)) {
          res.status(400).json({ error: 'Unsupported image format. Please upload PNG, JPG, or WEBP.' });
          return;
        }
        if (ext === 'jpeg') ext = 'jpg';
      }

      const safeBase = slugify(path.basename(rawName, path.extname(rawName))) || 'media';
      const storedName = `${safeBase}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
      const fullPath = path.join(UPLOADS_DIR, storedName);
      fs.writeFileSync(fullPath, buffer);

      const url = `/uploads/${storedName}`;
      res.status(201).json({
        url,
        storage_path: storedName,
        mime_type: mimeType || (mediaKind === 'video' ? `video/${ext}` : `image/${ext}`),
        title: String(req.headers['x-title'] ? decodeURIComponent(String(req.headers['x-title'])) : safeBase),
      });
    }
  );

  app.patch('/api/admin/media/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const item = db.gallery_items.find((g) => g.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }
    if (req.body.title !== undefined) item.title = String(req.body.title).trim();
    if (req.body.category !== undefined) item.category = String(req.body.category).trim();
    if (req.body.property_id !== undefined) item.property_id = req.body.property_id || null;
    if (req.body.show_in_gallery !== undefined)
      item.show_in_gallery = Boolean(req.body.show_in_gallery);

    writeDB(db);
    res.json({ item });
  });

  app.delete('/api/admin/media/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const item = db.gallery_items.find((g) => g.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }
    if (item.storage_path) {
      const filePath = path.join(UPLOADS_DIR, item.storage_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    db.gallery_items = db.gallery_items.filter((g) => g.id !== req.params.id);
    writeDB(db);
    res.json({ ok: true });
  });

  app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    db.settings = {
      ...db.settings,
      ...req.body,
      updated_at: new Date().toISOString(),
    };
    writeDB(db);
    res.json({ settings: db.settings });
  });

  app.post('/api/admin/change-password', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || String(newPassword).length < 4) {
      res.status(400).json({ error: 'New password must be at least 4 characters.' });
      return;
    }
    if (
      !db.admin.password_hash ||
      !db.admin.password_salt ||
      !verifyPassword(String(currentPassword), db.admin.password_hash, db.admin.password_salt)
    ) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    const { hash, salt } = hashPassword(String(newPassword));
    db.admin.password_hash = hash;
    db.admin.password_salt = salt;
    writeDB(db);
    res.json({ ok: true });
  });

  app.post('/api/admin/change-username', requireAdmin, (req: Request, res: Response) => {
    const db = readDB();
    const { newUsername, currentPassword } = req.body || {};
    const cleanUsername = String(newUsername || '').trim();

    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(cleanUsername)) {
      res.status(400).json({
        error:
          'Username must be 3–40 characters and contain only letters, numbers, dots, underscores, or hyphens.',
      });
      return;
    }

    if (
      !currentPassword ||
      !db.admin.password_hash ||
      !db.admin.password_salt ||
      !verifyPassword(String(currentPassword), db.admin.password_hash, db.admin.password_salt)
    ) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    db.admin.username = cleanUsername;
    writeDB(db);

    const token = signToken({
      sub: db.admin.id,
      username: db.admin.username,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });
    setSessionCookie(req, res, token);

    res.json({
      token,
      user: {
        id: db.admin.id,
        username: db.admin.username,
        email: db.admin.email,
        full_name: db.admin.full_name,
        role: db.admin.role,
      },
    });
  });

  // --------------------------------------------------------------------------
  // SUPABASE CONNECTION MANAGEMENT ROUTES
  // --------------------------------------------------------------------------
  app.get('/api/admin/supabase/status', requireDashboardAdmin, async (req: Request, res: Response) => {
    const db = readDB();
    const wantProbe = req.query.probe === '1';

    if (db.supabase_disabled) {
      res.json({
        configured: false,
        source: 'none',
        url: '',
        masked_key: '',
        connected_at: null,
      });
      return;
    }

    const cfg = db.supabase_config;
    if (cfg?.url && cfg?.anon_key) {
      const probe = wantProbe
        ? await probeSupabaseConnection(cfg.url, cfg.anon_key).catch(() => undefined)
        : undefined;
      res.json({
        configured: true,
        source: 'dashboard',
        url: cfg.url,
        masked_key: maskSupabaseKey(cfg.anon_key),
        connected_at: cfg.connected_at || null,
        ...(probe ? { probe } : {}),
      });
      return;
    }

    const rawEnvUrl = (process.env.VITE_SUPABASE_URL || '').trim();
    const envKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    let envUrl = '';
    try {
      if (rawEnvUrl.startsWith('http')) envUrl = normalizeSupabaseUrl(rawEnvUrl);
    } catch {
      envUrl = '';
    }
    const envConfigured = Boolean(envUrl && envKey.length > 20);

    if (envConfigured) {
      const probe = wantProbe
        ? await probeSupabaseConnection(envUrl, envKey).catch(() => undefined)
        : undefined;
      res.json({
        configured: true,
        source: 'env',
        url: envUrl,
        masked_key: maskSupabaseKey(envKey),
        connected_at: null,
        ...(probe ? { probe } : {}),
      });
      return;
    }

    res.json({
      configured: false,
      source: 'none',
      url: '',
      masked_key: '',
      connected_at: null,
    });
  });

  app.post('/api/admin/supabase/test', requireDashboardAdmin, async (req: Request, res: Response) => {
    try {
      const { url, anon_key } = req.body || {};
      const probe = await probeSupabaseConnection(url, anon_key);
      if (!probe.reachable || probe.error) {
        res.status(400).json({ error: probe.error || 'Could not reach Supabase project.', probe });
        return;
      }
      res.json({ ok: true, probe });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Invalid Supabase credentials.' });
    }
  });

  app.post('/api/admin/supabase/connect', requireDashboardAdmin, async (req: Request, res: Response) => {
    try {
      const { url, anon_key } = req.body || {};
      const probe = await probeSupabaseConnection(url, anon_key);
      if (!probe.reachable || probe.error) {
        res.status(400).json({ error: probe.error || 'Could not connect to Supabase project.', probe });
        return;
      }

      const cleanKey = String(anon_key).trim();
      const db = readDB();
      db.supabase_disabled = false;
      db.supabase_config = {
        url: probe.url,
        anon_key: cleanKey,
        connected_at: new Date().toISOString(),
      };
      writeDB(db);

      res.json({
        ok: true,
        status: {
          configured: true,
          source: 'dashboard',
          url: probe.url,
          masked_key: maskSupabaseKey(cleanKey),
          connected_at: db.supabase_config.connected_at,
        },
        probe,
      });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to save Supabase connection.' });
    }
  });

  app.post('/api/admin/supabase/disconnect', requireDashboardAdmin, (_req: Request, res: Response) => {
    const db = readDB();
    db.supabase_config = null;
    db.supabase_disabled = true;
    writeDB(db);
    res.json({ ok: true });
  });

  const httpServer = http.createServer(app);

  // --------------------------------------------------------------------------
  // VITE / STATIC SERVING
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });

    // HMR is disabled behind the AI Studio preview proxy; prevent @vite/client
    // from opening a WebSocket to unreachable port 24678 and rejecting at runtime.
    app.get('/@vite/client', async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result?.code) return next();
        const patched = result.code.replace(
          'transport.connect(createHMRHandler(handleMessage));',
          '/* HMR disabled: WebSocket connection skipped */'
        );
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(patched);
      } catch {
        next();
      }
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`IB Home Light server listening on http://localhost:${PORT}`);
  });
}

startServer();
