import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ServiceTier } from '@/lib/content';
import { friendlyError, move, nextSortOrder, saveOrder } from './api';
import { StringListEditor } from './ListEditors';
import { Button, EmptyState, Field, IconButton, Modal, Notice, PanelHeader, Spinner, TextArea, TextInput, Toggle } from './ui';

type Draft = Omit<ServiceTier, 'id' | 'sort_order'> & { id?: string };

const EMPTY: Draft = { title: '', lens: '', price: '', badge: '', summary: '', features: [], is_featured: false };

export function ServicesPanel() {
  const [items, setItems] = useState<ServiceTier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ServiceTier | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('service_tiers').select('*').order('sort_order');
    if (error) return setError('Could not load services. Please refresh.');
    setItems(data as ServiceTier[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!items) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  const open = (d: Draft) => {
    setError(null);
    setDraft(d);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return setError('Please give the service a name.');
    setSaving(true);
    setError(null);
    const { id } = draft;
    const payload = {
      title: draft.title.trim(),
      lens: draft.lens,
      price: draft.price,
      badge: draft.badge,
      summary: draft.summary,
      features: draft.features.map((f) => f.trim()).filter(Boolean),
      is_featured: draft.is_featured,
    };
    const { error } = id
      ? await supabase.from('service_tiers').update(payload).eq('id', id)
      : await supabase.from('service_tiers').insert({ ...payload, sort_order: nextSortOrder(items) });
    setSaving(false);
    if (error) return setError(friendlyError(error));
    setDraft(null);
    load();
  };

  const reorder = async (from: number, to: number) => {
    const next = move(items, from, to);
    setItems(next);
    try {
      await saveOrder('service_tiers', next);
    } catch (e) {
      setError(friendlyError(e));
      load();
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    const { error } = await supabase.from('service_tiers').delete().eq('id', confirmDelete.id);
    setSaving(false);
    if (error) return setError(friendlyError(error));
    setConfirmDelete(null);
    load();
  };

  return (
    <div>
      <PanelHeader
        title="Services"
        description="The packages and prices on the Services page. Their short summaries also appear in the “What I shoot” cards on the home page."
        action={<Button variant="primary" onClick={() => open(EMPTY)}><Plus className="w-4 h-4" /> New service</Button>}
      />
      {error && !draft && <div className="mb-6"><Notice tone="error">{error}</Notice></div>}

      {items.length === 0 ? (
        <EmptyState>No services yet.</EmptyState>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((t, i) => (
            <div key={t.id} className={`flex flex-col rounded-2xl border p-5 admin-rise transition-colors ${t.is_featured ? 'border-[#e0913f]/60 bg-[#1a1917]' : 'border-[#22201d] bg-[#141311] hover:border-[#3a3732]'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-mono text-[11px] text-[#8a8377] tracking-[0.08em]">{t.lens}</div>
                {t.is_featured && <span className="inline-flex items-center gap-1 text-[11px] text-[#e0913f]"><Star className="w-3 h-3 fill-[#e0913f]" /> Highlighted</span>}
              </div>
              <div className="font-serif text-[28px] leading-tight mt-2">{t.title}</div>
              <div className="text-[15px] text-[#ece8e0] mt-1">{t.price}</div>
              <p className="text-[13px] leading-[1.5] text-[#b3ac9f] mt-3 mb-4 line-clamp-3">{t.summary}</p>
              <div className="mt-auto flex items-center justify-between border-t border-[#22201d] pt-3">
                <span className="text-[12px] text-[#8a8377]">{t.features.length} inclusion{t.features.length === 1 ? '' : 's'}</span>
                <div className="flex">
                  <IconButton label="Move earlier" disabled={i === 0} onClick={() => reorder(i, i - 1)}><ArrowUp className="w-4 h-4" /></IconButton>
                  <IconButton label="Move later" disabled={i === items.length - 1} onClick={() => reorder(i, i + 1)}><ArrowDown className="w-4 h-4" /></IconButton>
                  <IconButton label="Edit" onClick={() => open({ ...t, features: [...t.features] })}><Pencil className="w-4 h-4" /></IconButton>
                  <IconButton label="Delete" className="hover:!text-[#f0826b]" onClick={() => setConfirmDelete(t)}><Trash2 className="w-4 h-4" /></IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit service' : 'New service'}
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={save}>Save</Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-6">
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Name">
              <TextInput autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Price" hint='e.g. "From £450".'>
                <TextInput value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
              </Field>
              <Field label="Lens / tagline">
                <TextInput value={draft.lens} onChange={(e) => setDraft({ ...draft, lens: e.target.value })} />
              </Field>
            </div>
            <Field label="Summary">
              <TextArea rows={3} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
            </Field>
            <Field label="What's included">
              <StringListEditor value={draft.features} onChange={(features) => setDraft({ ...draft, features })} addLabel="Add inclusion" />
            </Field>
            <div className="flex flex-col gap-4 rounded-xl border border-[#22201d] bg-[#121110] p-4">
              <Toggle label="Highlight this package" checked={draft.is_featured} onChange={(v) => setDraft({ ...draft, is_featured: v })} />
              {draft.is_featured && (
                <Field label="Highlight badge" hint='e.g. "Most booked".'>
                  <TextInput value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
                </Field>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        title="Delete service?"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Keep it</Button>
            <Button variant="danger" loading={saving} onClick={remove}>Delete forever</Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-[#cfc8bb] m-0">"{confirmDelete?.title}" will be removed from the Services and home pages.</p>
      </Modal>
    </div>
  );
}
