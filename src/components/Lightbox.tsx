import { useEffect, useCallback } from 'react';
import { ImageSlot } from './ImageSlot';

type LightboxProps = {
  open: boolean;
  index: number;
  total: number;
  images: string[];
  title: string;
  lens: string;
  onClose: () => void;
  onStep: (dir: number) => void;
};

export function Lightbox({ open, index, total, images, title, lens, onClose, onStep }: LightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onStep(1);
    if (e.key === 'ArrowLeft') onStep(-1);
  }, [onClose, onStep]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: 'rgba(8,8,7,0.96)' }}>
      <div className="flex justify-between items-center px-[clamp(20px,4vw,40px)] py-[18px] font-mono text-xs tracking-[0.1em] text-[#b3ac9f]">
        <span>
          <span className="text-[#e0913f]">FR {String(index + 1).padStart(2, '0')}</span> / {String(total).padStart(2, '0')} · {title} · {lens}
        </span>
        <button onClick={onClose} className="text-[#ece8e0] text-[13px] link-hover">CLOSE ✕</button>
      </div>
      <div className="flex-1 min-h-0 grid items-center px-[clamp(8px,2vw,24px)] pb-6" style={{ gridTemplateColumns: '64px minmax(0,1fr) 64px' }}>
        <button onClick={() => onStep(-1)} className="text-[28px] text-center text-[#ece8e0] link-hover">←</button>
        <div className="h-full max-h-[82vh] relative">
          <ImageSlot src={images[index]} alt={`Frame ${index + 1}`} placeholder={`Frame ${index + 1}`} fit="contain" />
        </div>
        <button onClick={() => onStep(1)} className="text-[28px] text-center text-[#ece8e0] link-hover">→</button>
      </div>
    </div>
  );
}
