import { useReveal } from '@/hooks/useReveal';
import { useSiteData } from '@/context/SiteData';
import { RichText } from '@/components/RichText';

type ServicesProps = {
  go: (page: string) => void;
};

export function Services({ go }: ServicesProps) {
  const ref = useReveal<HTMLDivElement>();
  const { content, tiers } = useSiteData();

  return (
    <div ref={ref}>
      {/* Header */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,6vw,80px)] grid gap-10 items-end" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))' }}>
        <div className="reveal flex flex-col gap-[22px]">
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">Services &amp; pricing</span>
          <h1 className="font-serif text-[clamp(56px,8vw,120px)] leading-[0.92] tracking-[-0.025em] m-0">
            <RichText text={content.services_headline} />
          </h1>
        </div>
        <p className="reveal text-[18px] leading-[1.6] text-[#b3ac9f] m-0 max-w-[440px]" style={{ textWrap: 'pretty' }}>
          {content.services_intro}
        </p>
      </section>

      {/* Pricing cards */}
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(56px,7vw,96px)] grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
        {tiers.map((tier, i) => (
          <div
            key={tier.id}
            className="reveal flex flex-col gap-[22px] p-8 border"
            style={{
              background: tier.is_featured ? '#ece8e0' : '#161513',
              color: tier.is_featured ? '#0e0d0c' : '#ece8e0',
              borderColor: tier.is_featured ? '#ece8e0' : '#2a2825',
            }}
          >
            <div className="flex justify-between font-mono text-[11px] tracking-[0.1em]" style={{ color: tier.is_featured ? '#5d574e' : '#8a8377' }}>
              <span style={{ color: tier.is_featured ? '#a75d14' : '#e0913f' }}>
                {String(i + 1).padStart(2, '0')}{tier.badge ? ` · ${tier.badge}` : ''}
              </span>
              <span>{tier.lens}</span>
            </div>
            <h3 className="font-serif text-[40px] leading-none m-0">{tier.title}</h3>
            {tier.price && (
              <div className="flex items-baseline gap-2">
                <span className="text-[13px]" style={{ color: tier.is_featured ? '#5d574e' : '#8a8377' }}>from</span>
                <span className="font-serif text-[56px] leading-none">{tier.price}</span>
              </div>
            )}
            <ul className="m-0 pt-5 list-none flex flex-col gap-3 text-[15px] border-t" style={{ color: tier.is_featured ? '#2e2b27' : '#cfc8bb', borderColor: tier.is_featured ? '#cfc8bb' : '#2a2825' }}>
              {tier.features.map((f, j) => (
                <li key={`${f}-${j}`}>{f}</li>
              ))}
            </ul>
            <button
              onClick={() => go('contact')}
              className="mt-auto text-center py-3.5 rounded-full text-sm link-hover"
              style={{
                border: tier.is_featured ? 'none' : '1px solid #ece8e0',
                background: tier.is_featured ? '#0e0d0c' : 'transparent',
                color: '#ece8e0',
                fontWeight: tier.is_featured ? 500 : 400,
              }}
            >
              Enquire
            </button>
          </div>
        ))}
      </section>

      {/* How it works */}
      {content.services_steps.length > 0 && (
        <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(72px,9vw,120px)]">
          <h2 className="reveal font-serif text-[clamp(40px,5vw,64px)] leading-none m-0 mb-9">
            How it <em className="italic">works</em>
          </h2>
          <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
            {content.services_steps.map((s, i) => (
              <div key={`${s.title}-${i}`} className="reveal flex flex-col gap-3 border-t border-[#ece8e0] pt-[18px]">
                <span className="font-mono text-[11px] text-[#e0913f]">STEP {String(i + 1).padStart(2, '0')}</span>
                <span className="font-serif text-[28px]">{s.title}</span>
                <span className="text-[15px] leading-[1.6] text-[#b3ac9f]">{s.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
