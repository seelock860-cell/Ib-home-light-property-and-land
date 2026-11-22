import React, { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { api } from '../lib/api';

interface EnquiryFormProps {
  defaultPropertyInterest?: string;
  propertyId?: string | null;
  propertyOptions?: string[];
  compact?: boolean;
}

export function EnquiryForm({
  defaultPropertyInterest = 'General Property Enquiry',
  propertyId = null,
  propertyOptions = [],
  compact = false,
}: EnquiryFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [propertyInterest, setPropertyInterest] = useState(defaultPropertyInterest);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (phone.trim().length < 6) {
      setError('Please provide a valid phone number.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 4) {
      setError('Please enter a brief message about your enquiry.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitEnquiry({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        property_id: propertyId,
        property_interest: propertyInterest.trim() || 'General Property Enquiry',
        message: message.trim(),
      });
      setSubmitted(true);
      setFullName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message || 'Unable to send enquiry. Please try WhatsApp or call us directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border border-[#D6AD32] rounded-sm p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto mb-3" />
        <h3 className="font-display text-2xl font-semibold text-[#101C32] mb-2">
          Enquiry Received
        </h3>
        <p className="text-sm text-[#202020]/80 max-w-md mx-auto mb-5 leading-relaxed">
          Thank you for contacting IB Home Light Property And Land. Our Port Harcourt advisory team will respond to your enquiry shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="px-5 py-2.5 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors"
        >
          Send Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-sm"
        >
          {error}
        </div>
      )}

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Chinedu Okafor"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-sm text-[#202020] placeholder:text-[#202020]/40 focus:outline-none focus:border-[#D6AD32] focus:ring-1 focus:ring-[#D6AD32]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Phone Number <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-sm text-[#202020] placeholder:text-[#202020]/40 focus:outline-none focus:border-[#D6AD32] focus:ring-1 focus:ring-[#D6AD32]"
          />
        </div>
      </div>

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-sm text-[#202020] placeholder:text-[#202020]/40 focus:outline-none focus:border-[#D6AD32] focus:ring-1 focus:ring-[#D6AD32]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
            Property of Interest
          </label>
          {propertyOptions.length > 0 && !propertyId ? (
            <select
              value={propertyInterest}
              onChange={(e) => setPropertyInterest(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-sm text-[#202020] focus:outline-none focus:border-[#D6AD32] focus:ring-1 focus:ring-[#D6AD32]"
            >
              <option value="General Property Enquiry">General Property Enquiry</option>
              <option value="Houses for Sale">Houses for Sale</option>
              <option value="Lands for Sale">Lands for Sale</option>
              <option value="Commercial Properties">Commercial Properties</option>
              <option value="Fuel Station Properties">Fuel Station Properties</option>
              <option value="Investment Properties">Investment Properties</option>
              {propertyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={propertyInterest}
              onChange={(e) => setPropertyInterest(e.target.value)}
              placeholder="House, Land, Commercial, or Fuel Station"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-sm text-[#202020] placeholder:text-[#202020]/40 focus:outline-none focus:border-[#D6AD32] focus:ring-1 focus:ring-[#D6AD32]"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
          Message <span className="text-red-600">*</span>
        </label>
        <textarea
          rows={compact ? 3 : 4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share preferred location, budget, or inspection schedule..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#101C32]/20 rounded-sm text-[#202020] placeholder:text-[#202020]/40 focus:outline-none focus:border-[#D6AD32] focus:ring-1 focus:ring-[#D6AD32]"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors duration-200 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting Enquiry...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Submit Enquiry</span>
          </>
        )}
      </button>
    </form>
  );
}
