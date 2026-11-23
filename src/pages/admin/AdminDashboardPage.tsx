import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Database,
  ExternalLink,
  FolderKanban,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  PlusCircle,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { api, SupabaseConnectionStatus, SupabaseProbeResult } from '../../lib/api';
import { initRuntimeSupabaseFromServer } from '../../lib/supabase';
import { useSite } from '../../context/SiteContext';
import {
  AdminUser,
  Customer,
  DashboardStats,
  Enquiry,
  GalleryItem,
  Property,
  PropertyCategory,
} from '../../types';
import { SeoHead } from '../../components/SeoHead';
import { AdminOverviewSection } from './AdminOverviewSection';
import { AdminPropertiesSection } from './AdminPropertiesSection';
import {
  AdminCustomersSection,
  AdminEnquiriesSection,
} from './AdminEnquiriesCustomersSection';
import {
  AdminCategoriesSection,
  AdminMediaSection,
} from './AdminMediaCategoriesSection';
import {
  AdminCompanyInfoSection,
  AdminProfileSection,
  AdminWebsiteSettingsSection,
} from './AdminSettingsProfileSection';
import { AdminSupabaseSection } from './AdminSupabaseSection';

type AdminTab =
  | 'overview'
  | 'properties'
  | 'add-property'
  | 'categories'
  | 'enquiries'
  | 'media'
  | 'customers'
  | 'settings'
  | 'company'
  | 'supabase'
  | 'profile';

