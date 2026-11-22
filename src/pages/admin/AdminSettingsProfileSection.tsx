import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Save, Upload, UserCog } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminUser, WebsiteSettings } from '../../types';

export function AdminWebsiteSettingsSection({
  settings,
  onSaved,
}: {
  settings: WebsiteSettings;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<WebsiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const item = await api.uploadMediaFile(file, {
        title: 'Company Logo',
        category: 'Branding',
        show_in_gallery: false,
      });
      setForm((prev) => ({ ...prev, logo_url: item.image_url }));
    } catch (err: any) {
      setError(err?.message || 'Logo upload failed.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      await api.updateWebsiteSettings(form);
      await onSaved();
      setSavedMsg('Website settings saved and reflected on the public site.');
    } catch (err: any) {
      setError(err?.message || 'Unable to save website settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101C32]">
          Website Settings
        </h2>
        <p className="text-xs sm:text-sm text-[#202020]/70">
          Customize homepage hero copy, branding logo, and public contact information.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-sm text-xs font-semibold text-[#16A34A] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-800">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-8 space-y-5"
      >
        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Hero Location Label
          </label>
          <input
            type="text"
            value={form.hero_location_label}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, hero_location_label: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Homepage Main Heading
          </label>
          <input
            type="text"
            value={form.hero_heading}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, hero_heading: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Homepage Description
          </label>
          <textarea
            rows={3}
            value={form.hero_description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, hero_description: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>

        <div className="pt-2 border-t border-[#101C32]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {form.logo_url && (
              <img
                src={form.logo_url}
                alt="Company logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 object-contain border border-[#101C32]/15 rounded-sm p-1 bg-[#F8F7F3]"
              />
            )}
            <div>
              <p className="text-xs font-semibold text-[#101C32]">Company Logo</p>
              <p className="text-[11px] text-[#202020]/65">
                Upload a custom square PNG/SVG logo for the navigation bar.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm cursor-pointer">
            {uploadingLogo ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#D6AD32]" />
            ) : (
              <Upload className="w-4 h-4 text-[#D6AD32]" />
            )}
            <span>Upload Logo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-[#101C32]/10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Website Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminCompanyInfoSection({
  settings,
  onSaved,
}: {
  settings: WebsiteSettings;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<WebsiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      await api.updateWebsiteSettings(form);
      await onSaved();
      setSavedMsg('Company information updated successfully.');
    } catch (err: any) {
      setError(err?.message || 'Unable to update company information.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101C32]">
          Company Information
        </h2>
        <p className="text-xs sm:text-sm text-[#202020]/70">
          Update official business contact numbers, WhatsApp, Instagram, and office address.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-sm text-xs font-semibold text-[#16A34A] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-800">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-8 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Business Name
            </label>
            <input
              type="text"
              required
              value={form.company_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, company_name: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Business Phone Number
            </label>
            <input
              type="text"
              required
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              WhatsApp Number
            </label>
            <input
              type="text"
              required
              value={form.whatsapp}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsapp: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Instagram Username
            </label>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, instagram: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Business Email Address
            </label>
            <input
              type="email"
              value={form.email || 'Ibilateberepele17@gmail.com'}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Office Address
            </label>
            <input
              type="text"
              required
              value={form.office_address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, office_address: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Business Description
          </label>
          <textarea
            rows={3}
            value={form.company_description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, company_description: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>

        <div className="pt-4 border-t border-[#101C32]/10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Company Info</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminProfileSection({
  user,
  onUserUpdated,
}: {
  user: AdminUser;
  onUserUpdated?: (updated: AdminUser) => void;
}) {
  // Change Username state
  const [newUsername, setNewUsername] = useState(user.username);
  const [usernamePassword, setUsernamePassword] = useState('');
  const [showUsernamePwd, setShowUsernamePwd] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChangeUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsernameSuccess(null);
    setUsernameError(null);

    const trimmed = newUsername.trim();
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(trimmed)) {
      setUsernameError(
        'Username must be 3–40 characters using only letters, numbers, dots, underscores, or hyphens.'
      );
      return;
    }
    if (trimmed === user.username) {
      setUsernameError('Please enter a different username from your current one.');
      return;
    }
    if (!usernamePassword) {
      setUsernameError('Please enter your current password to confirm the username change.');
      return;
    }

    setSavingUsername(true);
    try {
      const updated = await api.changeAdminUsername(trimmed, usernamePassword);
      onUserUpdated?.(updated);
      setNewUsername(updated.username);
      setUsernamePassword('');
      setUsernameSuccess(`Administrator username updated to "${updated.username}".`);
    } catch (err: any) {
      setUsernameError(err?.message || 'Unable to update administrator username.');
    } finally {
      setSavingUsername(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.changeAdminPassword(currentPassword, newPassword);
      setSuccessMsg('Administrator password updated securely.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101C32]">
          Admin Username &amp; Password
        </h2>
        <p className="text-xs sm:text-sm text-[#202020]/70">
          Review your administrator identity and update your login username or password securely.
        </p>
      </div>

      <div className="bg-white border border-[#101C32]/12 rounded-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <p className="text-[#202020]/60 mb-1">Current Username</p>
          <p className="font-semibold text-sm text-[#101C32]">{user.username}</p>
        </div>
        <div>
          <p className="text-[#202020]/60 mb-1">Email</p>
          <p className="font-semibold text-sm text-[#101C32]">{user.email}</p>
        </div>
        <div>
          <p className="text-[#202020]/60 mb-1">Role</p>
          <p className="font-semibold text-sm text-[#B58F21] capitalize">
            {user.role.replace('_', ' ')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <form
          onSubmit={handleChangeUsername}
          className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-8 space-y-4"
        >
          <h3 className="font-display text-lg font-bold text-[#101C32] flex items-center gap-2">
            <UserCog className="w-5 h-5 text-[#D6AD32]" />
            <span>Change Admin Username</span>
          </h3>

          {usernameSuccess && (
            <div className="p-3 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-sm text-xs font-semibold text-[#16A34A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{usernameSuccess}</span>
            </div>
          )}
          {usernameError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-800">
              {usernameError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              New Admin Username
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
            <p className="text-[11px] text-[#202020]/60 mt-1">
              3–40 characters (letters, numbers, dots, underscores, or hyphens).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Current Password (to confirm)
            </label>
            <div className="relative">
              <input
                type={showUsernamePwd ? 'text' : 'password'}
                required
                value={usernamePassword}
                onChange={(e) => setUsernamePassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
              />
              <button
                type="button"
                onClick={() => setShowUsernamePwd((prev) => !prev)}
                aria-label={showUsernamePwd ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#101C32]/60 hover:text-[#101C32]"
              >
                {showUsernamePwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingUsername}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors disabled:opacity-60"
          >
            {savingUsername && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Update Username</span>
          </button>
        </form>

        <form
          onSubmit={handleChangePassword}
          className="bg-white border border-[#101C32]/12 rounded-sm p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-[#101C32] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#D6AD32]" />
              <span>Change Admin Password</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowPasswords((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#101C32]/70 hover:text-[#101C32]"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          {successMsg && (
            <div className="p-3 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-sm text-xs font-semibold text-[#16A34A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Current Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              New Password (min. 4 characters)
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Update Password</span>
          </button>
        </form>
      </div>
    </div>
  );
}
