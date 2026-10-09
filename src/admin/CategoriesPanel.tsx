import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, EyeOff, Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { slugify, type Category } from '@/lib/content';
import { friendlyError, move, nextSortOrder, saveOrder } from './api';
import { ImageField } from './ImageField';
import { Button, EmptyState, Field, IconButton, Modal, Notice, PanelHeader, Spinner, TextArea, TextInput, Toggle } from './ui';

type Draft = Omit<Category, 'id' | 'sort_order'> & { id?: string };

const EMPTY: Draft = { slug: '', name: '', lens: '', blurb: '', cover_url: '', is_visible: true };

export function CategoriesPanel({ onOpenProjects }: { onOpenProjects: (categoryId: string) => void }) {
  const [items, setItems] = useState<Category[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const load = useCallback(async () => {
    const [cats, projects] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('projects').select('category_id'),
    ]);
    if (cats.error || projects.error) {
      setError('Could not load collections. Please refresh.');
      return;
    }
    setItems(cats.data as Category[]);
    const c: Record<string, number> = {};
    (projects.data ?? []).forEach((p: { category_id: string }) => (c[p.category_id] = (c[p.category_id] ?? 0) + 1));
    setCounts(c);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!items) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  const open = (d: Draft) => {
    setError(null);
    setSlugTouched(!!d.id);
    setDraft(d);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return setError('Please give the collection a name.');
    const slug = slugify(draft.slug || draft.name);
    if (!slug) return setError('Please add a web address using letters or numbers.');
    setSaving(true);
    setError(null);
    const { id } = draft;
    const payload = {
      name: draft.name.trim(),
      slug,
      lens: draft.lens,
      blurb: draft.blurb,
      cover_url: draft.cover_url,
      is_visible: draft.is_visible,
    };
    const { error } = id
      ? await supabase.from('categories').update(payload).eq('id', id)
      : await supabase.from('categories').insert({ ...payload, sort_order: nextSortOrder(items) });
    setSaving(false);
    if (error) return setError(friendlyError(error));
    setDraft(null);
    load();
  };

  const reorder = async (from: number, to: number) => {
    const next = move(items, from, to);
    setItems(next);
    try {
      await saveOrder('categories', next);
    } catch (e) {
      setError(friendlyError(e));
      load();
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    const { error } = await supabase.from('categories').delete().eq('id', confirmDelete.id);
    setSaving(false);
    if (error) return setError(friendlyError(error));
    setConfirmDelete(null);
    load();
  };

  return (
    <div>
      <PanelHeader
        title="Collections"
        description="The groups of work on the Work page, like Architecture or Events. Use the arrows to change the order — the website follows it."
        action={<Button variant="primary" onClick={() => open(EMPTY)}><Plus className="w-4 h-4" /> New collection</Button>}
      />
      {error && !draft && <div className="mb-6"><Notice tone="error">{error}</Notice></div>}

      {items.length === 0 ? (
        <EmptyState>No collections yet. Create your first one to start adding projects.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {items.map((cat, i) => (
            <li key={cat.id} className="group flex items-center gap-4 rounded-xl border border-[#22201d] bg-[#141311] p-3 pr-4 hover:border-[#3a3732] transition-colors admin-rise">
              <div className="w-20 h-14 md:w-28 md:h-20 flex-none rounded-lg overflow-hidden bg-[#1f1d1a]">
                {cat.cover_url && <img src={cat.cover_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-[22px] leading-tight truncate">{cat.name}</span>
                  {!cat.is_visible && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#26241f] px-2 py-0.5 text-[11px] text-[#b3ac9f]"><EyeOff className="w-3 h-3" /> Hidden</span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-[#8a8377] mt-1 truncate">
                  {counts[cat.id] ?? 0} project{counts[cat.id] === 1 ? '' : 's'} · /{cat.slug}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={() => onOpenProjects(cat.id)}>
                <Images className="w-3.5 h-3.5" /> Projects
              </Button>
              <div className="flex items-center">
                <IconButton label="Move up" disabled={i === 0} onClick={() => reorder(i, i - 1)}><ArrowUp className="w-4 h-4" /></IconButton>
                <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => reorder(i, i + 1)}><ArrowDown className="w-4 h-4" /></IconButton>
                <IconButton label="Edit" onClick={() => open({ ...cat })}><Pencil className="w-4 h-4" /></IconButton>
                <IconButton label="Delete" className="hover:!text-[#f0826b]" onClick={() => setConfirmDelete(cat)}><Trash2 className="w-4 h-4" /></IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit collection' : 'New collection'}
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
              <TextInput
                value={draft.name}
                autoFocus
                onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: slugTouched ? draft.slug : slugify(e.target.value) })}
              />
            </Field>
            <Field label="Web address" hint="Used in the page link. Lowercase letters, numbers and dashes.">
              <TextInput
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
                }}
              />
            </Field>
            <Field label="Lens / tagline" hint='Small label shown with the collection, e.g. "24mm · Tilt-shift".'>
              <TextInput value={draft.lens} onChange={(e) => setDraft({ ...draft, lens: e.target.value })} />
            </Field>
            <Field label="Description">
              <TextArea rows={3} value={draft.blurb} onChange={(e) => setDraft({ ...draft, blurb: e.target.value })} />
            </Field>
            <Field label="Cover image">
              <ImageField value={draft.cover_url} onChange={(url) => setDraft({ ...draft, cover_url: url })} aspect="16 / 10" />
            </Field>
            <Toggle label="Show on website" checked={draft.is_visible} onChange={(v) => setDraft({ ...draft, is_visible: v })} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        title="Delete collection?"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Keep it</Button>
            <Button variant="danger" loading={saving} onClick={remove}>Delete forever</Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-[#cfc8bb] m-0">
          "{confirmDelete?.name}" and its {counts[confirmDelete?.id ?? ''] ?? 0} project(s) and photos will be permanently removed. If you just want to take it off the site for now, switch off "Show on website" instead.
        </p>
      </Modal>
    </div>
  );
}
