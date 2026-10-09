import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalizeContent, type ContentKey, type SiteContent, type TextItem } from '@/lib/content';
import { ImageField } from './ImageField';
import { ItemListEditor, StringListEditor } from './ListEditors';
import { Button, Field, Notice, PanelHeader, Spinner, TextArea, TextInput } from './ui';

type FieldDef =
  | { key: ContentKey; label: string; type: 'text' | 'textarea' | 'rich' | 'url'; hint?: string }
  | { key: ContentKey; label: string; type: 'image'; aspect?: string }
  | { key: ContentKey; label: string; type: 'list' | 'paragraphs'; addLabel?: string }
  | { key: ContentKey; label: string; type: 'items'; titleLabel: string; textLabel: string };

const RICH_HINT = 'Wrap words in *asterisks* for the orange accent, or _underscores_ for italics. New lines are kept.';

const SECTIONS: { id: string; title: string; fields: FieldDef[] }[] = [
  {
    id: 'brand', title: 'Brand', fields: [
      { key: 'brand_logo', label: 'Logo', type: 'image', aspect: 'auto', hint: 'Shown in the top-left of every page. A wide logo on a transparent or dark background works best.' },
    ],
  },
  {
    id: 'home', title: 'Home page', fields: [
      { key: 'home_hero_headline', label: 'Headline', type: 'rich', hint: RICH_HINT },
      { key: 'home_hero_intro', label: 'Intro text', type: 'textarea' },
      { key: 'home_hero_image', label: 'Hero image', type: 'image', aspect: '16 / 9' },
      { key: 'home_clients', label: 'Recent clients', type: 'list', addLabel: 'Add client' },
      { key: 'home_shoot_heading', label: '"What I shoot" heading', type: 'rich', hint: `${RICH_HINT} The three cards underneath come from the Services section.` },
      { key: 'home_frames_heading', label: 'Featured frames heading', type: 'rich', hint: 'Pick which projects appear here by marking them "Featured" under Projects & photos.' },
      { key: 'home_kit_heading', label: 'Kit teaser heading', type: 'rich', hint: `${RICH_HINT} Shown in the kit strip on the home page. The gear comes from the Equipment section.` },
      { key: 'home_kit_blurb', label: 'Kit teaser text', type: 'textarea' },
      { key: 'home_approach_image', label: 'Approach portrait', type: 'image', aspect: '4 / 5' },
      { key: 'home_approach_quote', label: 'Approach quote', type: 'rich', hint: RICH_HINT },
      { key: 'home_approach_text', label: 'Approach text', type: 'textarea' },
    ],
  },
  {
    id: 'about', title: 'About page', fields: [
      { key: 'about_headline', label: 'Headline', type: 'rich', hint: RICH_HINT },
      { key: 'about_image', label: 'Portrait', type: 'image', aspect: '4 / 5' },
      { key: 'about_image_caption', label: 'Portrait caption', type: 'text' },
      { key: 'about_body', label: 'Biography paragraphs', type: 'paragraphs', addLabel: 'Add paragraph' },
      { key: 'about_kit', label: 'In the bag', type: 'items', titleLabel: 'Lens (e.g. 35mm)', textLabel: 'Label (e.g. SPACES)' },
    ],
  },
  {
    id: 'services', title: 'Services page', fields: [
      { key: 'services_headline', label: 'Headline', type: 'rich', hint: RICH_HINT },
      { key: 'services_intro', label: 'Intro text', type: 'textarea' },
      { key: 'services_steps', label: 'How it works steps', type: 'items', titleLabel: 'Step name', textLabel: 'Description' },
    ],
  },
  {
    id: 'kit', title: 'Kit page', fields: [
      { key: 'kit_headline', label: 'Headline', type: 'rich', hint: RICH_HINT },
      { key: 'kit_intro', label: 'Intro text', type: 'textarea' },
      { key: 'kit_camera_heading', label: 'Camera section heading', type: 'rich', hint: RICH_HINT },
      { key: 'kit_lenses_heading', label: 'Lenses section heading', type: 'rich', hint: RICH_HINT },
      { key: 'kit_support_heading', label: 'Light & support heading', type: 'rich', hint: RICH_HINT },
      { key: 'kit_cta_eyebrow', label: 'Closing label', type: 'text' },
      { key: 'kit_cta_headline', label: 'Closing headline', type: 'rich', hint: RICH_HINT },
    ],
  },
  {
    id: 'contact', title: 'Contact & call to action', fields: [
      { key: 'contact_headline', label: 'Contact headline', type: 'rich', hint: RICH_HINT },
      { key: 'contact_intro', label: 'Contact intro', type: 'textarea' },
      { key: 'contact_thanks', label: 'Message after sending an enquiry', type: 'textarea' },
      { key: 'cta_eyebrow', label: 'Booking label', type: 'text', hint: 'Small label above the big call to action, e.g. "Now booking 2026–27".' },
      { key: 'cta_headline', label: 'Call to action headline', type: 'rich', hint: RICH_HINT },
    ],
  },
  {
    id: 'links', title: 'Links & footer', fields: [
      { key: 'link_email', label: 'Contact email', type: 'text' },
      { key: 'link_instagram', label: 'Instagram link', type: 'url' },
      { key: 'link_youtube', label: 'YouTube link', type: 'url' },
      { key: 'link_prints', label: 'Prints shop link', type: 'url' },
      { key: 'link_journal', label: 'Journal link', type: 'url' },
      { key: 'footer_credit', label: 'Footer credit', type: 'text' },
    ],
  },
];

