import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { FileText, FolderOpen, Images, Tag, Inbox, LogOut, ExternalLink, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLogin } from './AdminLogin';
import { ContentPanel } from './ContentPanel';
import { CategoriesPanel } from './CategoriesPanel';
import { ProjectsPanel } from './ProjectsPanel';
import { ServicesPanel } from './ServicesPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { EnquiriesPanel } from './EnquiriesPanel';
import { Button, Spinner } from './ui';

type Tab = 'content' | 'categories' | 'projects' | 'services' | 'equipment' | 'enquiries';

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'content', label: 'Page content', icon: FileText },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'projects', label: 'Projects & photos', icon: Images },
  { id: 'services', label: 'Services', icon: Tag },
  { id: 'equipment', label: 'Equipment', icon: Camera },
  { id: 'enquiries', label: 'Enquiries', icon: Inbox },
];

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('content');
  const [projectCategory, setProjectCategory] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Admin — Sak Shoots';
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  const checkAdmin = useCallback(() => {
    setIsAdmin(null);
    supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(!error && data === true));
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (userId) checkAdmin();
  }, [userId, checkAdmin]);

  const signOut = () => supabase.auth.signOut();

  if (session === undefined) return <Shell><Spinner /></Shell>;
  if (!session) return <AdminLogin onSignedIn={checkAdmin} />;
  if (isAdmin === null) return <Shell><Spinner /></Shell>;

  if (!isAdmin) {
    return (
      <Shell>
        <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-center px-6">
          <h1 className="font-serif text-[44px] leading-none m-0">No admin access</h1>
          <p className="text-[14px] text-[#8a8377] m-0 max-w-[380px]">This account isn't allowed to edit the site. Sign in with the admin account instead.</p>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </Shell>
    );
  }

  const openProjects = (categoryId: string) => {
    setProjectCategory(categoryId);
    setTab('projects');
  };

  const username = session.user.email?.replace(/@admin\.sakshoots\.co\.uk$/, '') ?? '';

  return (
    <Shell>
      <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-0 lg:h-screen flex flex-col border-b lg:border-b-0 lg:border-r border-[#22201d] bg-[#121110]">
          <div className="flex items-center justify-between gap-3 px-5 h-16 lg:h-20">
            <img src="/283150b1-3d59-454d-8f5e-c9239aee950c_rwc_20x0x1413x356x4096.png" alt="Sak Shoots" className="h-9 w-auto" />
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#e0913f]">Admin</span>
          </div>
          <nav className="flex lg:flex-col gap-1 px-3 pb-3 lg:pb-0 overflow-x-auto no-scrollbar">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex-none flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] transition-colors ${
                    active ? 'bg-[#1f1d1a] text-[#ece8e0]' : 'text-[#8a8377] hover:text-[#ece8e0] hover:bg-[#1a1917]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#e0913f]' : ''}`} />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="hidden lg:flex mt-auto flex-col gap-1 p-3 border-t border-[#22201d]">
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] text-[#8a8377] hover:text-[#ece8e0] hover:bg-[#1a1917] transition-colors">
              <ExternalLink className="w-4 h-4" /> View website
            </a>
            <button onClick={signOut} className="flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] text-[#8a8377] hover:text-[#ece8e0] hover:bg-[#1a1917] transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
            <span className="px-3 pt-2 text-[11px] text-[#5d574e] truncate">Signed in as {username}</span>
          </div>
        </aside>

        <main className="px-[clamp(20px,4vw,48px)] py-10 max-w-[1100px] w-full">
          <div className="flex lg:hidden justify-end gap-2 mb-6">
            <a href="/" target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="w-3.5 h-3.5" /> View site</Button></a>
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="w-3.5 h-3.5" /> Sign out</Button>
          </div>
          <div key={tab} className="admin-rise">
            {tab === 'content' && <ContentPanel />}
            {tab === 'categories' && <CategoriesPanel onOpenProjects={openProjects} />}
            {tab === 'projects' && <ProjectsPanel initialCategoryId={projectCategory} />}
            {tab === 'services' && <ServicesPanel />}
            {tab === 'equipment' && <EquipmentPanel />}
            {tab === 'enquiries' && <EnquiriesPanel />}
          </div>
        </main>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#0e0d0c] text-[#ece8e0]">{children}</div>;
}
