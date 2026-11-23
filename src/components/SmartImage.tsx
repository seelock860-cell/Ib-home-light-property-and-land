import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  priority?: boolean;
}

export function SmartImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  priority = false,
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#101C32] via-[#192A48] to-[#0B1424] text-white/85 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Building2 className="w-8 h-8 text-[#D6AD32] mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide text-white/75 line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
