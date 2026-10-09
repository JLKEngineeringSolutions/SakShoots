import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Link2, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Equipment, ProjectImage } from '@/lib/content';
import { friendlyError, move, nextSortOrder, saveOrder, uploadImage } from './api';
import { Button, IconButton, Notice, Spinner, TextInput } from './ui';

export function ProjectPhotos({ projectId, onChange }: { projectId: string; onChange: () => void }) {
  const [images, setImages] = useState<ProjectImage[] | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [url, setUrl] = useState('');
  const [showUrl, setShowUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('project_images').select('*').eq('project_id', projectId).order('sort_order');
    if (error) return setError('Could not load photos.');
    setImages(data as ProjectImage[]);
  }, [projectId]);

  useEffect(() => {
    load();
    supabase.from('equipment').select('*').order('sort_order').then(({ data }) => setEquipment((data as Equipment[]) ?? []));
  }, [load]);

  if (!images) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  const insert = async (urls: string[]) => {
    const start = nextSortOrder(images);
    const { error } = await supabase
      .from('project_images')
      .insert(urls.map((u, i) => ({ project_id: projectId, url: u, sort_order: start + i })));
    if (error) throw error;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files);
    const urls: string[] = [];
    setUploading({ done: 0, total: list.length });
    try {
      for (const file of list) {
        urls.push(await uploadImage(file));
        setUploading({ done: urls.length, total: list.length });
      }
    } catch (e) {
      setError(friendlyError(e));
    }
    try {
      if (urls.length) await insert(urls);
    } catch (e) {
      setError(friendlyError(e));
    }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = '';
    await load();
    onChange();
  };

  const addUrl = async () => {
    const value = url.trim();
    if (!/^https?:\/\//i.test(value)) return setError('Please paste a full image link starting with https://');
    setError(null);
    try {
      await insert([value]);
      setUrl('');
      setShowUrl(false);
      await load();
      onChange();
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const reorder = async (from: number, to: number) => {
    const next = move(images, from, to);
    setImages(next);
    try {
      await saveOrder('project_images', next);
      onChange();
    } catch (e) {
      setError(friendlyError(e));
      load();
    }
  };

  const remove = async (id: string) => {
    setImages(images.filter((i) => i.id !== id));
    const { error } = await supabase.from('project_images').delete().eq('id', id);
    if (error) setError(friendlyError(error));
    await load();
    onChange();
  };

  const tag = async (id: string, equipmentId: string | null) => {
    setImages(images.map((img) => (img.id === id ? { ...img, equipment_id: equipmentId } : img)));
    const { error } = await supabase.from('project_images').update({ equipment_id: equipmentId }).eq('id', id);
    if (error) {
      setError(friendlyError(error));
      load();
      return;
    }
    onChange();
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <Notice tone="error">{error}</Notice>}
      {images.length === 0 ? (
        <p className="text-[13px] text-[#8a8377] m-0">No photos yet. The first photo is used as the project's lead image.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div key={img.id} className="group relative rounded-lg overflow-hidden bg-[#1f1d1a] admin-fade flex flex-col">
              <div className="relative aspect-[4/3]">
                <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-[#0e0d0c]/80 px-2 py-0.5 font-mono text-[10px] text-[#e0913f]">LEAD</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <div className="flex">
                    <IconButton label="Move earlier" disabled={i === 0} onClick={() => reorder(i, i - 1)}><ArrowLeft className="w-3.5 h-3.5" /></IconButton>
                    <IconButton label="Move later" disabled={i === images.length - 1} onClick={() => reorder(i, i + 1)}><ArrowRight className="w-3.5 h-3.5" /></IconButton>
                  </div>
                  <IconButton label="Remove photo" className="hover:!text-[#f0826b]" onClick={() => remove(img.id)}><Trash2 className="w-3.5 h-3.5" /></IconButton>
                </div>
              </div>
              {equipment.length > 0 && (
                <select
                  value={img.equipment_id ?? ''}
                  onChange={(e) => tag(img.id, e.target.value || null)}
                  className="w-full h-9 bg-[#121110] border-t border-[#2a2825] px-2 text-[12px] text-[#cfc8bb] focus:outline-none focus:text-[#ece8e0]"
                  title="Tag the lens or gear this photo was shot on"
                >
                  <option value="">Shot on… (untagged)</option>
                  {equipment.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" loading={!!uploading} onClick={() => fileRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" />
          {uploading ? `Uploading ${uploading.done}/${uploading.total}` : 'Upload photos'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowUrl((s) => !s)}><Link2 className="w-3.5 h-3.5" /> Add from a link</Button>
      </div>
      {showUrl && (
        <div className="flex gap-2 admin-fade">
          <TextInput placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrl()} />
          <Button size="sm" variant="primary" onClick={addUrl}>Add</Button>
        </div>
      )}
    </div>
  );
}
