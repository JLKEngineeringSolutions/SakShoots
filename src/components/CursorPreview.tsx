import { useEffect, useState } from 'react';
import { ImageSlot } from './ImageSlot';
import type { PortfolioCategory } from '@/lib/content';

type CursorPreviewProps = {
  category: PortfolioCategory | null;
};

export function CursorPreview({ category }: CursorPreviewProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [last, setLast] = useState<PortfolioCategory | null>(category);

  useEffect(() => {
    if (category) setLast(category);
  }, [category]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX + 28, y: e.clientY - 175 });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const shown = category ?? last;
  if (!shown) return null;

  return (
    <div
      className="hidden md:block fixed top-0 left-0 z-[60] pointer-events-none transition-opacity duration-300"
      style={{
        width: '280px',
        height: '350px',
        opacity: category ? 1 : 0,
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(-2deg)`,
        background: '#1a1917',
        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
      }}
    >
      <ImageSlot src={shown.cover_url} alt={shown.name} placeholder={shown.name} />
      <div className="absolute left-2.5 bottom-2.5 font-mono text-[10.5px] tracking-[0.1em] text-[#ece8e0]" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
        {shown.n} · {shown.lens}
      </div>
    </div>
  );
}
