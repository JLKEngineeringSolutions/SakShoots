import { useEffect, useState } from 'react';

type ImageSlotProps = {
  src?: string;
  alt?: string;
  placeholder: string;
  shape?: 'rect' | 'rounded' | 'circle';
  fit?: 'cover' | 'contain';
  className?: string;
  style?: React.CSSProperties;
};

export function ImageSlot({
  src,
  alt = '',
  placeholder,
  shape = 'rect',
  fit = 'cover',
  className = '',
  style,
}: ImageSlotProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const radius = shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '0px';

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ borderRadius: radius, background: '#1a1917', ...style }}
    >
      {src && !error ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-[#3a3732] border-t-[#e0913f] animate-spin" />
            </div>
          )}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className="w-full h-full transition-opacity duration-500"
            style={{
              opacity: loaded ? 1 : 0,
              objectFit: fit,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center p-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 text-[#8a8377]">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span className="text-[13px] font-medium opacity-75 text-[#8a8377]">{placeholder}</span>
        </div>
      )}
    </div>
  );
}
