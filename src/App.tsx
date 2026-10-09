import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer, CTA } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { Work } from '@/pages/Work';
import { Project } from '@/pages/Project';
import { Services } from '@/pages/Services';
import { About } from '@/pages/About';
import { Contact } from '@/pages/Contact';
import { Kit } from '@/pages/Kit';
import { SiteDataProvider } from '@/context/SiteData';
import { fetchSiteData, type SiteData } from '@/lib/content';

type PageState = {
  page: string;
  cat: string;
  proj: string;
};

function App() {
  const [state, setState] = useState<PageState>({ page: 'home', cat: '', proj: '' });
  const [data, setData] = useState<SiteData | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    fetchSiteData()
      .then(setData)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(load, [load]);

  const go = useCallback((page: string, extra?: Record<string, string>) => {
    setState(prev => ({
      page,
      cat: extra?.cat ?? prev.cat,
      proj: extra?.proj ?? prev.proj,
    }));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#0e0d0c', color: '#ece8e0' }}>
        {loadError ? (
          <>
            <span className="font-serif text-[40px]">Couldn't load the site.</span>
            <button onClick={load} className="bg-[#ece8e0] text-[#0e0d0c] px-6 py-3 rounded-full text-sm font-medium link-hover">
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-[#3a3732] border-t-[#e0913f] rounded-full animate-spin" />
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#8a8377]">Loading</span>
          </>
        )}
      </div>
    );
  }

  return (
    <SiteDataProvider value={data}>
      <div className="min-h-screen" style={{ background: '#0e0d0c', color: '#ece8e0' }}>
        <Header page={state.page} go={go} />

        {state.page === 'home' && <Home go={go} />}
        {state.page === 'work' && <Work catSlug={state.cat} go={go} />}
        {state.page === 'project' && <Project catSlug={state.cat} projSlug={state.proj} go={go} />}
        {state.page === 'services' && <Services go={go} />}
        {state.page === 'about' && <About go={go} />}
        {state.page === 'kit' && <Kit go={go} />}
        {state.page === 'contact' && <Contact go={go} />}

        {state.page !== 'contact' && state.page !== 'kit' && <CTA go={go} />}
        <Footer />
      </div>
    </SiteDataProvider>
  );
}

export default App;
