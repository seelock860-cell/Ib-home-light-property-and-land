import React, { useMemo, useState } from 'react';
import { MessageCircle, Search, Trash2, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { buildWhatsAppUrl } from '../../lib/constants';
import { Customer, Enquiry, EnquiryStatus } from '../../types';

export function AdminEnquiriesSection({
  enquiries,
  onDataChanged,
}: {
  enquiries: Enquiry[];
  onDataChanged: () => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (q) {
        const hay = `${e.full_name} ${e.phone} ${e.email} ${e.property_interest} ${e.message}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enquiries, statusFilter, search]);

  async function handleStatusChange(id: string, status: EnquiryStatus) {
    setBusyId(id);
    try {
      await api.updateEnquiryStatus(id, status);
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await api.deleteEnquiry(id);
      setConfirmDeleteId(null);
      await onDataChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101C32]">
          Manage Enquiries
        </h2>
        <p className="text-xs sm:text-sm text-[#202020]/70">
          Track customer property enquiries, update follow-up status, and respond via WhatsApp.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#101C32]/12 rounded-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#101C32]/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search enquiries by name, phone, email, or property..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#F8F7F3] p-1 rounded-sm border border-[#101C32]/10">
          {(['all', 'new', 'contacted', 'completed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-sm transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#101C32] text-white'
                  : 'text-[#101C32]/75 hover:text-[#101C32]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#101C32]/12 rounded-sm p-12 text-center">
            <p className="font-display text-lg font-semibold text-[#101C32] mb-1">
              {enquiries.length === 0 ? 'No Enquiries Received Yet' : 'No Matching Enquiries'}
            </p>
            <p className="text-xs text-[#202020]/70">
              Enquiries submitted through the public Contact or Property Details forms appear here automatically.
            </p>
          </div>
        ) : (
          filtered.map((enq) => {
            const waUrl = buildWhatsAppUrl(
              enq.phone,
              `Hello ${enq.full_name}, thank you for contacting IB Home Light Property And Land regarding "${enq.property_interest}". How may we assist you further?`
            );
            const isBusy = busyId === enq.id;

            return (
              <div
                key={enq.id}
                className="bg-white border border-[#101C32]/12 rounded-sm p-5 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#202020]/65 mb-1">
                      <span className="font-semibold text-[#101C32] text-sm">
                        {enq.full_name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{enq.phone}</span>
                      {enq.email && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{enq.email}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#B58F21]">
                      Interest: {enq.property_interest}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-[#202020]/60">
                      {new Date(enq.created_at).toLocaleString()}
                    </span>

                    <select
                      disabled={isBusy}
                      value={enq.status}
                      onChange={(e) =>
                        handleStatusChange(enq.id, e.target.value as EnquiryStatus)
                      }
                      aria-label={`Status for enquiry from ${enq.full_name}`}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                    </select>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {confirmDeleteId === enq.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete(enq.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-sm"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 text-xs bg-[#F8F7F3] text-[#101C32] rounded-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(enq.id)}
                        aria-label={`Delete enquiry from ${enq.full_name}`}
                        className="p-1.5 text-red-700 hover:bg-red-50 rounded-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[#202020]/85 bg-[#F8F7F3] p-3.5 rounded-sm border border-[#101C32]/10 leading-relaxed">
                  {enq.message}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function AdminCustomersSection({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = `${c.full_name} ${c.phone} ${c.email}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, search]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101C32]">
          Manage Customers
        </h2>
        <p className="text-xs sm:text-sm text-[#202020]/70">
          Directory of clients who have submitted enquiries, including full contact and enquiry history.
        </p>
      </div>

      <div className="bg-white border border-[#101C32]/12 rounded-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#101C32]/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone number, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8F7F3] border border-[#101C32]/15 rounded-sm focus:outline-none focus:border-[#D6AD32]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#101C32]/12 rounded-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-[#D6AD32] mx-auto mb-3" />
            <p className="font-display text-lg font-semibold text-[#101C32] mb-1">
              {customers.length === 0 ? 'No Customer Records Yet' : 'No Matching Customers'}
            </p>
            <p className="text-xs text-[#202020]/70">
              Customer profiles are created automatically whenever a visitor submits an enquiry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F7F3] border-b border-[#101C32]/10 text-[11px] font-semibold text-[#101C32]/75">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Enquiries</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101C32]/10 text-xs">
                {filtered.map((cust) => {
                  const waUrl = buildWhatsAppUrl(
                    cust.phone,
                    `Hello ${cust.full_name}, this is IB Home Light Property And Land following up on your property enquiry.`
                  );
                  return (
                    <tr key={cust.id} className="hover:bg-[#F8F7F3]/60">
                      <td className="py-3 px-4 font-semibold text-[#101C32]">
                        {cust.full_name}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#202020]/80">
                        {cust.phone}
                      </td>
                      <td className="py-3 px-4 text-[#202020]/75">
                        {cust.email || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#101C32]">
                        {cust.enquiry_count ?? cust.enquiries?.length ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#101C32] border border-[#101C32]/20 hover:border-[#D6AD32] rounded-sm"
                          >
                            History
                          </button>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Enquiry History Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-[#101C32]/75 flex items-center justify-center p-4"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="bg-white rounded-sm max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#101C32]/10 pb-3">
              <div>
                <h3 className="font-display text-xl font-bold text-[#101C32]">
                  {selectedCustomer.full_name}
                </h3>
                <p className="text-xs text-[#202020]/70 font-mono tabular-nums">
                  {selectedCustomer.phone} {selectedCustomer.email ? `· ${selectedCustomer.email}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close customer details"
                className="p-1 text-[#101C32]/60 hover:text-[#101C32]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#101C32]">Enquiry History</p>
              {(selectedCustomer.enquiries || []).length === 0 ? (
                <p className="text-xs text-[#202020]/65">No enquiry messages linked yet.</p>
              ) : (
                selectedCustomer.enquiries?.map((enq) => (
                  <div
                    key={enq.id}
                    className="p-3.5 bg-[#F8F7F3] border border-[#101C32]/10 rounded-sm space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#B58F21]">
                        {enq.property_interest}
                      </span>
                      <span className="font-mono tabular-nums text-[#202020]/60">
                        {new Date(enq.created_at).toLocaleDateString()} · {enq.status}
                      </span>
                    </div>
                    <p className="text-[#202020]/85 leading-relaxed">{enq.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
