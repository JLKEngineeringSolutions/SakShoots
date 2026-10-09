import { ImageSlot } from '@/components/ImageSlot';
import { RichText } from '@/components/RichText';
import { useReveal } from '@/hooks/useReveal';
import { useSiteData } from '@/context/SiteData';

type AboutProps = {
  go: (page: string) => void;
};

function splitUnit(value: string) {
  const m = value.match(/^(\d+)\s*(\D*)$/);
  return m ? { val: m[1], unit: m[2] } : { val: value, unit: '' };
}

export function About({ go }: AboutProps) {
  const ref = useReveal<HTMLDivElement>();
  const { content } = useSiteData();

  return (
    <div ref={ref}>
      <section className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,6vw,80px)] grid gap-14 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}>
        <div className="reveal relative" style={{ height: '680px', background: '#1a1917' }}>
          <ImageSlot src={content.about_image} alt="Portrait of Josh" placeholder="Portrait" />
          {content.about_image_caption && (
            <div className="absolute bottom-3.5 left-3.5 font-mono text-[11px] tracking-[0.1em] text-[#ece8e0] pointer-events-none" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
              {content.about_image_caption}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[30px] pt-3">
          <span className="reveal font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">About</span>
          <h1 className="reveal font-serif text-[clamp(52px,6.6vw,96px)] leading-[0.94] tracking-[-0.02em] m-0">
            <RichText text={content.about_headline} />
          </h1>
          <div className="reveal flex flex-col gap-[18px] text-[17px] leading-[1.7] text-[#cfc8bb] max-w-[560px]">
            {content.about_body.map((para, i) => (
              <p key={i} className="m-0" style={{ textWrap: 'pretty' }}>{para}</p>
            ))}
          </div>

          {/* In the bag */}
          {content.about_kit.length > 0 && (
            <button onClick={() => go('kit')} className="reveal flex flex-col gap-3.5 text-left link-hover group">
              <span className="flex items-center justify-between font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">
                In the bag
                <span className="text-[#e0913f] group-hover:translate-x-0.5 transition-transform">See the full kit →</span>
              </span>
              <div
                className="grid border-t border-[#ece8e0] border-b border-[#2a2825]"
                style={{ gridTemplateColumns: `repeat(${content.about_kit.length}, minmax(0, 1fr))` }}
              >
                {content.about_kit.map((item, i) => {
                  const { val, unit } = splitUnit(item.title);
                  return (
                    <div
                      key={`${item.title}-${i}`}
                      className="flex flex-col gap-1.5 py-5"
                      style={i > 0 ? { paddingLeft: '20px', borderLeft: '1px solid #2a2825' } : {}}
                    >
                      <span className="font-serif text-[48px] leading-none">
                        {val}<span className="text-[20px]">{unit}</span>
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </button>
          )}

          {/* CTAs */}
          <div className="reveal flex gap-3 flex-wrap">
            <button onClick={() => go('contact')} className="bg-[#ece8e0] text-[#0e0d0c] px-[26px] py-[15px] rounded-full text-sm font-medium link-hover">
              Work with me
            </button>
            <button onClick={() => go('work')} className="px-[26px] py-[15px] rounded-full text-sm border border-[#3a3732] link-hover">
              See the portfolio
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
