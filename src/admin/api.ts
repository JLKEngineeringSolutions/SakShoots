import { supabase } from '@/lib/supabase';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Please choose a JPG, PNG, WebP, GIF or AVIF image.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('That image is over 15MB. Please use a smaller file.');

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
  });
  if (error) throw new Error('Upload failed. Please try again.');
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

type Ordered = { id: string; sort_order: number };

export async function saveOrder(table: string, items: Ordered[]): Promise<void> {
  const results = await Promise.all(
    items.map((item, i) => supabase.from(table).update({ sort_order: i }).eq('id', item.id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function nextSortOrder(items: Ordered[]): number {
  return items.reduce((max, i) => Math.max(max, i.sort_order), -1) + 1;
}

export function friendlyError(err: unknown): string {
  const message =
    err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' ? err.message : '';
  if (/duplicate key|unique/i.test(message)) return 'That web address is already used. Please choose a different one.';
  if (message && !/row-level security|permission|jwt/i.test(message)) return message;
  return 'Something went wrong saving your changes. Please try again.';
}
