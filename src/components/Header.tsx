import { useEffect, useState } from 'react';
import { useSiteData } from '@/context/SiteData';

type HeaderProps = {
  page: string;
  go: (page: string) => void;
};

export function Header({ page, go }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const { content } = useSiteData();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isWorkNav = page === 'work' || page === 'project';
  const isServices = page === 'services';
  const isAbout = page === 'about';

  return (
    <header
      className="sticky top-0 z-40 flex justify-between items-center gap-6 px-[clamp(20px,4vw,56px)] py-4 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(14,13,12,0.82)' : 'rgba(14,13,12,0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid #22201d',
      }}
    >
      <button
        onClick={() => go('home')}
        className="flex items-center transition-transform duration-300 hover:scale-105"
        aria-label="Sak Shoots home"
      >
        <img
          src={content.brand_logo || '/283150b1-3d59-454d-8f5e-c9239aee950c_rwc_20x0x1413x356x4096.png'}
          alt="Sak Shoots logo"
          className="block h-12 sm:h-14 md:h-16 w-auto max-w-[55vw] sm:max-w-none object-contain object-left"
        />
      </button>

      <nav className="flex items-center gap-[clamp(16px,2.6vw,36px)] text-sm flex-wrap justify-end">
        <button onClick={() => go('work')} className="flex items-center gap-[7px] link-hover">
          {isWorkNav && <span className="w-[5px] h-[5px] rounded-full bg-[#e0913f]" />}
          Work
        </button>
        <button onClick={() => go('services')} className="flex items-center gap-[7px] link-hover">
          {isServices && <span className="w-[5px] h-[5px] rounded-full bg-[#e0913f]" />}
          Services
        </button>
        <button onClick={() => go('about')} className="flex items-center gap-[7px] link-hover">
          {isAbout && <span className="w-[5px] h-[5px] rounded-full bg-[#e0913f]" />}
          About
        </button>
        {content.link_journal && (
          <a href={content.link_journal} target="_blank" rel="noopener noreferrer" className="link-hover">
            Journal
          </a>
        )}
        {content.link_prints && (
          <a href={content.link_prints} target="_blank" rel="noopener noreferrer" className="link-hover">
            Prints
          </a>
        )}
        <button
          onClick={() => go('contact')}
          className="bg-[#ece8e0] text-[#0e0d0c] px-5 py-[11px] rounded-full text-[13px] font-medium link-hover"
        >
          Enquire
        </button>
      </nav>
    </header>
  );
}
