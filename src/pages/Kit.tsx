import { useCallback, useState } from 'react';
import { ImageSlot } from '@/components/ImageSlot';
import { Lightbox } from '@/components/Lightbox';
import { RichText } from '@/components/RichText';
import { useReveal } from '@/hooks/useReveal';
import { useSiteData } from '@/context/SiteData';
import type { KitItem } from '@/lib/content';

type KitProps = {
  go: (page: string, extra?: Record<string, string>) => void;
};

export function Kit({ go }: KitProps) {
  const ref = useReveal<HTMLDivElement>();
  const { content, equipment } = useSiteData();

  const [box, setBox] = useState<{ item: KitItem; index: number } | null>(null);
  const total = box?.item.photos.length ?? 0;
  const step = useCallback((d: number) => {
    setBox((prev) => (prev && total ? { ...prev, index: (prev.index + d + total) % total } : prev));
  }, [total]);

  const cameras = equipment.filter((e) => e.kind === 'camera');
  const lenses = equipment.filter((e) => e.kind === 'lens');
  const support = equipment.filter((e) => e.kind === 'support');

  return (
    <div ref={ref}>
      {/* Hero */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,6vw,80px)] grid gap-10 items-end" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))' }}>
        <div className="flex flex-col gap-6">
          <span className="reveal font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">The kit</span>
          <h1 className="reveal font-serif text-[clamp(56px,8.4vw,124px)] leading-[0.92] tracking-[-0.025em] m-0">
            <RichText text={content.kit_headline} />
          </h1>
        </div>
        <p className="reveal text-[18px] leading-[1.7] text-[#b3ac9f] m-0 max-w-[500px] pb-2.5" style={{ textWrap: 'pretty' }}>
          {content.kit_intro}
        </p>
      </section>

      {/* The body */}
      {cameras.length > 0 && (
        <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(56px,8vw,110px)]">
          <h2 className="reveal font-serif text-[clamp(32px,4vw,52px)] leading-none m-0 mb-8">
            <RichText text={content.kit_camera_heading} />
          </h2>
          <div className="flex flex-col gap-10">
            {cameras.map((cam) => (
              <div key={cam.id} className="reveal grid gap-10 items-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}>
                <div className="relative" style={{ height: 'clamp(300px, 42vw, 520px)', background: '#1a1917' }}>
                  <ImageSlot src={cam.image_url} alt={cam.name} placeholder="The camera" fit="contain" />
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    {cam.subtitle && <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#e0913f]">{cam.subtitle}</span>}
                    <span className="font-serif text-[clamp(36px,5vw,64px)] leading-none">{cam.name}</span>
                  </div>
                  {cam.usage && <p className="text-[16px] leading-[1.7] text-[#b3ac9f] m-0 max-w-[460px]">{cam.usage}</p>}
                  {cam.specs.length > 0 && (
                    <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-[#ece8e0] border-b border-[#2a2825] py-5">
                      {cam.specs.map((spec, i) => (
                        <span key={`${spec}-${i}`} className="font-mono text-[11px] tracking-[0.12em] text-[#cfc8bb]">{spec}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The glass */}
      {lenses.length > 0 && (
        <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(72px,10vw,140px)]">
          <h2 className="reveal font-serif text-[clamp(32px,4vw,52px)] leading-none m-0 mb-12">
            <RichText text={content.kit_lenses_heading} />
          </h2>
          <div className="flex flex-col gap-[clamp(48px,7vw,96px)]">
            {lenses.map((lens, idx) => (
              <div key={lens.id} className="reveal grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
                <div className="flex flex-col gap-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[12px] text-[#e0913f]">{String(idx + 1).padStart(2, '0')}</span>
                    {lens.subtitle && <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#8a8377]">{lens.subtitle}</span>}
                  </div>
                  <span className="font-serif text-[clamp(32px,4.4vw,56px)] leading-[0.98]">{lens.name}</span>
                  {lens.usage && <p className="text-[16px] leading-[1.7] text-[#b3ac9f] m-0 max-w-[420px]">{lens.usage}</p>}
                  {lens.image_url && (
                    <div className="relative mt-2 w-full max-w-[320px]" style={{ height: '220px', background: '#1a1917' }}>
                      <ImageSlot src={lens.image_url} alt={lens.name} placeholder="Lens" fit="contain" />
                    </div>
                  )}
                </div>

                {lens.photos.length > 0 ? (
                  <div className="flex flex-col gap-3.5 min-w-0">
                    <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#8a8377]">Shot on this lens</span>
                    <div className="overflow-x-auto no-scrollbar">
                      <div className="inline-flex flex-col gap-3">
                        <div className="h-2.5 film-strip" />
                        <div className="flex gap-3">
                          {lens.photos.map((src, i) => (
                            <button
                              key={`${lens.id}-${i}`}
                              onClick={() => setBox({ item: lens, index: i })}
                              className="flex-none link-hover"
                              style={{ width: '240px', height: '300px', background: '#1f1d1a' }}
                              aria-label={`View photo ${i + 1} shot on ${lens.name}`}
                            >
                              <ImageSlot src={src} alt={`Shot on ${lens.name}`} placeholder={`FR ${i + 1}`} />
                            </button>
                          ))}
                        </div>
                        <div className="h-2.5 film-strip" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center border border-dashed border-[#2a2825] rounded-lg min-h-[160px]">
                    <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#5d574e]">Frames coming soon</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Light & support */}
      {support.length > 0 && (
        <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(72px,10vw,140px)]">
          <h2 className="reveal font-serif text-[clamp(32px,4vw,52px)] leading-none m-0 mb-10">
            <RichText text={content.kit_support_heading} />
          </h2>
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))' }}>
            {support.map((item) => (
              <div key={item.id} className="reveal flex flex-col gap-3">
                <div className="relative" style={{ height: '220px', background: '#1a1917' }}>
                  <ImageSlot src={item.image_url} alt={item.name} placeholder={item.name} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-[22px] leading-tight">{item.name}</span>
                  {item.usage && <span className="text-[13px] leading-[1.5] text-[#8a8377]">{item.usage}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="mt-[clamp(72px,10vw,140px)] mx-[clamp(20px,4vw,56px)] mb-4 rounded-2xl border border-[#22201d] bg-[#161513] px-[clamp(28px,5vw,72px)] py-[clamp(44px,6vw,80px)] flex flex-col gap-6 items-start">
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#e0913f]">{content.kit_cta_eyebrow}</span>
        <h2 className="font-serif text-[clamp(36px,5.4vw,76px)] leading-[0.98] m-0 max-w-[760px]">
          <RichText text={content.kit_cta_headline} />
        </h2>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => go('contact')} className="bg-[#ece8e0] text-[#0e0d0c] px-[26px] py-[15px] rounded-full text-sm font-medium link-hover">
            Start a commission
          </button>
          <button onClick={() => go('work')} className="px-[26px] py-[15px] rounded-full text-sm border border-[#3a3732] link-hover">
            See the work
          </button>
        </div>
      </section>

      <Lightbox
        open={box != null}
        index={box?.index ?? 0}
        total={total}
        images={box?.item.photos ?? []}
        title={box?.item.name ?? ''}
        lens={box?.item.subtitle ?? ''}
        onClose={() => setBox(null)}
        onStep={step}
      />
    </div>
  );
}
