import { useSiteData } from '@/context/SiteData';
import { RichText } from '@/components/RichText';

export function Footer() {
  const { content } = useSiteData();
  const links = [
    { label: 'Instagram', href: content.link_instagram },
    { label: 'YouTube', href: content.link_youtube },
    { label: 'Email', href: content.link_email ? `mailto:${content.link_email}` : '' },
    { label: 'Prints', href: content.link_prints },
  ].filter((l) => l.href);

  return (
    <footer className="flex justify-between flex-wrap gap-4 px-[clamp(20px,4vw,56px)] py-7 text-[13px] text-[#8a8377] border-t border-[#22201d]">
      <span>{content.footer_credit}</span>
      <div className="flex gap-6 flex-wrap">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            {...(l.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            className="link-hover"
          >
            {l.label}
          </a>
        ))}
        <a href="/admin" className="link-hover text-[#5d574e] hover:text-[#8a8377] transition-colors">Admin</a>
      </div>
    </footer>
  );
}

export function CTA({ go }: { go: (page: string) => void }) {
  const { content } = useSiteData();
  return (
    <section className="mt-[clamp(96px,12vw,160px)] px-[clamp(20px,4vw,56px)] py-[clamp(72px,9vw,120px)] border-t border-[#22201d] flex flex-col items-center gap-7 text-center">
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#8a8377]">{content.cta_eyebrow}</span>
      <h2 className="font-serif text-[clamp(56px,9vw,136px)] leading-[0.92] tracking-[-0.025em] m-0">
        <RichText text={content.cta_headline} />
      </h2>
      <button
        onClick={() => go('contact')}
        className="bg-[#ece8e0] text-[#0e0d0c] px-[30px] py-[17px] rounded-full text-[15px] font-medium link-hover"
      >
        Start a commission
      </button>
    </section>
  );
}
