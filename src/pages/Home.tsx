import { useState } from 'react';
import { ImageSlot } from '@/components/ImageSlot';
import { Viewfinder } from '@/components/Viewfinder';
import { CursorPreview } from '@/components/CursorPreview';
import { RichText } from '@/components/RichText';
import { useReveal } from '@/hooks/useReveal';
import { useSiteData } from '@/context/SiteData';

type HomeProps = {
  go: (page: string, extra?: Record<string, string>) => void;
};

export function Home({ go }: HomeProps) {
  const ref = useReveal<HTMLDivElement>();
  const { content, categories, featured, tiers, equipment } = useSiteData();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div ref={ref}>
      <CursorPreview category={hoverIndex != null ? categories[hoverIndex] ?? null : null} />

      {/* Hero */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,7vw,96px)] pb-10 grid gap-10 items-end" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))' }}>
        <h1 className="reveal font-serif text-[clamp(56px,8.6vw,128px)] leading-[0.92] tracking-[-0.025em] m-0" style={{ textWrap: 'balance' }}>
          <RichText text={content.home_hero_headline} />
        </h1>
        <div className="reveal flex flex-col gap-7 max-w-[440px] pb-2.5">
          <p className="text-[18px] leading-[1.6] text-[#b3ac9f] m-0" style={{ textWrap: 'pretty' }}>
            {content.home_hero_intro}
          </p>
          <div className="flex gap-3 flex-wrap items-center">
            <button onClick={() => go('work')} className="bg-[#ece8e0] text-[#0e0d0c] px-[26px] py-[15px] rounded-full text-sm font-medium link-hover">
              View the work
            </button>
            <button onClick={() => go('contact')} className="text-sm px-[15px] py-[15px] link-hover">
              Start a commission →
            </button>
          </div>
        </div>
      </section>

      {/* Hero image with viewfinder */}
      <section className="px-[clamp(20px,4vw,56px)]">
        <div className="reveal relative" style={{ height: 'clamp(360px, 58vw, 760px)', background: '#1a1917' }}>
          <ImageSlot src={content.home_hero_image} alt="Signature work" placeholder="Hero image" />
          <Viewfinder show />
        </div>
      </section>

      {/* Recent clients */}
      {content.home_clients.length > 0 && (
        <section className="reveal mx-[clamp(20px,4vw,56px)] mt-14 py-[26px] border-t border-[#2a2825] border-b border-[#2a2825] flex flex-wrap items-center gap-x-14 gap-y-6">
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">Recent clients</span>
          <div className="flex flex-wrap justify-between gap-x-10 gap-y-4 flex-1 font-serif text-[30px] text-[#cfc8bb]">
            {content.home_clients.map((c, i) => (
              <span key={`${c}-${i}`} className={i % 2 ? 'italic' : ''}>{c}</span>
            ))}
          </div>
        </section>
      )}

      {/* What I shoot */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(72px,10vw,140px)] grid gap-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
        <div className="reveal flex flex-col gap-[18px]">
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">What I shoot</span>
          <h2 className="font-serif text-[clamp(40px,5vw,64px)] leading-none m-0">
            <RichText text={content.home_shoot_heading} />
          </h2>
        </div>
        {tiers.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go('services')}
            className="reveal flex flex-col gap-3.5 border-t border-[#ece8e0] pt-5 text-left link-hover"
          >
            <span className="font-mono text-[11px] text-[#e0913f]">{String(i + 1).padStart(2, '0')} — {s.lens}</span>
            <span className="font-serif text-[34px]">{s.title}</span>
            <span className="text-[15px] leading-[1.6] text-[#b3ac9f]">{s.summary}</span>
          </button>
        ))}
      </section>

      {/* Selected frames — horizontal scroll */}
      {featured.length > 0 && (
        <section className="mt-[clamp(72px,10vw,140px)] bg-[#161513] pt-14 pb-16 border-t border-[#22201d] border-b border-[#22201d]">
          <div className="flex justify-between items-end gap-5 px-[clamp(20px,4vw,56px)] pb-8 flex-wrap">
            <h2 className="font-serif text-[clamp(40px,5vw,64px)] leading-none m-0">
              <RichText text={content.home_frames_heading} />
            </h2>
            <span className="font-mono text-[11px] tracking-[0.12em] text-[#8a8377]">ROLL 26 · SCROLL →</span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div className="inline-flex flex-col gap-3.5 px-[clamp(20px,4vw,56px)]">
              <div className="h-3 film-strip" />
              <div className="flex gap-3.5">
                {featured.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => go('project', { cat: f.catSlug, proj: f.slug })}
                    className="flex-none w-[340px] flex flex-col gap-3 text-left link-hover"
                  >
                    <div style={{ height: '440px', background: '#1f1d1a' }}>
                      <ImageSlot src={f.images[0]} alt={f.title} placeholder={f.title} />
                    </div>
                    <div className="flex justify-between font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">
                      <span className="text-[#e0913f]">FR {String(i + 1).padStart(3, '0')}</span>
                      <span className="uppercase">{f.lens}</span>
                    </div>
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="font-serif text-[28px]">{f.title}</span>
                      <span className="text-[13px] text-[#8a8377]">{f.featured_tag}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="h-3 film-strip" />
            </div>
          </div>
        </section>
      )}

      {/* Kit teaser */}
      {equipment.length > 0 && (
        <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(72px,10vw,140px)]">
          <div className="reveal rounded-2xl border border-[#22201d] bg-[#161513] overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-5 px-[clamp(24px,4vw,48px)] pt-[clamp(28px,4vw,44px)] pb-6">
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#e0913f]">The kit</span>
                <h2 className="font-serif text-[clamp(34px,4.6vw,60px)] leading-none m-0">
                  <RichText text={content.home_kit_heading} />
                </h2>
                {content.home_kit_blurb && (
                  <p className="text-[15px] leading-[1.6] text-[#b3ac9f] m-0 max-w-[460px]">{content.home_kit_blurb}</p>
                )}
              </div>
              <button onClick={() => go('kit')} className="text-sm border-b border-current pb-[3px] self-start link-hover">
                View the full kit →
              </button>
            </div>
            <div className="overflow-x-auto no-scrollbar px-[clamp(24px,4vw,48px)] pb-[clamp(28px,4vw,44px)]">
              <div className="flex gap-3.5">
                {equipment.slice(0, 7).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => go('kit')}
                    className="flex-none w-[180px] flex flex-col gap-2.5 text-left link-hover"
                  >
                    <div style={{ height: '150px', background: '#1f1d1a' }}>
                      <ImageSlot src={e.image_url} alt={e.name} placeholder={e.name} fit="contain" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#8a8377]">{e.kind === 'camera' ? 'Body' : e.kind === 'support' ? 'Support' : 'Lens'}</span>
                      <span className="text-[14px] leading-tight">{e.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(72px,10vw,140px)]">
        <div className="reveal flex justify-between items-end gap-5 flex-wrap mb-7">
          <h2 className="font-serif text-[clamp(40px,5vw,64px)] leading-none m-0">
            The <em className="italic">index</em>
          </h2>
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">
            {categories.length} disciplines · hover to preview
          </span>
        </div>
        <div onMouseLeave={() => setHoverIndex(null)} className="border-t border-[#ece8e0]">
          {categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => go('work', { cat: c.slug })}
              onMouseEnter={() => setHoverIndex(i)}
              className="reveal grid w-full text-left link-hover border-b border-[#2a2825] py-5"
              style={{ gridTemplateColumns: '56px minmax(0,1fr) auto', gap: '20px', alignItems: 'baseline' }}
            >
              <span className="font-mono text-xs text-[#e0913f]">{c.n}</span>
              <span className="font-serif text-[clamp(30px,4vw,52px)] leading-none tracking-[-0.01em]">{c.name}</span>
              <span className="font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">{c.lens}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Approach */}
      <section className="mt-[clamp(72px,10vw,140px)] px-[clamp(20px,4vw,56px)] grid gap-14 items-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}>
        <div className="reveal" style={{ height: '560px', background: '#1a1917' }}>
          <ImageSlot src={content.home_approach_image} alt="Portrait of Josh with camera" placeholder="Portrait" />
        </div>
        <div className="reveal flex flex-col gap-7">
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">Approach</span>
          <p className="font-serif text-[clamp(36px,4.4vw,58px)] leading-[1.04] m-0" style={{ textWrap: 'balance' }}>
            <RichText text={content.home_approach_quote} />
          </p>
          <p className="text-[17px] leading-[1.7] text-[#b3ac9f] m-0 max-w-[520px]" style={{ textWrap: 'pretty' }}>
            {content.home_approach_text}
          </p>
          <button onClick={() => go('about')} className="text-sm border-b border-current pb-[3px] self-start link-hover">
            More about Josh →
          </button>
        </div>
      </section>
    </div>
  );
}
