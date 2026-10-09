import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Equipment } from '@/lib/content';
import { friendlyError, move, nextSortOrder, saveOrder } from './api';
import { ImageField } from './ImageField';
import { StringListEditor } from './ListEditors';
import { Button, EmptyState, Field, IconButton, Modal, Notice, PanelHeader, Spinner, TextArea, TextInput, Toggle } from './ui';

type Kind = Equipment['kind'];
type Draft = Omit<Equipment, 'id' | 'sort_order'> & { id?: string };

const KINDS: { id: Kind; label: string; blurb: string }[] = [
  { id: 'camera', label: 'Camera body', blurb: 'The body shown at the top of the Kit page.' },
  { id: 'lens', label: 'Lenses', blurb: 'Each lens gets its own section with a film strip of photos tagged to it.' },
  { id: 'support', label: 'Light & support', blurb: 'Lighting, stands and other kit shown as a quieter grid.' },
];

const emptyDraft = (kind: Kind): Draft => ({ kind, name: '', subtitle: '', usage: '', image_url: '', specs: [], is_visible: true });

export function EquipmentPanel() {
  const [items, setItems] = useState<Equipment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Equipment | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('equipment').select('*').order('sort_order');
    if (error) return setError('Could not load equipment. Please refresh.');
    setItems(data as Equipment[]);
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
    if (!draft.name.trim()) return setError('Please give the equipment a name.');
    setSaving(true);
    setError(null);
    const { id } = draft;
    const payload = {
      kind: draft.kind,
      name: draft.name.trim(),
      subtitle: draft.subtitle,
      usage: draft.usage,
      image_url: draft.image_url,
      specs: draft.specs.map((s) => s.trim()).filter(Boolean),
      is_visible: draft.is_visible,
    };
    const { error } = id
      ? await supabase.from('equipment').update(payload).eq('id', id)
      : await supabase.from('equipment').insert({ ...payload, sort_order: nextSortOrder(items) });
    setSaving(false);
    if (error) return setError(friendlyError(error));
    setDraft(null);
    load();
  };

  const reorder = async (kind: Kind, group: Equipment[], from: number, to: number) => {
    if (to < 0 || to >= group.length) return;
    const reordered = move(group, from, to);
    const next = items.map((it) => (it.kind === kind ? reordered.shift()! : it));
    setItems(next);
    try {
      await saveOrder('equipment', next);
    } catch (e) {
      setError(friendlyError(e));
      load();
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    const { error } = await supabase.from('equipment').delete().eq('id', confirmDelete.id);
    setSaving(false);
    if (error) return setError(friendlyError(error));
    setConfirmDelete(null);
    load();
  };

  return (
    <div>
      <PanelHeader
        title="Equipment"
        description="The camera, lenses and support kit shown on the Kit page. Tag photos to a lens under Projects & photos to fill its film strip."
      />
      {error && !draft && <div className="mb-6"><Notice tone="error">{error}</Notice></div>}

      <div className="flex flex-col gap-10">
        {KINDS.map(({ id: kind, label, blurb }) => {
          const group = items.filter((it) => it.kind === kind);
          return (
            <div key={kind}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-col gap-1">
                  <h2 className="font-serif text-[26px] leading-none m-0">{label}</h2>
                  <p className="text-[12px] text-[#8a8377] m-0">{blurb}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => open(emptyDraft(kind))}><Plus className="w-3.5 h-3.5" /> Add</Button>
              </div>
              {group.length === 0 ? (
                <EmptyState>Nothing here yet.</EmptyState>
              ) : (
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  {group.map((it, i) => (
                    <li key={it.id} className="flex items-center gap-4 rounded-xl border border-[#22201d] bg-[#141311] p-3 pr-4 hover:border-[#3a3732] transition-colors admin-rise">
                      <div className="w-20 h-16 flex-none rounded-lg overflow-hidden bg-[#1f1d1a] flex items-center justify-center">
                        {it.image_url && <img src={it.image_url} alt="" className="w-full h-full object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-[20px] leading-tight truncate">{it.name}</span>
                          {!it.is_visible && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#26241f] px-2 py-0.5 text-[11px] text-[#b3ac9f]"><EyeOff className="w-3 h-3" /> Hidden</span>
                          )}
                        </div>
                        {it.subtitle && <div className="font-mono text-[11px] text-[#8a8377] mt-1 truncate">{it.subtitle}</div>}
                      </div>
                      <div className="flex items-center">
                        <IconButton label="Move up" disabled={i === 0} onClick={() => reorder(kind, group, i, i - 1)}><ArrowUp className="w-4 h-4" /></IconButton>
                        <IconButton label="Move down" disabled={i === group.length - 1} onClick={() => reorder(kind, group, i, i + 1)}><ArrowDown className="w-4 h-4" /></IconButton>
                        <IconButton label="Edit" onClick={() => open({ ...it, specs: [...it.specs] })}><Pencil className="w-4 h-4" /></IconButton>
                        <IconButton label="Delete" className="hover:!text-[#f0826b]" onClick={() => setConfirmDelete(it)}><Trash2 className="w-4 h-4" /></IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit equipment' : 'New equipment'}
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
            <Field label="Type">
              <div className="flex gap-2 flex-wrap">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, kind: k.id })}
                    className={`px-4 h-9 rounded-full border text-[13px] transition-colors ${
                      draft.kind === k.id ? 'bg-[#ece8e0] text-[#0e0d0c] border-[#ece8e0]' : 'border-[#3a3732] text-[#cfc8bb] hover:border-[#8a8377]'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Name">
              <TextInput autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Short label" hint='Small line shown under the name, e.g. "F2 · Fujifilm".'>
              <TextInput value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
            </Field>
            <Field label="What it's for">
              <TextArea rows={3} value={draft.usage} onChange={(e) => setDraft({ ...draft, usage: e.target.value })} />
            </Field>
            <Field label="Photo of the gear">
              <ImageField value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} aspect="4 / 3" />
            </Field>
            {draft.kind === 'camera' && (
              <Field label="Key specs" hint="Short labels shown in typewriter style, e.g. APS-C, PRIME ONLY.">
                <StringListEditor value={draft.specs} onChange={(specs) => setDraft({ ...draft, specs })} addLabel="Add spec" />
              </Field>
            )}
            <Toggle label="Show on the Kit page" checked={draft.is_visible} onChange={(v) => setDraft({ ...draft, is_visible: v })} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        title="Delete equipment?"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Keep it</Button>
            <Button variant="danger" loading={saving} onClick={remove}>Delete forever</Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-[#cfc8bb] m-0">
          "{confirmDelete?.name}" will be removed from the Kit page. Photos tagged to it stay in their projects — they just lose the tag.
        </p>
      </Modal>
    </div>
  );
}
