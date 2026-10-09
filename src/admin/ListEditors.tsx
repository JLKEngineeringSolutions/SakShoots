import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { TextItem } from '@/lib/content';
import { move } from './api';
import { Button, IconButton, TextArea, TextInput } from './ui';

function RowControls({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex flex-none items-center">
      <IconButton label="Move up" onClick={() => onMove(index - 1)} disabled={index === 0}><ArrowUp className="w-3.5 h-3.5" /></IconButton>
      <IconButton label="Move down" onClick={() => onMove(index + 1)} disabled={index === count - 1}><ArrowDown className="w-3.5 h-3.5" /></IconButton>
      <IconButton label="Remove" onClick={onRemove} className="hover:!text-[#f0826b]"><Trash2 className="w-3.5 h-3.5" /></IconButton>
    </div>
  );
}

export function StringListEditor({ value, onChange, multiline, addLabel = 'Add item' }: { value: string[]; onChange: (v: string[]) => void; multiline?: boolean; addLabel?: string }) {
  const update = (i: number, text: string) => onChange(value.map((v, j) => (j === i ? text : v)));
  return (
    <div className="flex flex-col gap-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {multiline ? (
            <TextArea value={item} onChange={(e) => update(i, e.target.value)} rows={3} />
          ) : (
            <TextInput value={item} onChange={(e) => update(i, e.target.value)} />
          )}
          <RowControls
            index={i}
            count={value.length}
            onMove={(to) => onChange(move(value, i, to))}
            onRemove={() => onChange(value.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <Button type="button" size="sm" variant="ghost" className="self-start" onClick={() => onChange([...value, ''])}>
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

export function ItemListEditor({ value, onChange, titleLabel, textLabel }: { value: TextItem[]; onChange: (v: TextItem[]) => void; titleLabel: string; textLabel: string }) {
  const update = (i: number, patch: Partial<TextItem>) => onChange(value.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  return (
    <div className="flex flex-col gap-3">
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-[#22201d] bg-[#121110] p-3">
          <div className="flex-1 grid gap-2">
            <TextInput placeholder={titleLabel} value={item.title} onChange={(e) => update(i, { title: e.target.value })} />
            <TextArea placeholder={textLabel} rows={2} value={item.text} onChange={(e) => update(i, { text: e.target.value })} />
          </div>
          <RowControls
            index={i}
            count={value.length}
            onMove={(to) => onChange(move(value, i, to))}
            onRemove={() => onChange(value.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <Button type="button" size="sm" variant="ghost" className="self-start" onClick={() => onChange([...value, { title: '', text: '' }])}>
        <Plus className="w-3.5 h-3.5" /> Add
      </Button>
    </div>
  );
}
