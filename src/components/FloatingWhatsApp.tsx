import React from 'react';
import { useSite } from '../context/SiteContext';
import { buildWhatsAppUrl } from '../lib/constants';

export function FloatingWhatsApp() {
  const { settings } = useSite();
  const href = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.company_name}, I would like to make an enquiry about your available properties in Port Harcourt.`
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp with IB Home Light Property And Land"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-3 sm:px-5 sm:py-3.5 animate-whatsapp-pump transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#16A34A]/40"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
        aria-hidden="true"
      >
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.531.078-1.203.109-1.938-.125-.453-.141-1.031-.328-1.766-.656-3.094-1.328-5.109-4.469-5.266-4.672-.156-.203-1.25-1.672-1.25-3.188s.797-2.266 1.078-2.578c.281-.313.609-.391.813-.391s.406 0 .594.016c.188.016.453-.078.703.531.25.609.859 2.109.938 2.266.078.156.125.344.031.547-.094.203-.156.344-.313.531-.156.188-.328.406-.469.547-.156.156-.328.328-.141.656.188.328.844 1.391 1.813 2.25 1.25 1.109 2.297 1.453 2.625 1.609.328.156.516.125.703-.094.188-.219.813-.953 1.031-1.281.219-.328.438-.266.734-.156.297.109 1.891.891 2.219 1.047.328.156.547.234.625.375.078.141.078.813-.172 1.516z" />
      </svg>
      <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
        Chat on WhatsApp
      </span>
    </a>
  );
}
