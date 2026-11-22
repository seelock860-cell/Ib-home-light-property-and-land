import React, { useState } from 'react';
import { Eye, EyeOff, FolderPlus, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { api } from '../../lib/api';
import { GalleryItem, Property, PropertyCategory } from '../../types';
import { SmartImage } from '../../components/SmartImage';

export function AdminMediaSection({
  mediaItems,
  properties,
  onDataChanged,
}: {
  mediaItems: GalleryItem[];
  properties: Property[];
  onDataChanged: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        await api.uploadMediaFile(file, {
          title: file.name.replace(/\.[^.]+$/, ''),
          category: 'Property Media',
          show_in_gallery: true,
        });
      }
      await onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleAssignProperty(item: GalleryItem, propertyId: string) {
    setBusyId(item.id);
    try {
      const targetProp = properties.find((p) => p.id === propertyId);
      await api.updateMediaItem(item.id, {
        property_id: propertyId || null,
        category: targetProp ? targetProp.category_name : item.category,
      });
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleGallery(item: GalleryItem) {
    setBusyId(item.id);
    try {
      await api.updateMediaItem(item.id, { show_in_gallery: !item.show_in_gallery });
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: GalleryItem) {
    setBusyId(item.id);
    try {
      await api.deleteMediaItem(item);
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#101C32]">
            Property Gallery & Media
          </h2>
          <p className="text-xs sm:text-sm text-[#202020]/70">
            Upload, preview, assign photographs to properties, and control public gallery visibility.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm cursor-pointer transition-colors whitespace-nowrap self-start">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload Photographs</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-800">
          {error}
        </div>
      )}

      {mediaItems.length === 0 ? (
        <div className="bg-white border border-[#101C32]/12 rounded-sm p-12 text-center">
          <ImageIcon className="w-9 h-9 text-[#D6AD32] mx-auto mb-3" />
          <p className="font-display text-lg font-semibold text-[#101C32] mb-1">
            No Uploaded Property Media Yet
          </p>
          <p className="text-xs text-[#202020]/70">
            Upload photographs here or directly while adding a property. Uploaded files appear in your media library and public gallery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mediaItems.map((item) => {
            const isBusy = busyId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white border border-[#101C32]/12 rounded-sm overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-[#101C32] overflow-hidden">
                  <SmartImage
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#101C32] truncate">{item.title}</p>
                    <p className="text-[11px] text-[#B58F21]">{item.category}</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#202020]/65 mb-1">
                      Assign to Property
                    </label>
                    <select
                      disabled={isBusy}
                      value={item.property_id || ''}
                      onChange={(e) => handleAssignProperty(item, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                    >
                      <option value="">Unassigned / General Gallery</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 border-t border-[#101C32]/10 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleGallery(item)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-sm ${
                        item.show_in_gallery
                          ? 'bg-[#16A34A]/15 text-[#16A34A]'
                          : 'bg-[#101C32]/10 text-[#101C32]/70'
                      }`}
                    >
                      {item.show_in_gallery ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>In Gallery</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(item)}
                      aria-label={`Delete ${item.title}`}
                      className="p-1.5 text-red-700 hover:bg-red-50 rounded-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminCategoriesSection({
  categories,
  onDataChanged,
}: {
  categories: PropertyCategory[];
  onDataChanged: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createCategory(name, description);
      setName('');
      setDescription('');
      await onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Unable to add category.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteCategory(id);
      await onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Unable to delete category.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101C32]">
          Property Categories
        </h2>
        <p className="text-xs sm:text-sm text-[#202020]/70">
          Organize your portfolio across residential, land, commercial, and fuel station categories.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white border border-[#101C32]/12 rounded-sm p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Category Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Waterfront Estates"
            className="w-full px-3.5 py-2 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short category summary"
            className="w-full px-3.5 py-2 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#101C32]/12 rounded-sm divide-y divide-[#101C32]/10">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 flex items-center justify-between gap-4 text-xs"
          >
            <div>
              <p className="font-semibold text-sm text-[#101C32]">{cat.name}</p>
              <p className="text-[#202020]/70 mt-0.5">{cat.description || '—'}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-mono tabular-nums font-semibold text-[#101C32]">
                {cat.property_count ?? 0} listings
              </span>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                aria-label={`Delete ${cat.name}`}
                className="p-1.5 text-red-700 hover:bg-red-50 rounded-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
