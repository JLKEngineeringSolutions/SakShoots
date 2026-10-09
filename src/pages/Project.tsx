import { useState, useCallback } from 'react';
import { ImageSlot } from '@/components/ImageSlot';
import { Lightbox } from '@/components/Lightbox';
import { useReveal } from '@/hooks/useReveal';
import { useSiteData } from '@/context/SiteData';
import { COLS, HS, LENSES } from '@/data/layout';

type ProjectProps = {
  catSlug: string;
  projSlug: string;
  go: (page: string, extra?: Record<string, string>) => void;
};

export function Project({ catSlug, projSlug, go }: ProjectProps) {
  const ref = useReveal<HTMLDivElement>();
  const { categories } = useSiteData();
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  const catIdx = Math.max(0, categories.findIndex((c) => c.slug === catSlug));
  const cat = categories[catIdx];
  const projects = cat?.projects ?? [];
  const pIdx = Math.max(0, projects.findIndex((p) => p.slug === projSlug));
  const proj = projects[pIdx];
  const total = proj?.images.length ?? 0;

  const step = useCallback((d: number) => {
    setLbIndex((prev) => (prev == null || total === 0 ? prev : (prev + d + total) % total));
  }, [total]);

  if (!cat || !proj) {
    return (
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,6vw,80px)] flex flex-col gap-6 items-start">
        <h1 className="font-serif text-[clamp(48px,6vw,88px)] leading-none m-0">This project isn't available.</h1>
        <button onClick={() => go('work')} className="text-sm border-b border-current pb-[3px] link-hover">
          Back to the portfolio →
        </button>
      </section>
    );
  }

  const nxt = projects.length > 1 ? projects[(pIdx + 1) % projects.length] : null;
  const nextCat = categories[(catIdx + 1) % categories.length];

  const frames = proj.images.map((img, i) => ({
    col: COLS[i % COLS.length],
    h: HS[i % HS.length],
    n: String(i + 1).padStart(2, '0'),
    lens: LENSES[i % LENSES.length],
    src: img,
  }));

  return (
    <div ref={ref}>
      {/* Header */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,6vw,80px)]">
        <button
          onClick={() => go('work', { cat: cat.slug })}
          className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377] link-hover"
        >
          ← {cat.name}
        </button>
        <h1 className="reveal font-serif text-[clamp(64px,10vw,150px)] leading-[0.9] tracking-[-0.03em] m-0 mt-6">
          {proj.title}
        </h1>
        <div className="reveal grid gap-6 mt-12 py-[22px] border-t border-[#ece8e0] border-b border-[#2a2825]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {[
            { label: 'LOCATION', value: proj.place },
            { label: 'BRIEF', value: proj.brief },
            { label: 'GLASS', value: proj.lens },
            { label: 'YEAR', value: proj.year },
          ].filter((item) => item.value).map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">{item.label}</span>
              <span className="text-[15px]">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Frames grid */}
      <section className="px-[clamp(20px,4vw,56px)] pt-10 grid gap-4 grid-cols-1 md:grid-cols-12">
        {frames.map((fr, i) => (
          <div key={fr.n} className="reveal flex flex-col gap-2 md:[grid-column:var(--col)]" style={{ '--col': fr.col } as React.CSSProperties}>
            <div className="relative" style={{ height: fr.h, background: '#1a1917' }}>
              <ImageSlot src={fr.src} alt={`${proj.title} — frame ${fr.n}`} placeholder={`Frame ${fr.n}`} />
              <button
                onClick={() => setLbIndex(i)}
                title="View full screen"
                aria-label={`View frame ${fr.n} full screen`}
                className="absolute top-3 right-3 w-[38px] h-[38px] rounded-full flex items-center justify-center text-base link-hover"
                style={{ background: 'rgba(14,13,12,0.75)', color: '#ece8e0' }}
              >
                ⤢
              </button>
            </div>
            <div className="flex justify-between font-mono text-[10.5px] tracking-[0.1em] text-[#8a8377]">
              <span className="text-[#e0913f]">FR {fr.n}</span>
              <span>{fr.lens}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Shot on → Kit */}
      <section className="px-[clamp(20px,4vw,56px)] pt-7">
        <button onClick={() => go('kit')} className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377] link-hover">
          Shot on {proj.lens || 'prime glass'} <span className="text-[#e0913f]">— see the kit →</span>
        </button>
      </section>

      {/* Next project */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(72px,9vw,120px)]">
        <button
          onClick={() => {
            if (nxt) go('project', { cat: cat.slug, proj: nxt.slug });
            else go('work', { cat: nextCat.slug });
          }}
          className="flex justify-between items-end gap-6 border-t border-[#ece8e0] pt-6 flex-wrap w-full text-left link-hover"
        >
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] tracking-[0.12em] text-[#8a8377]">NEXT PROJECT</span>
            <span className="font-serif text-[clamp(48px,7vw,96px)] leading-[0.95]">
              {nxt ? nxt.title : nextCat.name}
            </span>
          </div>
          <span className="text-[40px] text-[#e0913f]">→</span>
        </button>
      </section>

      <Lightbox
        open={lbIndex != null}
        index={lbIndex ?? 0}
        total={total}
        images={proj.images}
        title={proj.title}
        lens={proj.lens}
        onClose={() => setLbIndex(null)}
        onStep={step}
      />
    </div>
  );
}
