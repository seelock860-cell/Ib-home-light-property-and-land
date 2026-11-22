import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  PlugZap,
  ShieldCheck,
  Unplug,
  XCircle,
} from 'lucide-react';
import {
  api,
  SupabaseConnectionStatus,
  SupabaseProbeResult,
} from '../../lib/api';
import schemaSql from '../../../supabase/schema.sql?raw';
import migrationV2Sql from '../../../supabase/migration_v2_property_system.sql?raw';

const LINK_ADMIN_SQL = `insert into public.admin_users (auth_user_id, username, email, full_name, role)
select id, 'ibilate', email, 'IB Home Light Administrator', 'super_admin'
from auth.users
where email = 'YOUR_ADMIN_EMAIL_HERE'
on conflict (auth_user_id) do nothing;`;

export function AdminSupabaseSection({
  onConnectionChanged,
}: {
  onConnectionChanged: () => Promise<void>;
}) {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [status, setStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [authStatus, setAuthStatus] = useState<{
    active: boolean;
    signedIn: boolean;
    email?: string;
    isAdminRow?: boolean;
  }>({ active: false, signedIn: false });

  const [urlInput, setUrlInput] = useState('');
  const [anonKeyInput, setAnonKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const [probe, setProbe] = useState<SupabaseProbeResult | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Inline Supabase Admin sign-in state (used when admin connected from local session)
  const [sbLoginId, setSbLoginId] = useState('');
  const [sbLoginPassword, setSbLoginPassword] = useState('');
  const [sbLoggingIn, setSbLoggingIn] = useState(false);

  // Copy states
  const [copiedId, setCopiedId] = useState<'schema' | 'migration' | 'admin' | null>(null);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const [connStatus, sbAuth] = await Promise.all([
        api.getSupabaseStatus(true),
        api.getSupabaseAuthSessionStatus(),
      ]);
      setStatus(connStatus);
      setAuthStatus(sbAuth);
      if (connStatus.probe) {
        setProbe(connStatus.probe);
      }
      if (connStatus.url) {
        setUrlInput((prev) => prev || connStatus.url);
      }
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleTestConnection() {
    setFeedback(null);
    setProbe(null);
    if (!urlInput.trim() || !anonKeyInput.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please enter both your Supabase Project URL and Public Anon Key to test.',
      });
      return;
    }

    setTesting(true);
    try {
      const res = await api.testSupabaseConnection(urlInput.trim(), anonKeyInput.trim());
      setProbe(res.probe);
      const allReady =
        res.probe.schemaReady &&
        res.probe.propertiesReady &&
        res.probe.videosReady &&
        res.probe.storageReady;

      setFeedback({
        type: 'success',
        text: allReady
          ? 'Connection verified! All database tables and storage bucket are ready.'
          : 'Project reached! Review the checklist below to run any missing SQL tables before connecting.',
      });
    } catch (err: any) {
      if (err?.probe) setProbe(err.probe);
      setFeedback({
        type: 'error',
        text: err?.message || 'Unable to verify Supabase connection.',
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (!urlInput.trim() || !anonKeyInput.trim()) {
      setFeedback({
        type: 'error',
        text: 'Both Supabase Project URL and Public Anon / Publishable Key are required.',
      });
      return;
    }

    setConnecting(true);
    try {
      const res = await api.connectSupabase(urlInput.trim(), anonKeyInput.trim());
      setProbe(res.probe);
      setStatus(res.status);
      setAnonKeyInput('');
      await loadStatus();
      await onConnectionChanged();
      setFeedback({
        type: 'success',
        text: 'Website successfully connected to Supabase!',
      });
    } catch (err: any) {
      if (err?.probe) setProbe(err.probe);
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to connect website to Supabase.',
      });
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setFeedback(null);
    try {
      await api.disconnectSupabase();
      setProbe(null);
      setConfirmDisconnect(false);
      await loadStatus();
      await onConnectionChanged();
      setFeedback({
        type: 'success',
        text: 'Disconnected from Supabase. Website returned to local storage mode.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Unable to disconnect Supabase.',
      });
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleSupabaseAdminSignIn(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!sbLoginId.trim() || !sbLoginPassword) {
      setFeedback({
        type: 'error',
        text: 'Please enter your Supabase administrator email/username and password.',
      });
      return;
    }

    setSbLoggingIn(true);
    try {
      await api.loginAdmin(sbLoginId.trim(), sbLoginPassword, true);
      setSbLoginPassword('');
      await loadStatus();
      await onConnectionChanged();
      setFeedback({
        type: 'success',
        text: 'Signed in to Supabase Administrator session.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Supabase sign-in failed. Make sure the user exists in Authentication and admin_users.',
      });
    } finally {
      setSbLoggingIn(false);
    }
  }

  async function copySql(id: 'schema' | 'migration' | 'admin', content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2500);
    } catch {
      setFeedback({
        type: 'error',
        text: 'Clipboard access was blocked by the browser. Please copy manually.',
      });
    }
  }

  const isConnected = Boolean(status?.configured);
  const isEnvManaged = status?.source === 'env';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101C32]">
          Supabase Database Connection
        </h2>
        <p className="text-xs sm:text-sm text-[#202020]/70">
          Connect your website directly to your Supabase PostgreSQL database and media storage bucket.
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-sm border text-xs font-medium flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Current Connection Status Banner */}
      <div className="bg-white border border-[#101C32]/12 rounded-sm p-5 sm:p-6">
        {loadingStatus ? (
          <div className="flex items-center gap-2 text-xs text-[#202020]/70">
            <Loader2 className="w-4 h-4 animate-spin text-[#D6AD32]" />
            <span>Checking Supabase connection status...</span>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-sm flex items-center justify-center shrink-0 ${
                  isConnected ? 'bg-[#16A34A]/12 text-[#16A34A]' : 'bg-[#101C32] text-[#D6AD32]'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#101C32]">
                    {isConnected ? 'Connected to Supabase' : 'Local Server Storage Active'}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-sm ${
                      isConnected
                        ? 'bg-[#16A34A]/12 text-[#16A34A]'
                        : 'bg-[#D6AD32]/20 text-[#101C32]'
                    }`}
                  >
                    {isConnected
                      ? isEnvManaged
                        ? 'Environment Variables'
                        : 'Connected via Dashboard'
                      : 'Not Connected to Supabase'}
                  </span>
                </div>

                {isConnected ? (
                  <div className="mt-1.5 space-y-0.5 text-xs text-[#202020]/75 break-all">
                    <p>
                      <span className="font-semibold text-[#101C32]">Project URL:</span>{' '}
                      <span className="font-mono">{status?.url}</span>
                    </p>
                    {status?.masked_key && (
                      <p>
                        <span className="font-semibold text-[#101C32]">Anon Key:</span>{' '}
                        <span className="font-mono">{status.masked_key}</span>
                      </p>
                    )}
                    {status?.connected_at && (
                      <p className="text-[11px] text-[#202020]/55">
                        Connected on {new Date(status.connected_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-[#202020]/70">
                    Your website is currently saving properties, media, and enquiries locally. Enter your Supabase details below to connect live cloud database & storage.
                  </p>
                )}
              </div>
            </div>

            {isConnected && (
              <div className="shrink-0">
                {isEnvManaged ? (
                  <span className="inline-block text-[11px] text-[#202020]/60 bg-[#F8F7F3] border border-[#101C32]/12 px-3 py-2 rounded-sm">
                    Managed via VITE_SUPABASE_* env vars
                  </span>
                ) : confirmDisconnect ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={disconnecting}
                      onClick={handleDisconnect}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-sm disabled:opacity-60"
                    >
                      {disconnecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Unplug className="w-3.5 h-3.5" />
                      )}
                      <span>Confirm Disconnect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnect(false)}
                      className="px-3 py-2 text-xs font-semibold text-[#101C32] bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnect(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-sm transition-colors"
                  >
                    <Unplug className="w-3.5 h-3.5" />
                    <span>Disconnect Supabase</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supabase Admin Session Card (when connected to Supabase, ensure admin Auth session is active) */}
      {isConnected && (
        <div
          className={`rounded-sm border p-5 sm:p-6 ${
            authStatus.signedIn && authStatus.isAdminRow
              ? 'bg-[#16A34A]/5 border-[#16A34A]/25'
              : 'bg-[#D6AD32]/10 border-[#D6AD32]/40'
          }`}
        >
          {authStatus.signedIn && authStatus.isAdminRow ? (
            <div className="flex items-center gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0" />
              <div>
                <p className="font-semibold text-[#101C32]">
                  Supabase Admin Session Authenticated
                </p>
                <p className="text-[#202020]/70 mt-0.5">
                  Signed in as <span className="font-mono font-semibold">{authStatus.email}</span>. You have full permission to publish properties, upload photos/videos, and view enquiries.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-[#B58F21] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-base font-bold text-[#101C32]">
                    Sign In with Your Supabase Admin Account
                  </h3>
                  <p className="text-xs text-[#202020]/75 mt-1">
                    {authStatus.signedIn && !authStatus.isAdminRow
                      ? 'Your current Supabase account is not linked in the admin_users table yet. Run Step 3 SQL below, then sign in again.'
                      : 'Because your database uses Supabase Row Level Security (RLS), sign in with your Supabase Auth administrator credentials to save properties, upload media, and view enquiries.'}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSupabaseAdminSignIn}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-[#101C32] mb-1">
                    Admin Email or Username
                  </label>
                  <input
                    type="text"
                    value={sbLoginId}
                    onChange={(e) => setSbLoginId(e.target.value)}
                    placeholder="e.g. Ibilateberepele17@gmail.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#101C32]/20 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#101C32] mb-1">
                    Supabase Password
                  </label>
                  <input
                    type="password"
                    value={sbLoginPassword}
                    onChange={(e) => setSbLoginPassword(e.target.value)}
                    placeholder="Enter Supabase password"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#101C32]/20 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sbLoggingIn}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm transition-colors disabled:opacity-60 h-[34px]"
                >
                  {sbLoggingIn && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D6AD32]" />}
                  <span>Authenticate Supabase Session</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Connect / Update Form */}
      <form
        onSubmit={handleConnect}
        className="bg-white border border-[#101C32]/12 rounded-sm p-5 sm:p-8 space-y-5"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#101C32]/10 pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#101C32]">
              {isConnected
                ? 'Update or Switch Supabase Project'
                : 'Connect Your Supabase Project'}
            </h3>
            <p className="text-xs text-[#202020]/65 mt-0.5">
              Find these values in your Supabase Dashboard under{' '}
              <span className="font-semibold text-[#101C32]">Project Settings → API</span>.
            </p>
          </div>
          <Link2 className="w-5 h-5 text-[#D6AD32] shrink-0" />
        </div>

        <div className="p-3.5 bg-[#F8F7F3] border border-[#D6AD32]/35 rounded-sm text-xs text-[#101C32] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#B58F21] shrink-0 mt-0.5" />
          <span>
            <strong>Security Check:</strong> Enter ONLY your <strong>Public Anon / Publishable Key</strong>. Never paste a <code className="font-mono bg-white px-1 py-0.5 border border-[#101C32]/10 rounded-sm">service_role</code> or secret key.
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Supabase Public Anon / Publishable Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                required
                value={anonKeyInput}
                onChange={(e) => setAnonKeyInput(e.target.value)}
                placeholder={
                  isConnected
                    ? 'Paste anon/publishable key to test or update'
                    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
                className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#101C32]/60 hover:text-[#101C32]"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Probe Diagnostics Checklist */}
        {probe && (
          <div className="p-4 bg-[#F8F7F3] border border-[#101C32]/12 rounded-sm space-y-2.5">
            <p className="text-xs font-semibold text-[#101C32]">
              Supabase Diagnostics ({probe.url})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <DiagnosticRow ok={probe.reachable} label="Project URL & API Key Reachable" />
              <DiagnosticRow
                ok={probe.schemaReady}
                label="Core Tables (website_settings & categories)"
              />
              <DiagnosticRow ok={probe.propertiesReady} label="Properties Table Ready" />
              <DiagnosticRow ok={probe.videosReady} label="Property Videos Table Ready" />
              <DiagnosticRow
                ok={probe.storageReady}
                label="Storage Bucket (property-media) Ready"
              />
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#101C32]/10 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={testing || connecting}
            onClick={handleTestConnection}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#101C32] bg-[#F8F7F3] hover:bg-[#101C32] hover:text-white border border-[#101C32]/20 rounded-sm transition-colors disabled:opacity-60"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlugZap className="w-4 h-4 text-[#D6AD32]" />
            )}
            <span>Test Connection</span>
          </button>

          <button
            type="submit"
            disabled={connecting || testing}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors disabled:opacity-60"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>Connect Website to Supabase</span>
          </button>
        </div>
      </form>

      {/* Setup Guide & SQL Helpers */}
      <div className="bg-white border border-[#101C32]/12 rounded-sm p-5 sm:p-8 space-y-5">
        <div>
          <h3 className="font-display text-lg font-bold text-[#101C32]">
            3-Step Supabase Database Setup
          </h3>
          <p className="text-xs text-[#202020]/70 mt-0.5">
            Run these SQL scripts inside your Supabase Dashboard → SQL Editor so all tables, fees, videos, and media storage work properly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm space-y-2.5">
            <p className="font-semibold text-[#101C32]">
              Step 1: Create Tables & Storage
            </p>
            <p className="text-[#202020]/70 leading-relaxed">
              Open SQL Editor in your Supabase project, copy the full schema SQL, and click Run. If upgrading an existing database, run the V2 Upgrade SQL instead.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => copySql('schema', schemaSql)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm"
              >
                {copiedId === 'schema' ? (
                  <Check className="w-3.5 h-3.5 text-[#D6AD32]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#D6AD32]" />
                )}
                <span>{copiedId === 'schema' ? 'Copied Schema SQL!' : 'Copy Full Schema SQL'}</span>
              </button>
              <button
                type="button"
                onClick={() => copySql('migration', migrationV2Sql)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#101C32] bg-white border border-[#101C32]/20 hover:border-[#D6AD32] rounded-sm"
              >
                {copiedId === 'migration' ? (
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#B58F21]" />
                )}
                <span>{copiedId === 'migration' ? 'Copied V2 SQL!' : 'Copy V2 Upgrade SQL'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm space-y-2.5">
            <p className="font-semibold text-[#101C32]">
              Step 2: Link Your Admin User
            </p>
            <p className="text-[#202020]/70 leading-relaxed">
              In Supabase Authentication → Users, create your admin account, replace the email in this SQL snippet, and run it in SQL Editor.
            </p>
            <button
              type="button"
              onClick={() => copySql('admin', LINK_ADMIN_SQL)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm"
            >
              {copiedId === 'admin' ? (
                <Check className="w-3.5 h-3.5 text-[#D6AD32]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#D6AD32]" />
              )}
              <span>{copiedId === 'admin' ? 'Copied Admin SQL!' : 'Copy Admin Link SQL'}</span>
            </button>
          </div>

          <div className="p-4 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm space-y-2">
            <p className="font-semibold text-[#101C32]">
              Step 3: Paste URL & Key Above
            </p>
            <p className="text-[#202020]/70 leading-relaxed">
              Go to Project Settings → API in Supabase, copy your <strong>Project URL</strong> and <strong>anon / publishable key</strong>, click <strong>Test Connection</strong>, and then click <strong>Connect Website to Supabase</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
      )}
      <span className={ok ? 'text-[#101C32] font-medium' : 'text-amber-800 font-medium'}>
        {label}
      </span>
    </div>
  );
}