const SIDEBAR_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'properties', label: 'Manage Properties', icon: Home },
  { id: 'add-property', label: 'Add New Property', icon: PlusCircle },
  { id: 'categories', label: 'Property Categories', icon: FolderKanban },
  { id: 'enquiries', label: 'Manage Enquiries', icon: Mail },
  { id: 'media', label: 'Property Gallery', icon: ImageIcon },
  { id: 'customers', label: 'Manage Customers', icon: Users },
  { id: 'settings', label: 'Website Settings', icon: Settings },
  { id: 'company', label: 'Company Information', icon: Building2 },
  { id: 'supabase', label: 'Supabase Connection', icon: Database },
  { id: 'profile', label: 'Admin Username & Password', icon: Shield },
];

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { settings, refreshSiteData } = useSite();

  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [mediaItems, setMediaItems] = useState<GalleryItem[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [storageNotice, setStorageNotice] = useState<{
    mode: 'permanent' | 'no-config' | 'schema-missing' | 'auth-required';
    message: string;
    ctaLabel: string;
  } | null>(null);

  const loadStorageNotice = useCallback(async () => {
    try {
      const [sbStatus, sbAuth] = await Promise.all([
        api.getSupabaseStatus(true) as Promise<
          SupabaseConnectionStatus & { probe?: SupabaseProbeResult }
        >,
        api.getSupabaseAuthSessionStatus(),
      ]);

      if (!sbStatus.configured) {
        setStorageNotice({
          mode: 'no-config',
          ctaLabel: 'Connect Supabase',
          message:
            'Temporary Storage Mode: Properties saved right now are stored in temporary server memory and can disappear when the preview server restarts. Connect Supabase to keep listings permanently.',
        });
        return;
      }

      if (!sbStatus.probe?.propertiesReady || !sbStatus.probe?.schemaReady) {
        setStorageNotice({
          mode: 'schema-missing',
          ctaLabel: 'Finish Supabase Setup',
          message:
            'Supabase Database Tables Missing: Your Supabase project is linked, but the tables have not been created in your Supabase SQL Editor yet. Until you run the Schema SQL, uploaded properties fall back to temporary storage and will reset on server restart.',
        });
        return;
      }

      if (!sbAuth.signedIn || !sbAuth.isAdminRow) {
        setStorageNotice({
          mode: 'auth-required',
          ctaLabel: 'Sign In to Supabase',
          message:
            'Supabase Admin Sign-In Required: Sign in with your Supabase Admin account inside Supabase Connection so newly uploaded properties save directly to your permanent Supabase database.',
        });
        return;
      }

      setStorageNotice({
        mode: 'permanent',
        ctaLabel: 'Supabase Connected',
        message: '',
      });
    } catch {
      // Ignore transient diagnostic errors
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [dashStats, propsList, catsList, enqList, custList, mediaList] =
        await Promise.all([
          api.getDashboardStats(),
          api.getAdminProperties(),
          api.getAdminCategories(),
          api.getAdminEnquiries(),
          api.getAdminCustomers(),
          api.getAdminMedia(),
        ]);
      setStats(dashStats);
      setProperties(propsList);
      setCategories(catsList);
      setEnquiries(enqList);
      setCustomers(custList);
      setMediaItems(mediaList);
    } catch {
      // Keep UI responsive if newly connected Supabase session is not yet authenticated
    } finally {
      setLoadingData(false);
    }
    loadStorageNotice();
  }, [loadStorageNotice]);

  useEffect(() => {
    let active = true;
    async function verifyAuth() {
      try {
        await initRuntimeSupabaseFromServer();
        const status = await api.getAuthStatus();
        if (!active) return;
        if (!status.authenticated || !status.user) {
          navigate('/admin/login', { replace: true });
          return;
        }
        setUser(status.user);
        setAuthChecking(false);
        await loadAdminData();
      } catch {
        if (active) navigate('/admin/login', { replace: true });
      }
    }
    verifyAuth();
    return () => {
      active = false;
    };
  }, [navigate, loadAdminData]);

  async function handleRefreshAll() {
    await Promise.all([loadAdminData(), refreshSiteData()]);
  }

  async function handleLogout() {
    await api.logoutAdmin();
    navigate('/admin/login', { replace: true });
  }

  function selectTab(tab: AdminTab) {
    if (tab === 'add-property') {
      setEditingProperty(null);
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }

  if (authChecking || !user) {
    return (
      <div className="min-h-screen bg-[#101C32] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D6AD32]" />
      </div>
    );
  }

  const activeLabel =
    SIDEBAR_ITEMS.find((i) => i.id === activeTab)?.label || 'Dashboard';

  return (
    <>
      <SeoHead
        title={`Admin Dashboard | ${settings.company_name}`}
        description="Administrator management console for IB Home Light Property And Land."
        canonicalPath="/admin"
        noIndex
      />

      <div className="min-h-screen bg-[#F8F7F3] flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-[#101C32] text-white shrink-0 border-r border-[#D6AD32]/20">
          <div className="p-5 border-b border-white/10 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-sm bg-[#D6AD32] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#101C32]" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-white leading-tight">
                {settings.company_name || 'Ib home light property and land'}
              </p>
              <p className="text-[11px] text-[#D6AD32] mt-0.5">Admin Console</p>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-sm transition-colors text-left ${
                    isActive
                      ? 'bg-[#D6AD32] text-[#101C32]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:bg-red-600/20 hover:text-red-200 rounded-sm transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-[#101C32]/75"
            onClick={() => setMobileMenuOpen(false)}
          >
            <aside
              className="w-72 h-full bg-[#101C32] text-white flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
                <span className="font-display text-base font-bold text-white leading-tight">
                  {settings.company_name || 'Ib home light property and land'}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close admin menu"
                  className="p-2 text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs font-semibold rounded-sm transition-colors text-left ${
                        isActive
                          ? 'bg-[#D6AD32] text-[#101C32]'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-xs font-semibold text-red-200 hover:bg-red-600/20 rounded-sm"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-[#101C32]/10 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open admin navigation"
                className="lg:hidden p-2 text-[#101C32] hover:bg-[#F8F7F3] rounded-sm"
              >
                <Menu className="w-5 h-5" />
              </button>
              <p className="text-xs sm:text-sm font-semibold text-[#101C32] truncate">
                Admin <span className="text-[#D6AD32] mx-1">/</span> {activeLabel}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:inline text-xs text-[#202020]/70">
                Signed in as <strong className="text-[#101C32]">{user.username}</strong>
              </span>
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#101C32] border border-[#101C32]/20 hover:border-[#D6AD32] rounded-sm transition-colors whitespace-nowrap"
              >
                <span>View Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#D6AD32]" />
              </Link>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
            {activeTab !== 'supabase' &&
              storageNotice &&
              (storageNotice.mode === 'no-config' || storageNotice.mode === 'schema-missing') && (
                <div className="mb-6 bg-amber-50 border border-amber-300 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                      {storageNotice.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectTab('supabase')}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors whitespace-nowrap"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{storageNotice.ctaLabel}</span>
                  </button>
                </div>
              )}

            {activeTab === 'overview' && (
              <AdminOverviewSection
                stats={stats}
                loading={loadingData}
                onNavigate={(tab) => selectTab(tab as AdminTab)}
              />
            )}

            {activeTab === 'properties' && (
              <AdminPropertiesSection
                properties={properties}
                categories={categories}
                editingProperty={editingProperty}
                mode={editingProperty ? 'form' : 'list'}
                onStartCreate={() => {
                  setEditingProperty(null);
                  setActiveTab('add-property');
                }}
                onStartEdit={(prop) => setEditingProperty(prop)}
                onCancelForm={() => setEditingProperty(null)}
                onDataChanged={handleRefreshAll}
              />
            )}

            {activeTab === 'add-property' && (
              <AdminPropertiesSection
                properties={properties}
                categories={categories}
                editingProperty={null}
                mode="form"
                onStartCreate={() => setActiveTab('add-property')}
                onStartEdit={(prop) => {
                  setEditingProperty(prop);
                  setActiveTab('properties');
                }}
                onCancelForm={() => setActiveTab('properties')}
                onDataChanged={handleRefreshAll}
              />
            )}

            {activeTab === 'categories' && (
              <AdminCategoriesSection
                categories={categories}
                onDataChanged={handleRefreshAll}
              />
            )}

            {activeTab === 'enquiries' && (
              <AdminEnquiriesSection
                enquiries={enquiries}
                onDataChanged={handleRefreshAll}
              />
            )}

            {activeTab === 'media' && (
              <AdminMediaSection
                mediaItems={mediaItems}
                properties={properties}
                onDataChanged={handleRefreshAll}
              />
            )}

            {activeTab === 'customers' && (
              <AdminCustomersSection customers={customers} />
            )}

            {activeTab === 'settings' && (
              <AdminWebsiteSettingsSection
                settings={settings}
                onSaved={handleRefreshAll}
              />
            )}

            {activeTab === 'company' && (
              <AdminCompanyInfoSection
                settings={settings}
                onSaved={handleRefreshAll}
              />
            )}

            {activeTab === 'supabase' && (
              <AdminSupabaseSection onConnectionChanged={handleRefreshAll} />
            )}

            {activeTab === 'profile' && (
              <AdminProfileSection user={user} onUserUpdated={(updated) => setUser(updated)} />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
