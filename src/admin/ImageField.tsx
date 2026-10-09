import { useRef, useState } from 'react';
import { Upload, Link2, X, ImageOff } from 'lucide-react';
import { uploadImage } from './api';
import { Button, IconButton, TextInput } from './ui';

type ImageFieldProps = {
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
};

export function ImageField({ value, onChange, aspect = '4 / 3' }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [broken, setBroken] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setBroken(false);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isLogo = aspect === 'auto';

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`relative rounded-lg overflow-hidden bg-[#1a1917] border border-[#2a2825] group ${isLogo ? 'w-full max-w-[320px] min-h-[80px] flex items-center justify-center' : 'w-full max-w-[320px]'}`}
        style={isLogo ? undefined : { aspectRatio: aspect }}
      >
        {value && !broken ? (
          <img src={value} alt="" className={isLogo ? 'max-h-[120px] max-w-full object-contain' : 'w-full h-full object-cover'} onError={() => setBroken(true)} onLoad={() => setBroken(false)} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#5d574e] text-[12px]">
            <ImageOff className="w-5 h-5" />
            {value ? 'Image could not load' : 'No image yet'}
          </div>
        )}
        {value && (
          <IconButton
            label="Remove image"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/60 opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <X className="w-4 h-4" />
          </IconButton>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[12px] text-[#ece8e0]">Uploading…</div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button type="button" size="sm" onClick={() => inputRef.current?.click()} loading={uploading}>
          <Upload className="w-3.5 h-3.5" /> Upload
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowUrl((s) => !s)}>
          <Link2 className="w-3.5 h-3.5" /> Use a link
        </Button>
      </div>
      {showUrl && (
        <TextInput
          type="url"
          placeholder="https://…"
          value={value}
          onChange={(e) => { setBroken(false); onChange(e.target.value.trim()); }}
        />
      )}
      {error && <span className="text-[12px] text-[#f0826b]">{error}</span>}
    </div>
  );
}
