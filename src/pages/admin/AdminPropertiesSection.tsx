import React, { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Film,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  ADMIN_PROPERTY_CATEGORIES,
  DEFAULT_FEE_VISIBILITY,
  LISTING_TYPES,
  PRESET_PROPERTY_FEATURES,
  calculatePropertyTotals,
  formatNaira,
} from '../../lib/constants';
import {
  FeeVisibility,
  ListingType,
  Property,
  PropertyAvailability,
  PropertyCategory,
  PropertyImage,
  PropertyVideo,
} from '../../types';
import { SmartImage } from '../../components/SmartImage';

interface AdminPropertiesProps {
  properties: Property[];
  categories: PropertyCategory[];
  editingProperty: Property | null;
  mode: 'list' | 'form';
  onStartCreate: () => void;
  onStartEdit: (prop: Property) => void;
  onCancelForm: () => void;
  onDataChanged: () => Promise<void>;
}

export function AdminPropertiesSection({
  properties,
  categories,
  editingProperty,
  mode,
  onStartCreate,
  onStartEdit,
  onCancelForm,
  onDataChanged,
}: AdminPropertiesProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterListingType, setFilterListingType] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (filterStatus !== 'all' && p.availability !== filterStatus) return false;
      if (filterListingType !== 'all' && p.listing_type !== filterListingType) return false;
      if (q) {
        const hay = `${p.title} ${p.location} ${p.category_name} ${p.listing_type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [properties, search, filterStatus, filterListingType]);

  async function handleQuickAvailability(prop: Property, availability: PropertyAvailability) {
    setBusyId(prop.id);
    try {
      await api.updateProperty(prop.id, { availability });
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleTogglePublish(prop: Property) {
    setBusyId(prop.id);
    try {
      await api.updateProperty(prop.id, { is_published: !prop.is_published });
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleFeature(prop: Property) {
    setBusyId(prop.id);
    try {
      await api.updateProperty(prop.id, { is_featured: !prop.is_featured });
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await api.deleteProperty(id);
      setConfirmDeleteId(null);
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  if (mode === 'form') {
    return (
      <PropertyForm
        initialProperty={editingProperty}
        categories={categories}
        onCancel={onCancelForm}
        onSaved={async () => {
          await onDataChanged();
          onCancelForm();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#101C32]">
            Manage Properties
          </h2>
          <p className="text-xs sm:text-sm text-[#202020]/70">
            Manage property details, transparent pricing &amp; fees, photos, videos, features, and availability status.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors whitespace-nowrap self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Property</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#101C32]/12 rounded-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#101C32]/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties by title, category, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>
        <select
          value={filterListingType}
          onChange={(e) => setFilterListingType(e.target.value)}
          aria-label="Filter by listing type"
          className="px-3 py-2 text-xs sm:text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
        >
          <option value="all">All Listing Types</option>
          {LISTING_TYPES.map((lt) => (
            <option key={lt} value={lt}>
              {lt}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by availability status"
          className="px-3 py-2 text-xs sm:text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="sold">Sold</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Properties Table */}
      <div className="bg-white border border-[#101C32]/12 rounded-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-lg font-semibold text-[#101C32] mb-2">
              {properties.length === 0 ? 'No Properties Added Yet' : 'No Matching Properties'}
            </p>
            <p className="text-xs text-[#202020]/70 mb-5">
              Add verified residential homes, dry land, commercial buildings, or fuel stations.
            </p>
            {properties.length === 0 && (
              <button
                type="button"
                onClick={onStartCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Property</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F7F3] border-b border-[#101C32]/10 text-[11px] font-semibold text-[#101C32]/75">
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Type &amp; Category</th>
                  <th className="py-3 px-4 text-right">Base Price</th>
                  <th className="py-3 px-4 text-right">Total Payable</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101C32]/10 text-xs">
                {filtered.map((prop) => {
                  const thumb =
                    prop.images?.find((i) => i.is_primary)?.image_url ||
                    prop.images?.[0]?.image_url;
                  const isBusy = busyId === prop.id;
                  const totals = calculatePropertyTotals(prop);

                  return (
                    <tr key={prop.id} className="hover:bg-[#F8F7F3]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-sm overflow-hidden bg-[#101C32] shrink-0">
                            <SmartImage
                              src={thumb}
                              alt={prop.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#101C32] truncate max-w-[200px]">
                              {prop.title}
                            </p>
                            <p className="text-[11px] text-[#202020]/65 truncate max-w-[200px]">
                              {prop.location}
                              {prop.videos?.length ? ` · ${prop.videos.length} video${prop.videos.length > 1 ? 's' : ''}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-semibold text-[#B58F21] text-[11px]">{prop.listing_type}</p>
                        <p className="text-[#202020]/80">{prop.category_name}</p>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#101C32] whitespace-nowrap">
                        {formatNaira(prop.price, prop.price_display)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#16A34A] whitespace-nowrap">
                        {formatNaira(totals.totalPayable)}
                      </td>

                      <td className="py-3 px-4">
                        <select
                          disabled={isBusy}
                          value={prop.availability}
                          onChange={(e) =>
                            handleQuickAvailability(prop, e.target.value as PropertyAvailability)
                          }
                          aria-label={`Availability for ${prop.title}`}
                          className="px-2.5 py-1 text-xs font-medium bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                        >
                          <option value="available">Available</option>
                          <option value="rented">Rented</option>
                          <option value="sold">Sold</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleTogglePublish(prop)}
                            title={prop.is_published ? 'Published (click to unpublish)' : 'Draft (click to publish)'}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-semibold transition-colors ${
                              prop.is_published
                                ? 'bg-[#16A34A]/15 text-[#16A34A]'
                                : 'bg-[#101C32]/10 text-[#101C32]/70'
                            }`}
                          >
                            {prop.is_published ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Draft</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleFeature(prop)}
                            title={prop.is_featured ? 'Featured on Homepage' : 'Feature on Homepage'}
                            className={`p-1.5 rounded-sm border transition-colors ${
                              prop.is_featured
                                ? 'border-[#D6AD32] bg-[#D6AD32]/15 text-[#B58F21]'
                                : 'border-[#101C32]/15 text-[#101C32]/40 hover:text-[#B58F21]'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" fill={prop.is_featured ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {confirmDeleteId === prop.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDelete(prop.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-red-600 text-white rounded-sm hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-[11px] text-[#101C32] bg-[#F8F7F3] rounded-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onStartEdit(prop)}
                              aria-label={`Edit ${prop.title}`}
                              className="p-1.5 text-[#101C32] hover:bg-[#101C32] hover:text-white rounded-sm transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(prop.id)}
                              aria-label={`Delete ${prop.title}`}
                              className="p-1.5 text-red-700 hover:bg-red-600 hover:text-white rounded-sm transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface PropertyFormProps {
  initialProperty: Property | null;
  categories: PropertyCategory[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}

function PropertyForm({
  initialProperty,
  onCancel,
  onSaved,
}: PropertyFormProps) {
  const catNames = useMemo(() => {
    const base = [...ADMIN_PROPERTY_CATEGORIES] as string[];
    if (initialProperty?.category_name && !base.includes(initialProperty.category_name)) {
      base.push(initialProperty.category_name);
    }
    return base;
  }, [initialProperty?.category_name]);

  const listingOptions = useMemo(() => {
    const base = [...LISTING_TYPES] as ListingType[];
    if (initialProperty?.listing_type && !base.includes(initialProperty.listing_type)) {
      base.push(initialProperty.listing_type);
    }
    return base;
  }, [initialProperty?.listing_type]);

  // 1. Property Information
  const [title, setTitle] = useState(initialProperty?.title || '');
  const [categoryName, setCategoryName] = useState(
    initialProperty?.category_name || catNames[0] || 'Self-contained'
  );
  const [listingType, setListingType] = useState<ListingType>(
    initialProperty?.listing_type || 'For Sale'
  );
  const [location, setLocation] = useState(initialProperty?.location || '');
  const [bedrooms, setBedrooms] = useState(
    initialProperty?.bedrooms !== null && initialProperty?.bedrooms !== undefined
      ? String(initialProperty.bedrooms)
      : ''
  );
  const [bathrooms, setBathrooms] = useState(
    initialProperty?.bathrooms !== null && initialProperty?.bathrooms !== undefined
      ? String(initialProperty.bathrooms)
      : ''
  );
  const [propertySize, setPropertySize] = useState(initialProperty?.property_size || '');
  const [shortDescription, setShortDescription] = useState(
    initialProperty?.short_description || ''
  );
  const [fullDescription, setFullDescription] = useState(
    initialProperty?.full_description || ''
  );

  // B. Pricing & All Fees
  const [price, setPrice] = useState(
    initialProperty?.price ? String(initialProperty.price) : ''
  );
  const [priceDisplay, setPriceDisplay] = useState(
    initialProperty?.price_display || ''
  );
  const [cautionFee, setCautionFee] = useState(
    initialProperty?.caution_fee ? String(initialProperty.caution_fee) : ''
  );
  const [drinkingMoney, setDrinkingMoney] = useState(
    initialProperty?.drinking_money ? String(initialProperty.drinking_money) : ''
  );
  const [movementFee, setMovementFee] = useState(
    initialProperty?.movement_fee ? String(initialProperty.movement_fee) : ''
  );
  const [agreementFee, setAgreementFee] = useState(
    initialProperty?.agreement_fee ? String(initialProperty.agreement_fee) : ''
  );
  const [legalFee, setLegalFee] = useState(
    initialProperty?.legal_fee ? String(initialProperty.legal_fee) : ''
  );
  const [agentCommissionPercent, setAgentCommissionPercent] = useState(
    initialProperty?.agent_commission_percent
      ? String(initialProperty.agent_commission_percent)
      : ''
  );
  const [agentCommissionAmount, setAgentCommissionAmount] = useState(
    initialProperty?.agent_commission_amount
      ? String(initialProperty.agent_commission_amount)
      : ''
  );
  const [feeVisibility, setFeeVisibility] = useState<FeeVisibility>({
    ...DEFAULT_FEE_VISIBILITY,
    ...(initialProperty?.fee_visibility || {}),
  });

  // C & D. Photographs & Videos
  const [images, setImages] = useState<PropertyImage[]>(initialProperty?.images || []);
  const [videos, setVideos] = useState<PropertyVideo[]>(initialProperty?.videos || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);

  // E. Property Features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    initialProperty?.features || []
  );
  const [customFeatureInput, setCustomFeatureInput] = useState('');

  // F. Status & Publishing
  const [availability, setAvailability] = useState<PropertyAvailability>(
    initialProperty?.availability || 'available'
  );
  const [isFeatured, setIsFeatured] = useState(
    initialProperty ? Boolean(initialProperty.is_featured) : true
  );
  const [isPublished, setIsPublished] = useState(
    initialProperty ? Boolean(initialProperty.is_published) : true
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live numeric computations
  const numPrice = Number(price.replace(/,/g, '')) || 0;
  const numCaution = Number(cautionFee.replace(/,/g, '')) || 0;
  const numDrinking = Number(drinkingMoney.replace(/,/g, '')) || 0;
  const numMovement = Number(movementFee.replace(/,/g, '')) || 0;
  const numAgreement = Number(agreementFee.replace(/,/g, '')) || 0;
  const numLegal = Number(legalFee.replace(/,/g, '')) || 0;
  const numCommPct = Number(agentCommissionPercent) || 0;
  const numCommAmt = Number(agentCommissionAmount.replace(/,/g, '')) || 0;

  const totals = calculatePropertyTotals({
    price: numPrice,
    caution_fee: numCaution,
    drinking_money: numDrinking,
    movement_fee: numMovement,
    agreement_fee: numAgreement,
    legal_fee: numLegal,
    agent_commission_amount: numCommAmt,
    fee_visibility: feeVisibility,
  });

  function handleBasePriceChange(val: string) {
    setPrice(val);
    const parsedPrice = Number(val.replace(/,/g, '')) || 0;
    const pct = Number(agentCommissionPercent) || 0;
    if (pct > 0) {
      setAgentCommissionAmount(String(Math.round((parsedPrice * pct) / 100)));
    }
  }

  function handleCommissionPercentChange(val: string) {
    setAgentCommissionPercent(val);
    const pct = Number(val) || 0;
    if (pct > 0 && numPrice > 0) {
      setAgentCommissionAmount(String(Math.round((numPrice * pct) / 100)));
    } else if (!val || pct === 0) {
      setAgentCommissionAmount('');
    }
  }

  function toggleFeeVisibility(key: keyof FeeVisibility) {
    setFeeVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    setError(null);
    try {
      const uploaded: PropertyImage[] = [];
      for (const file of files) {
        const mediaItem = await api.uploadMediaFile(file, {
          title: title || file.name,
          category: categoryName,
          show_in_gallery: true,
        });
        uploaded.push({
          id: mediaItem.id,
          property_id: initialProperty?.id || '',
          image_url: mediaItem.image_url,
          storage_path: mediaItem.storage_path || '',
          caption: mediaItem.title,
          is_primary: images.length === 0 && uploaded.length === 0,
          sort_order: images.length + uploaded.length,
        });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err: any) {
      setError(err?.message || 'Image upload failed.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  }

  async function handleReplaceImage(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImages(true);
    setError(null);
    try {
      const mediaItem = await api.uploadMediaFile(file, {
        title: title || file.name,
        category: categoryName,
        show_in_gallery: true,
      });
      setImages((prev) =>
        prev.map((img, i) =>
          i === index
            ? {
                ...img,
                id: mediaItem.id,
                image_url: mediaItem.image_url,
                storage_path: mediaItem.storage_path || '',
                caption: mediaItem.title,
              }
            : img
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to replace photograph.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  }

  function setPrimaryImage(index: number) {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    );
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((i) => i.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  }

  async function handleVideoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingVideos(true);
    setError(null);
    try {
      const uploaded: PropertyVideo[] = [];
      for (const file of files) {
        const res = await api.uploadPropertyVideoFile(file, file.name.replace(/\.[^.]+$/, ''));
        uploaded.push({
          id: crypto.randomUUID ? crypto.randomUUID() : `vid-${Date.now()}-${uploaded.length}`,
          property_id: initialProperty?.id || '',
          video_url: res.video_url,
          storage_path: res.storage_path,
          caption: res.caption,
          mime_type: res.mime_type,
          sort_order: videos.length + uploaded.length,
        });
      }
      setVideos((prev) => [...prev, ...uploaded]);
    } catch (err: any) {
      setError(err?.message || 'Video upload failed.');
    } finally {
      setUploadingVideos(false);
      e.target.value = '';
    }
  }

  async function handleReplaceVideo(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideos(true);
    setError(null);
    try {
      const res = await api.uploadPropertyVideoFile(file, videos[index]?.caption || file.name.replace(/\.[^.]+$/, ''));
      setVideos((prev) =>
        prev.map((vid, i) =>
          i === index
            ? {
                ...vid,
                video_url: res.video_url,
                storage_path: res.storage_path,
                mime_type: res.mime_type,
                caption: vid.caption || res.caption,
              }
            : vid
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to replace video.');
    } finally {
      setUploadingVideos(false);
      e.target.value = '';
    }
  }

  function removeVideo(index: number) {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  }

  function togglePresetFeature(feature: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  }

  function addCustomFeature() {
    const clean = customFeatureInput.trim();
    if (!clean) return;
    if (!selectedFeatures.some((f) => f.toLowerCase() === clean.toLowerCase())) {
      setSelectedFeatures((prev) => [...prev, clean]);
    }
    setCustomFeatureInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !location.trim()) {
      setError('Property title and location are required.');
      return;
    }

    const payload: Partial<Property> = {
      title: title.trim(),
      category_name: categoryName,
      listing_type: listingType,
      location: location.trim(),
      bedrooms: bedrooms.trim() !== '' ? Number(bedrooms) : null,
      bathrooms: bathrooms.trim() !== '' ? Number(bathrooms) : null,
      property_size: propertySize.trim(),
      price: numPrice,
      price_display: priceDisplay.trim() || `₦${numPrice.toLocaleString('en-NG')}`,
      caution_fee: numCaution,
      drinking_money: numDrinking,
      movement_fee: numMovement,
      agreement_fee: numAgreement,
      legal_fee: numLegal,
      agent_commission_percent: numCommPct,
      agent_commission_amount: numCommAmt,
      fee_visibility: feeVisibility,
      short_description: shortDescription.trim(),
      full_description: fullDescription.trim() || shortDescription.trim(),
      features: selectedFeatures,
      availability,
      is_featured: isFeatured,
      is_published: isPublished,
      images,
      videos,
    };

    setSaving(true);
    try {
      if (initialProperty) {
        await api.updateProperty(initialProperty.id, payload);
      } else {
        await api.createProperty(payload);
      }
      await onSaved();
    } catch (err: any) {
      setError(err?.message || 'Unable to save property.');
    } finally {
      setSaving(false);
    }
  }

  const feeRows: {
    key: keyof FeeVisibility;
    label: string;
    refundable: boolean;
    value: string;
    onChange: (v: string) => void;
  }[] = [
    {
      key: 'caution_fee',
      label: 'Refundable Caution Fee (₦)',
      refundable: true,
      value: cautionFee,
      onChange: setCautionFee,
    },
    {
      key: 'drinking_money',
      label: 'Drinking Money (₦)',
      refundable: false,
      value: drinkingMoney,
      onChange: setDrinkingMoney,
    },
    {
      key: 'movement_fee',
      label: 'Movement Fee (₦)',
      refundable: false,
      value: movementFee,
      onChange: setMovementFee,
    },
    {
      key: 'agreement_fee',
      label: 'Agreement Fee (₦)',
      refundable: false,
      value: agreementFee,
      onChange: setAgreementFee,
    },
    {
      key: 'legal_fee',
      label: 'Legal Fee (₦)',
      refundable: false,
      value: legalFee,
      onChange: setLegalFee,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#101C32]/12 rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Header matching second image */}
        <div className="px-5 sm:px-8 pt-6 pb-5 border-b border-[#101C32]/10 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#101C32]">
              {initialProperty ? 'Edit Property Listing' : 'Add New Property'}
            </h2>
            <p className="text-xs sm:text-sm text-[#202020]/70 mt-1">
              Complete property details, pricing charges, photographs, and video tour.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close property form"
            className="p-2 text-[#101C32]/70 hover:text-[#101C32] hover:bg-[#F8F7F3] rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-8 space-y-8">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-800">
              {error}
            </div>
          )}

          {/* 1. PROPERTY INFORMATION */}
          <div className="space-y-4">
            <div className="border-b border-[#101C32]/10 pb-3 flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#D6AD32] shrink-0" />
              <h3 className="font-display text-lg font-bold text-[#101C32]">
                1. Property Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                  Property Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Executive 2-Bedroom Flat in Igwuruta"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-xl text-[#101C32] placeholder:text-[#202020]/45 focus:outline-none focus:border-[#D6AD32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                  Property Category
                </label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-xl text-[#101C32] focus:outline-none focus:border-[#D6AD32]"
                >
                  {catNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                  Listing Type
                </label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as ListingType)}
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-xl text-[#101C32] focus:outline-none focus:border-[#D6AD32]"
                >
                  {listingOptions.map((lt) => (
                    <option key={lt} value={lt}>
                      {lt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Igwuruta, Port Harcourt, Rivers State"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-xl text-[#101C32] placeholder:text-[#202020]/45 focus:outline-none focus:border-[#D6AD32]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                Number of Bedrooms
              </label>
              <input
                type="number"
                min="0"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="e.g. 4 (leave blank for land)"
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                Number of Bathrooms
              </label>
              <input
                type="number"
                min="0"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="e.g. 5 (leave blank for land)"
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                Property Size
              </label>
              <input
                type="text"
                value={propertySize}
                onChange={(e) => setPropertySize(e.target.value)}
                placeholder="e.g. 465 sqm or 2 Plots"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Short Description
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Concise summary displayed on property marketplace cards"
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
              Full Description
            </label>
            <textarea
              rows={4}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed overview of structure, land dimensions, title documents (C of O / Deed of Conveyance), access roads, and surrounding landmarks..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
          </div>
        </div>

        {/* SECTION B: PROPERTY PRICING AND ALL FEES */}
        <div className="space-y-5 pt-4 border-t border-[#101C32]/10">
          <div className="border-b border-[#101C32]/10 pb-2.5">
            <h3 className="font-display text-lg font-bold text-[#101C32]">
              B. Property Pricing &amp; All Fees
            </h3>
            <p className="text-xs text-[#202020]/65 mt-0.5">
              Enter base price and applicable charges. Toggle visibility per fee to control public display.
            </p>
          </div>

          {/* 1. Base Rent or Selling Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                1. Property Rent or Selling Price (₦) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => handleBasePriceChange(e.target.value)}
                placeholder="e.g. 5000000"
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                Custom Price Label (Optional, e.g. ₦5,000,000 / year)
              </label>
              <input
                type="text"
                value={priceDisplay}
                onChange={(e) => setPriceDisplay(e.target.value)}
                placeholder="Auto-formatted if left blank"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
              />
            </div>
          </div>

          {/* 2 - 6. Itemized Charges with Refundable vs Non-Refundable & Public Visibility */}
          <div className="space-y-3">
            {feeRows.map((fee, idx) => {
              const isVisible = feeVisibility[fee.key];
              return (
                <div
                  key={fee.key}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3.5 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm"
                >
                  <div className="sm:col-span-5">
                    <p className="text-xs font-semibold text-[#101C32]">
                      {idx + 2}. {fee.label}
                    </p>
                    <p
                      className={`text-[11px] font-semibold mt-0.5 ${
                        fee.refundable ? 'text-[#16A34A]' : 'text-[#B58F21]'
                      }`}
                    >
                      {fee.refundable ? 'Refundable Charge' : 'Non-Refundable Charge'}
                    </p>
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={fee.value}
                      onChange={(e) => fee.onChange(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                    />
                    {fee.value && Number(fee.value) > 0 && (
                      <button
                        type="button"
                        onClick={() => fee.onChange('')}
                        title="Remove / clear charge"
                        className="px-2.5 py-2 text-xs text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-sm"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="sm:col-span-3 flex sm:justify-end">
                    <button
                      type="button"
                      onClick={() => toggleFeeVisibility(fee.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-sm border transition-colors ${
                        isVisible
                          ? 'bg-white border-[#16A34A]/30 text-[#16A34A]'
                          : 'bg-[#101C32]/10 border-transparent text-[#101C32]/70'
                      }`}
                    >
                      {isVisible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Public</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 7 & 8. Agent Commission % & Amount (Auto-calculated) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3.5 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm">
              <div className="sm:col-span-4">
                <p className="text-xs font-semibold text-[#101C32]">
                  7 &amp; 8. Agent Commission
                </p>
                <p className="text-[11px] font-semibold text-[#B58F21] mt-0.5">
                  Non-Refundable · Auto-calculated from %
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-[#202020]/65 mb-1">
                  Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={agentCommissionPercent}
                  onChange={(e) => handleCommissionPercentChange(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-semibold text-[#202020]/65 mb-1">
                  Amount (₦)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={agentCommissionAmount}
                    onChange={(e) => setAgentCommissionAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                  />
                  {(agentCommissionPercent || agentCommissionAmount) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAgentCommissionPercent('');
                        setAgentCommissionAmount('');
                      }}
                      title="Clear commission"
                      className="px-2.5 py-2 text-xs text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3 flex sm:justify-end sm:pt-4">
                <button
                  type="button"
                  onClick={() => toggleFeeVisibility('agent_commission')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-sm border transition-colors ${
                    feeVisibility.agent_commission
                      ? 'bg-white border-[#16A34A]/30 text-[#16A34A]'
                      : 'bg-[#101C32]/10 border-transparent text-[#101C32]/70'
                  }`}
                >
                  {feeVisibility.agent_commission ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Live Payable Summary Strip */}
          <div className="bg-[#101C32] text-white rounded-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-white/65 mb-1">Base Price</p>
              <p className="text-base font-bold font-mono tabular-nums text-white">
                {formatNaira(totals.basePrice)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/65 mb-1">Refundable Charges</p>
              <p className="text-base font-bold font-mono tabular-nums text-[#16A34A]">
                {formatNaira(totals.refundableTotal)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/65 mb-1">Non-Refundable Charges</p>
              <p className="text-base font-bold font-mono tabular-nums text-[#D6AD32]">
                {formatNaira(totals.nonRefundableTotal)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/65 mb-1">Total Amount Payable</p>
              <p className="text-lg font-bold font-mono tabular-nums text-[#D6AD32]">
                {formatNaira(totals.totalPayable)}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION C: PROPERTY PHOTOGRAPHS */}
        <div className="space-y-4 pt-4 border-t border-[#101C32]/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#101C32]">
                C. Property Photographs ({images.length})
              </h3>
              <p className="text-xs text-[#202020]/65">
                Upload multiple photographs, select a primary cover image, replace, or delete photos.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm cursor-pointer transition-colors self-start">
              {uploadingImages ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D6AD32]" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-[#D6AD32]" />
                  <span>Upload Photographs</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingImages}
                onChange={handleImageFiles}
                className="hidden"
              />
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className={`rounded-sm overflow-hidden border-2 bg-[#F8F7F3] ${
                    img.is_primary ? 'border-[#D6AD32]' : 'border-[#101C32]/15'
                  }`}
                >
                  <div className="aspect-[4/3] bg-[#101C32]">
                    <SmartImage
                      src={img.image_url}
                      alt={img.caption || `Property photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5 bg-white flex items-center justify-between gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(idx)}
                      className={`inline-flex items-center gap-1 font-semibold ${
                        img.is_primary ? 'text-[#B58F21]' : 'text-[#101C32]/70 hover:text-[#101C32]'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{img.is_primary ? 'Primary' : 'Set Cover'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <label
                        title="Replace photograph"
                        className="inline-flex items-center gap-1 text-[#101C32]/75 hover:text-[#101C32] cursor-pointer font-medium"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImages}
                          onChange={(e) => handleReplaceImage(idx, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label="Delete photograph"
                        className="text-red-600 hover:text-red-800 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION D: PROPERTY VIDEOS */}
        <div className="space-y-4 pt-4 border-t border-[#101C32]/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#101C32]">
                D. Property Videos ({videos.length})
              </h3>
              <p className="text-xs text-[#202020]/65">
                Upload multiple walkthrough videos (MP4, MOV, WebM). Preview, replace, or delete before publishing.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm cursor-pointer transition-colors self-start">
              {uploadingVideos ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Video...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Upload Videos (MP4/MOV/WebM)</span>
                </>
              )}
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                multiple
                disabled={uploadingVideos}
                onChange={handleVideoFiles}
                className="hidden"
              />
            </label>
          </div>

          {videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((vid, idx) => (
                <div
                  key={vid.id || idx}
                  className="border border-[#101C32]/15 rounded-sm overflow-hidden bg-[#F8F7F3]"
                >
                  <div className="aspect-video bg-[#101C32]">
                    <video
                      src={vid.video_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-3 bg-white space-y-2.5">
                    <input
                      type="text"
                      value={vid.caption || ''}
                      onChange={(e) =>
                        setVideos((prev) =>
                          prev.map((v, i) => (i === idx ? { ...v, caption: e.target.value } : v))
                        )
                      }
                      placeholder="Optional video title or caption"
                      className="w-full px-2.5 py-1.5 text-xs bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <label className="inline-flex items-center gap-1.5 text-[#101C32] hover:text-[#B58F21] font-semibold cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Replace Video</span>
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                          disabled={uploadingVideos}
                          onChange={(e) => handleReplaceVideo(idx, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeVideo(idx)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION E: PROPERTY FEATURES */}
        <div className="space-y-4 pt-4 border-t border-[#101C32]/10">
          <div>
            <h3 className="font-display text-lg font-bold text-[#101C32]">
              E. Property Features
            </h3>
            <p className="text-xs text-[#202020]/65">
              Select standard estate features or add custom features for this property.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {PRESET_PROPERTY_FEATURES.map((feat) => {
              const checked = selectedFeatures.includes(feat);
              return (
                <label
                  key={feat}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm border text-xs font-medium cursor-pointer transition-colors ${
                    checked
                      ? 'bg-[#101C32] text-white border-[#101C32]'
                      : 'bg-[#F8F7F3] text-[#101C32] border-[#101C32]/15 hover:border-[#D6AD32]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePresetFeature(feat)}
                    className="w-4 h-4 accent-[#D6AD32]"
                  />
                  <span>{feat}</span>
                </label>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={customFeatureInput}
              onChange={(e) => setCustomFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomFeature();
                }
              }}
              placeholder="Add custom feature (e.g. Swimming pool, C of O Title, Borehole)..."
              className="flex-1 px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
            />
            <button
              type="button"
              onClick={addCustomFeature}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#D6AD32]" />
              <span>Add Custom Feature</span>
            </button>
          </div>

          {selectedFeatures.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedFeatures.map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#F8F7F3] border border-[#101C32]/20 text-[#101C32] rounded-sm"
                >
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFeatures((prev) => prev.filter((item) => item !== feat))
                    }
                    aria-label={`Remove ${feat}`}
                    className="ml-1 text-[#202020]/50 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SECTION F: PROPERTY STATUS & PUBLISHING */}
        <div className="space-y-4 pt-4 border-t border-[#101C32]/10">
          <h3 className="font-display text-lg font-bold text-[#101C32]">
            F. Property Status &amp; Visibility
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <div>
              <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                Availability Status
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as PropertyAvailability)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="sold">Sold</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#101C32] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#101C32]"
                />
                <span>Publish on Public Website</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#101C32] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#D6AD32]"
                />
                <span>Feature on Homepage</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-[#101C32]/10 flex flex-col sm:flex-row-reverse items-stretch sm:items-center gap-3">
          <button
            type="submit"
            disabled={saving || uploadingImages || uploadingVideos}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-full transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{initialProperty ? 'Save Changes' : 'Save Property'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-7 py-3 text-sm font-semibold text-[#101C32] bg-white border border-[#101C32]/20 rounded-full hover:border-[#101C32] transition-colors"
          >
            Cancel
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}
