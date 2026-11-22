import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Building2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/properties', label: 'Properties' },
  { to: '/services', label: 'Services' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { settings } = useSite();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#101C32]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3 lg:gap-5 xl:gap-8">
        {/* Zone 1: Brand wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#101C32] min-w-0 shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AD32] rounded-sm"
        >
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.company_name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 object-contain shrink-0"
            />
          ) : (
            <span className="w-8 h-8 rounded-sm bg-[#101C32] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-[#D6AD32]" strokeWidth={1.8} />
            </span>
          )}
          <span className="font-display text-sm sm:text-base xl:text-lg font-bold tracking-tight text-[#101C32] leading-tight">
            {settings.company_name || 'Ib home light property and land'}
          </span>
        </Link>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-4 xl:gap-6 shrink-0"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AD32] rounded-sm ${
                  isActive
                    ? 'text-[#101C32] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-[#D6AD32]'
                    : 'text-[#101C32]/75 hover:text-[#101C32] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-[#D6AD32] after:transition-all after:duration-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/contact"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#101C32]"
          >
            Enquire Now
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-sm text-[#101C32] hover:bg-[#F8F7F3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AD32]"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#101C32]/10 px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-3 text-base font-medium rounded-sm transition-colors ${
                  isActive
                    ? 'bg-[#101C32] text-white'
                    : 'text-[#101C32] hover:bg-[#F8F7F3]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2">
            <Link
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-3 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors"
            >
              Enquire Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
