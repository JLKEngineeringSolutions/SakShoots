import { ImageSlot } from '@/components/ImageSlot';
import { useReveal } from '@/hooks/useReveal';
import { useSiteData } from '@/context/SiteData';

type WorkProps = {
  catSlug: string;
  go: (page: string, extra?: Record<string, string>) => void;
};

export function Work({ catSlug, go }: WorkProps) {
  const ref = useReveal<HTMLDivElement>();
  const { categories } = useSiteData();
  const cat = categories.find((c) => c.slug === catSlug) ?? categories[0];

  if (!cat) {
    return (
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,6vw,80px)]">
        <h1 className="font-serif text-[clamp(48px,6vw,88px)] leading-none m-0">Portfolio coming soon.</h1>
      </section>
    );
  }

  return (
    <div ref={ref}>
      {/* Category tabs */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,6vw,80px)]">
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">Portfolio</span>
        <div className="flex gap-2 flex-wrap mt-[22px]">
          {categories.map((c) => {
            const active = c.id === cat.id;
            return (
              <button
                key={c.id}
                onClick={() => go('work', { cat: c.slug })}
                className="px-4 py-[9px] rounded-full border text-[13px] link-hover"
                style={{
                  borderColor: active ? '#ece8e0' : '#3a3732',
                  background: active ? '#ece8e0' : 'transparent',
                  color: active ? '#0e0d0c' : '#ece8e0',
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Category header */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(48px,6vw,88px)] grid gap-10 items-end" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}>
        <div className="reveal flex flex-col gap-[22px]">
          <span className="font-mono text-xs text-[#e0913f]">{cat.n} / {String(categories.length).padStart(2, '0')} · {cat.lens}</span>
          <h1 className="font-serif text-[clamp(56px,8vw,120px)] leading-[0.92] tracking-[-0.025em] m-0">{cat.name}</h1>
          <p className="text-[18px] leading-[1.6] text-[#b3ac9f] m-0 max-w-[460px]" style={{ textWrap: 'pretty' }}>{cat.blurb}</p>
        </div>
        <div className="reveal" style={{ height: '440px', background: '#1a1917' }}>
          <ImageSlot src={cat.cover_url} alt={`${cat.name} — cover`} placeholder={`${cat.name} — cover`} />
        </div>
      </section>

      {/* Projects grid */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(56px,7vw,96px)] grid gap-x-8 gap-y-14" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 520px), 1fr))' }}>
        {cat.projects.length === 0 && (
          <p className="text-[15px] text-[#8a8377] m-0">New work for this category is on its way.</p>
        )}
        {cat.projects.map((p) => (
          <button
            key={p.id}
            onClick={() => go('project', { cat: cat.slug, proj: p.slug })}
            className="reveal flex flex-col gap-4 text-left link-hover"
          >
            <div style={{ height: '420px', background: '#1a1917' }}>
              <ImageSlot src={p.images[0]} alt={`${p.title} — lead image`} placeholder={`${p.title} — lead image`} />
            </div>
            <div className="flex justify-between items-baseline gap-4 border-t border-[#2a2825] pt-3.5">
              <span className="font-serif text-[34px] leading-none">{p.title}</span>
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[#8a8377]">{p.place}</span>
            </div>
            <span className="text-[15px] text-[#b3ac9f]">{p.brief}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
