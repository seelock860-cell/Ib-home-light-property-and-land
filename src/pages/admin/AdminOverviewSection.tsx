import React, { useState } from 'react';
import {
  Ban,
  Building2,
  CheckCircle2,
  Home,
  KeyRound,
  Mail,
  MessageSquarePlus,
  Plus,
  Users,
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { formatNaira } from '../../lib/constants';

interface AdminOverviewSectionProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: string) => void;
}

export function AdminOverviewSection({
  stats,
  loading,
  onNavigate,
}: AdminOverviewSectionProps) {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white border border-[#101C32]/12 rounded-sm p-5 h-28 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Properties', value: stats.totalProperties, icon: Building2, accent: 'text-[#101C32]' },
    { label: 'Available Properties', value: stats.availableProperties, icon: Home, accent: 'text-[#16A34A]' },
    { label: 'Rented Properties', value: stats.rentedProperties, icon: KeyRound, accent: 'text-[#B58F21]' },
    { label: 'Sold Properties', value: stats.soldProperties, icon: CheckCircle2, accent: 'text-red-700' },
    { label: 'Unavailable Properties', value: stats.unavailableProperties ?? 0, icon: Ban, accent: 'text-[#202020]/70' },
    { label: 'Total Enquiries', value: stats.totalEnquiries, icon: Mail, accent: 'text-[#101C32]' },
    { label: 'New Enquiries', value: stats.newEnquiries, icon: MessageSquarePlus, accent: 'text-[#D6AD32]' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, accent: 'text-[#101C32]' },
  ];

  const maxCategoryCount = Math.max(
    1,
    ...stats.categoryBreakdown.map((c) => c.count)
  );

  const totalEnqForChart = Math.max(1, stats.totalEnquiries);
  const newPct = Math.round((stats.newEnquiries / totalEnqForChart) * 100);
  const contactedPct = Math.round((stats.contactedEnquiries / totalEnqForChart) * 100);
  const completedPct = Math.round((stats.completedEnquiries / totalEnqForChart) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#101C32]">
            Dashboard Overview
          </h2>
          <p className="text-xs sm:text-sm text-[#202020]/70">
            Live database metrics across properties, customer enquiries, and media assets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('add-property')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors whitespace-nowrap self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Property</span>
        </button>
      </div>

      {/* 8 Real Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-[#101C32]/12 rounded-sm p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-[#202020]/70">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-[#D6AD32] shrink-0" />
              </div>
              <p className={`text-3xl font-bold tabular-nums font-mono ${card.accent}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#101C32]/12 rounded-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-lg font-bold text-[#101C32]">
                Properties by Category
              </h3>
              <p className="text-xs text-[#202020]/65">
                Distribution across official portfolio categories
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-[#101C32] font-semibold">
              {stats.totalProperties} Total
            </span>
          </div>

          <div className="space-y-3.5">
            {stats.categoryBreakdown.map((cat) => {
              const widthPct = Math.round((cat.count / maxCategoryCount) * 100);
              const isHovered = hoveredCat === cat.name;
              return (
                <div
                  key={cat.name}
                  onMouseEnter={() => setHoveredCat(cat.name)}
                  onMouseLeave={() => setHoveredCat(null)}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#101C32]">{cat.name}</span>
                    <span className="font-mono tabular-nums font-semibold text-[#101C32]">
                      {cat.count}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F8F7F3] rounded-sm overflow-hidden border border-[#101C32]/10">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isHovered ? 'bg-[#D6AD32]' : 'bg-[#101C32]'
                      }`}
                      style={{ width: `${cat.count === 0 ? 0 : Math.max(6, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#101C32]/12 rounded-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-[#101C32]">
              Enquiry Pipeline Status
            </h3>
            <p className="text-xs text-[#202020]/65 mb-6">
              Real-time conversion status of customer enquiries
            </p>

            <div className="h-4 w-full bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm overflow-hidden flex mb-6">
              {stats.totalEnquiries > 0 && (
                <>
                  <div
                    className="bg-[#D6AD32] h-full transition-all duration-300"
                    style={{ width: `${newPct}%` }}
                    title={`New: ${stats.newEnquiries}`}
                  />
                  <div
                    className="bg-[#101C32] h-full transition-all duration-300"
                    style={{ width: `${contactedPct}%` }}
                    title={`Contacted: ${stats.contactedEnquiries}`}
                  />
                  <div
                    className="bg-[#16A34A] h-full transition-all duration-300"
                    style={{ width: `${completedPct}%` }}
                    title={`Completed: ${stats.completedEnquiries}`}
                  />
                </>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#101C32]/10">
                <span className="font-medium text-[#101C32]">New Enquiries</span>
                <span className="font-mono tabular-nums font-semibold text-[#B58F21]">
                  {stats.newEnquiries} ({stats.totalEnquiries ? newPct : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#101C32]/10">
                <span className="font-medium text-[#101C32]">Contacted</span>
                <span className="font-mono tabular-nums font-semibold text-[#101C32]">
                  {stats.contactedEnquiries} ({stats.totalEnquiries ? contactedPct : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-[#101C32]">Completed</span>
                <span className="font-mono tabular-nums font-semibold text-[#16A34A]">
                  {stats.completedEnquiries} ({stats.totalEnquiries ? completedPct : 0}%)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('enquiries')}
            className="mt-6 w-full py-2.5 text-xs font-semibold text-white bg-[#101C32] hover:bg-[#192A48] rounded-sm transition-colors"
          >
            Open Enquiry Management
          </button>
        </div>
      </div>

      {/* Recent Activity Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#101C32]/12 rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-[#101C32]">
              Recent Properties
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('properties')}
              className="text-xs font-semibold text-[#B58F21] hover:underline"
            >
              Manage All
            </button>
          </div>
          {stats.recentProperties.length === 0 ? (
            <p className="text-xs text-[#202020]/65 py-6 text-center">
              No properties added yet. Click &ldquo;Add New Property&rdquo; to publish your first listing.
            </p>
          ) : (
            <div className="divide-y divide-[#101C32]/10">
              {stats.recentProperties.map((prop) => (
                <div key={prop.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#101C32] truncate">{prop.title}</p>
                    <p className="text-[#202020]/65 truncate">
                      {prop.listing_type} · {prop.category_name} · {prop.location}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono tabular-nums font-semibold text-[#101C32]">
                      {formatNaira(prop.price, prop.price_display)}
                    </p>
                    <p className="capitalize text-[11px] text-[#202020]/60">
                      {prop.availability}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#101C32]/12 rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-[#101C32]">
              Recent Enquiries
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('enquiries')}
              className="text-xs font-semibold text-[#B58F21] hover:underline"
            >
              View All
            </button>
          </div>
          {stats.recentEnquiries.length === 0 ? (
            <p className="text-xs text-[#202020]/65 py-6 text-center">
              No customer enquiries received yet.
            </p>
          ) : (
            <div className="divide-y divide-[#101C32]/10">
              {stats.recentEnquiries.map((enq) => (
                <div key={enq.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#101C32] truncate">{enq.full_name}</p>
                    <p className="text-[#202020]/65 truncate">
                      {enq.property_interest} · {enq.phone}
                    </p>
                  </div>
                  <span className="capitalize font-semibold text-[#B58F21] shrink-0">
                    {enq.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
