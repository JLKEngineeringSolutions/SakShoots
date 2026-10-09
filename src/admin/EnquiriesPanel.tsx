import { useCallback, useEffect, useState } from 'react';
import { Mail, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { friendlyError } from './api';
import { Button, EmptyState, IconButton, Modal, Notice, PanelHeader, Spinner } from './ui';

type Enquiry = {
  id: string;
  name: string;
  email: string;
  business: string | null;
  ideal_date: string | null;
  project_type: string | null;
  budget: string | null;
  brief: string | null;
  created_at: string;
};

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function EnquiriesPanel() {
  const [items, setItems] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
    if (error) return setError('Could not load enquiries. Please refresh.');
    setItems(data as Enquiry[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!items) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const { error } = await supabase.from('enquiries').delete().eq('id', confirmDelete.id);
    setDeleting(false);
    if (error) return setError(friendlyError(error));
    setConfirmDelete(null);
    load();
  };

  return (
    <div>
      <PanelHeader title="Enquiries" description="Messages sent through the contact form, newest first." />
      {error && <div className="mb-6"><Notice tone="error">{error}</Notice></div>}

      {items.length === 0 ? (
        <EmptyState>No enquiries yet. New messages from the contact form will appear here.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {items.map((q) => {
            const expanded = openId === q.id;
            const details = [q.project_type, q.budget, q.ideal_date && `Date: ${q.ideal_date}`].filter(Boolean) as string[];
            return (
              <li key={q.id} className="rounded-xl border border-[#22201d] bg-[#141311] hover:border-[#3a3732] transition-colors admin-rise">
                <button onClick={() => setOpenId(expanded ? null : q.id)} className="w-full text-left p-4 md:p-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-serif text-[22px] leading-tight">{q.name}</span>
                  {q.business && <span className="text-[13px] text-[#b3ac9f]">{q.business}</span>}
                  <span className="ml-auto font-mono text-[11px] text-[#8a8377]">{dateFormat.format(new Date(q.created_at))}</span>
                  {!expanded && q.brief && <p className="basis-full text-[13px] text-[#8a8377] m-0 mt-1 truncate">{q.brief}</p>}
                </button>
                {expanded && (
                  <div className="px-4 md:px-5 pb-5 flex flex-col gap-4 admin-fade">
                    {details.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {details.map((d) => <span key={d} className="rounded-full border border-[#3a3732] px-3 py-1 text-[12px] text-[#cfc8bb]">{d}</span>)}
                      </div>
                    )}
                    <p className="text-[14px] leading-[1.6] text-[#cfc8bb] m-0 whitespace-pre-wrap">{q.brief || 'No message left.'}</p>
                    <div className="flex items-center justify-between gap-3 border-t border-[#22201d] pt-4">
                      <a
                        href={`mailto:${encodeURIComponent(q.email)}?subject=${encodeURIComponent('Re: your shoot enquiry')}`}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#e0913f] text-[#0e0d0c] text-[13px] font-medium hover:bg-[#eaa358] transition-colors"
                      >
                        <Mail className="w-4 h-4" /> Reply to {q.email}
                      </a>
                      <IconButton label="Delete enquiry" className="hover:!text-[#f0826b]" onClick={() => setConfirmDelete(q)}><Trash2 className="w-4 h-4" /></IconButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!confirmDelete}
        title="Delete enquiry?"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Keep it</Button>
            <Button variant="danger" loading={deleting} onClick={remove}>Delete</Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-[#cfc8bb] m-0">The message from {confirmDelete?.name} will be permanently removed.</p>
      </Modal>
    </div>
  );
}
