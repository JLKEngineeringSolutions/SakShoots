import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { slugify, type Category, type Project } from '@/lib/content';
import { friendlyError, move, nextSortOrder, saveOrder } from './api';
import { ProjectPhotos } from './ProjectPhotos';
import { Button, EmptyState, Field, IconButton, Modal, Notice, PanelHeader, Spinner, TextArea, TextInput, Toggle } from './ui';

type Row = Project & { cover: string | null; photoCount: number };
type Draft = Omit<Project, 'id' | 'sort_order'> & { id?: string };

export function ProjectsPanel({ initialCategoryId }: { initialCategoryId: string | null }) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId);
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data, error }) => {
      if (error) return setError('Could not load collections. Please refresh.');
      const cats = data as Category[];
      setCategories(cats);
      setCategoryId((id) => (id && cats.some((c) => c.id === id) ? id : cats[0]?.id ?? null));
    });
  }, []);

  const load = useCallback(async () => {
    if (!categoryId) return setItems([]);
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_images(url, sort_order)')
      .eq('category_id', categoryId)
      .order('sort_order');
    if (error) return setError('Could not load projects. Please refresh.');
    setItems(
      (data ?? []).map(({ project_images, ...p }: Project & { project_images: { url: string; sort_order: number }[] }) => {
        const sorted = [...(project_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        return { ...p, cover: sorted[0]?.url ?? null, photoCount: sorted.length };
      }),
    );
  }, [categoryId]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  if (!categories) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  if (categories.length === 0) {
    return (
      <div>
        <PanelHeader title="Projects & photos" />
        <EmptyState>Create a collection first — projects live inside collections.</EmptyState>
      </div>
    );
  }

  const open = (d: Draft) => {
    setError(null);
    setSlugTouched(!!d.id);
    setDraft(d);
  };

  const newDraft = (): Draft => ({
    category_id: categoryId ?? categories[0].id,
    slug: '', title: '', place: '', brief: '', lens: '', year: String(new Date().getFullYear()),
    is_visible: true, is_featured: false, featured_tag: '',
  });

  const save = async (closeAfter: boolean) => {
    if (!draft || !items) return;
    if (!draft.title.trim()) return setError('Please give the project a title.');
    const slug = slugify(draft.slug || draft.title);
    if (!slug) return setError('Please add a web address using letters or numbers.');
    setSaving(true);
    setError(null);
    const { id } = draft;
    const payload = {
      category_id: draft.category_id,
      title: draft.title.trim(),
      slug,
      place: draft.place,
      brief: draft.brief,
      lens: draft.lens,
      year: draft.year,
      is_visible: draft.is_visible,
      is_featured: draft.is_featured,
      featured_tag: draft.featured_tag,
    };
    const result = id
      ? await supabase.from('projects').update(payload).eq('id', id).select('id').maybeSingle()
      : await supabase.from('projects').insert({ ...payload, sort_order: nextSortOrder(items) }).select('id').maybeSingle();
    setSaving(false);
    if (result.error || !result.data) return setError(friendlyError(result.error));
    load();
    if (closeAfter) setDraft(null);
    else {
      setDraft({ ...draft, id: result.data.id, slug });
      setSlugTouched(true);
    }
  };

  const reorder = async (from: number, to: number) => {
    if (!items) return;
    const next = move(items, from, to);
    setItems(next);
    try {
      await saveOrder('projects', next);
    } catch (e) {
      setError(friendlyError(e));
      load();
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    const { error } = await supabase.from('projects').delete().eq('id', confirmDelete.id);
    setSaving(false);
    if (error) return setError(friendlyError(error));
    setConfirmDelete(null);
    load();
  };

  return (
    <div>
      <PanelHeader
        title="Projects & photos"
        description="Each project is a page of photos inside a collection. Starred projects appear in the featured strip on the home page."
        action={<Button variant="primary" onClick={() => open(newDraft())}><Plus className="w-4 h-4" /> New project</Button>}
      />

      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`px-4 h-9 rounded-full border text-[13px] transition-colors ${
              c.id === categoryId ? 'bg-[#ece8e0] text-[#0e0d0c] border-[#ece8e0]' : 'border-[#3a3732] text-[#cfc8bb] hover:border-[#8a8377]'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {error && !draft && <div className="mb-6"><Notice tone="error">{error}</Notice></div>}

      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState>No projects in this collection yet.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-4 rounded-xl border border-[#22201d] bg-[#141311] p-3 pr-4 hover:border-[#3a3732] transition-colors admin-rise">
              <button onClick={() => open({ ...p })} className="w-20 h-14 md:w-28 md:h-20 flex-none rounded-lg overflow-hidden bg-[#1f1d1a]" aria-label={`Edit ${p.title}`}>
                {p.cover && <img src={p.cover} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif text-[22px] leading-tight truncate">{p.title}</span>
                  {p.is_featured && <Star className="w-3.5 h-3.5 text-[#e0913f] fill-[#e0913f]" aria-label="Featured" />}
                  {!p.is_visible && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#26241f] px-2 py-0.5 text-[11px] text-[#b3ac9f]"><EyeOff className="w-3 h-3" /> Hidden</span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-[#8a8377] mt-1 truncate">
                  {[p.place, p.year, `${p.photoCount} photo${p.photoCount === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="flex items-center">
                <IconButton label="Move up" disabled={i === 0} onClick={() => reorder(i, i - 1)}><ArrowUp className="w-4 h-4" /></IconButton>
                <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => reorder(i, i + 1)}><ArrowDown className="w-4 h-4" /></IconButton>
                <IconButton label="Edit" onClick={() => open({ ...p })}><Pencil className="w-4 h-4" /></IconButton>
                <IconButton label="Delete" className="hover:!text-[#f0826b]" onClick={() => setConfirmDelete(p)}><Trash2 className="w-4 h-4" /></IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit project' : 'New project'}
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>{draft?.id ? 'Close' : 'Cancel'}</Button>
            {draft?.id ? (
              <Button variant="primary" loading={saving} onClick={() => save(true)}>Save</Button>
            ) : (
              <Button variant="primary" loading={saving} onClick={() => save(false)}>Create & add photos</Button>
            )}
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-6">
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Title">
              <TextInput
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: slugTouched ? draft.slug : slugify(e.target.value) })}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Collection">
                <select
                  value={draft.category_id}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                  className="w-full h-11 rounded-lg border border-[#2a2825] bg-[#121110] px-3 text-[14px] text-[#ece8e0] focus:outline-none focus:border-[#e0913f]"
                >
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Web address">
                <TextInput
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
                  }}
                />
              </Field>
              <Field label="Location">
                <TextInput value={draft.place} onChange={(e) => setDraft({ ...draft, place: e.target.value })} />
              </Field>
              <Field label="Year">
                <TextInput value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
              </Field>
            </div>
            <Field label="Lens / kit" hint='e.g. "24mm · 35mm".'>
              <TextInput value={draft.lens} onChange={(e) => setDraft({ ...draft, lens: e.target.value })} />
            </Field>
            <Field label="The brief">
              <TextArea rows={4} value={draft.brief} onChange={(e) => setDraft({ ...draft, brief: e.target.value })} />
            </Field>
            <div className="flex flex-col gap-4 rounded-xl border border-[#22201d] bg-[#121110] p-4">
              <Toggle label="Show on website" checked={draft.is_visible} onChange={(v) => setDraft({ ...draft, is_visible: v })} />
              <Toggle label="Feature on home page" checked={draft.is_featured} onChange={(v) => setDraft({ ...draft, is_featured: v })} />
              {draft.is_featured && (
                <Field label="Featured label" hint='Short tag on the home page strip, e.g. "Event" or "Portrait".'>
                  <TextInput value={draft.featured_tag} onChange={(e) => setDraft({ ...draft, featured_tag: e.target.value })} />
                </Field>
              )}
            </div>
            <Field label="Photos">
              {draft.id ? (
                <ProjectPhotos projectId={draft.id} onChange={load} />
              ) : (
                <p className="text-[13px] text-[#8a8377] m-0">Create the project first, then you can upload photos here.</p>
              )}
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        title="Delete project?"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Keep it</Button>
            <Button variant="danger" loading={saving} onClick={remove}>Delete forever</Button>
          </>
        }
      >
        <p className="text-[14px] leading-[1.5] text-[#cfc8bb] m-0">
          "{confirmDelete?.title}" and its {confirmDelete?.photoCount ?? 0} photo(s) will be permanently removed. To take it off the site temporarily, switch off "Show on website" instead.
        </p>
      </Modal>
    </div>
  );
}