export function ContentPanel() {
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [section, setSection] = useState(SECTIONS[0].id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    supabase.from('site_content').select('key, value').then(({ data, error }) => {
      if (error) {
        setError('Could not load the page content. Please refresh.');
        return;
      }
      const content = normalizeContent(data ?? []);
      setSaved(content);
      setDraft(content);
    });
  }, []);

  const changedKeys = useMemo(() => {
    if (!saved || !draft) return [];
    return (Object.keys(draft) as ContentKey[]).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(saved[k]));
  }, [saved, draft]);

  if (!draft) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  const set = (key: ContentKey, value: unknown) => {
    setJustSaved(false);
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const rows = changedKeys.map((key) => {
      const value = draft[key];
      const cleaned = Array.isArray(value)
        ? (value as (string | TextItem)[]).filter((v) => (typeof v === 'string' ? v.trim() : v.title.trim() || v.text.trim()))
        : value;
      return { key, value: cleaned, updated_at: new Date().toISOString() };
    });
    const { error } = await supabase.from('site_content').upsert(rows);
    setSaving(false);
    if (error) {
      setError('Could not save your changes. Please try again.');
      return;
    }
    const next = { ...draft };
    rows.forEach((r) => ((next as Record<string, unknown>)[r.key] = r.value));
    setSaved(next);
    setDraft(next);
    setJustSaved(true);
  };

  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <div>
      <PanelHeader title="Page content" description="Headlines, text, images and links used across the website." />

      <div className="flex gap-2 flex-wrap mb-8">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 h-9 rounded-full border text-[13px] transition-colors ${
              s.id === section ? 'bg-[#ece8e0] text-[#0e0d0c] border-[#ece8e0]' : 'border-[#3a3732] text-[#cfc8bb] hover:border-[#8a8377]'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div key={current.id} className="flex flex-col gap-7 rounded-2xl border border-[#22201d] bg-[#141311] p-[clamp(20px,3vw,32px)] admin-rise">
        {current.fields.map((f) => (
          <FieldEditor key={f.key} def={f} value={draft[f.key]} onChange={(v) => set(f.key, v)} />
        ))}
      </div>

      <div className="sticky bottom-0 mt-6 -mx-2 px-2 py-4 bg-gradient-to-t from-[#0e0d0c] via-[#0e0d0c] to-transparent flex flex-wrap items-center justify-end gap-3">
        {error && <span className="text-[13px] text-[#f0826b] mr-auto">{error}</span>}
        {justSaved && changedKeys.length === 0 && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#9fd8b0] admin-fade"><Check className="w-4 h-4" /> Saved — live on the website</span>
        )}
        {changedKeys.length > 0 && (
          <>
            <span className="text-[13px] text-[#8a8377]">{changedKeys.length} unsaved change{changedKeys.length === 1 ? '' : 's'}</span>
            <Button variant="ghost" onClick={() => setDraft(saved)}>Discard</Button>
          </>
        )}
        <Button variant="primary" onClick={save} loading={saving} disabled={changedKeys.length === 0}>Save changes</Button>
      </div>
    </div>
  );
}

function FieldEditor({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  switch (def.type) {
    case 'image':
      return <Field label={def.label}><ImageField value={value as string} onChange={onChange} aspect={def.aspect} /></Field>;
    case 'list':
      return <Field label={def.label}><StringListEditor value={value as string[]} onChange={onChange} addLabel={def.addLabel} /></Field>;
    case 'paragraphs':
      return <Field label={def.label}><StringListEditor value={value as string[]} onChange={onChange} addLabel={def.addLabel} multiline /></Field>;
    case 'items':
      return <Field label={def.label}><ItemListEditor value={value as TextItem[]} onChange={onChange} titleLabel={def.titleLabel} textLabel={def.textLabel} /></Field>;
    case 'textarea':
    case 'rich':
      return (
        <Field label={def.label} hint={def.hint}>
          <TextArea value={value as string} onChange={(e) => onChange(e.target.value)} rows={def.type === 'rich' ? 2 : 3} />
        </Field>
      );
    default:
      return (
        <Field label={def.label} hint={def.hint}>
          <TextInput type={def.type === 'url' ? 'url' : 'text'} value={value as string} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
  }
}
