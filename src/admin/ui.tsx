import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { X, Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#ece8e0] text-[#0e0d0c] hover:bg-white',
  secondary: 'border border-[#3a3732] text-[#ece8e0] hover:border-[#8a8377] hover:bg-[#1f1d1a]',
  ghost: 'text-[#b3ac9f] hover:text-[#ece8e0] hover:bg-[#1f1d1a]',
  danger: 'text-[#f0826b] hover:bg-[#3a1d17] hover:text-[#ffb3a3]',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  size?: 'sm' | 'md';
};

export function Button({ variant = 'secondary', loading, size = 'md', className = '', children, disabled, ...rest }: ButtonProps) {
  const sizing = size === 'sm' ? 'h-8 px-3 text-[12px]' : 'h-10 px-4 text-[13px]';
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] ${sizing} ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({ label, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-full text-[#b3ac9f] hover:text-[#ece8e0] hover:bg-[#26241f] transition-colors disabled:opacity-30 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#8a8377]">{label}</span>
      {children}
      {hint && <span className="text-[12px] leading-[1.5] text-[#6f695f]">{hint}</span>}
    </label>
  );
}

const inputBase = 'w-full bg-[#0e0d0c] border border-[#2a2825] rounded-lg px-3.5 text-[14px] text-[#ece8e0] placeholder:text-[#5d574e] outline-none transition-colors focus:border-[#e0913f] focus:ring-2 focus:ring-[#e0913f]/20';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} h-10 ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputBase} py-2.5 leading-[1.5] resize-y ${props.className ?? ''}`} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 text-[13px] text-[#cfc8bb] group"
    >
      <span className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-[#e0913f]' : 'bg-[#3a3732]'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[#ece8e0] shadow transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`} />
      </span>
      {label}
    </button>
  );
}

export function Modal({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm admin-fade" onClick={onClose} />
      <div className="relative w-full max-w-[560px] h-full bg-[#141311] border-l border-[#2a2825] flex flex-col admin-slide">
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#22201d] flex-none">
          <h2 className="font-serif text-[26px] leading-none m-0">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X className="w-4 h-4" /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#22201d] flex-none">{footer}</div>}
      </div>
    </div>
  );
}

export function PanelHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-[clamp(36px,4vw,48px)] leading-none m-0">{title}</h1>
        {description && <p className="text-[14px] leading-[1.5] text-[#8a8377] m-0 max-w-[560px]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const styles = tone === 'error'
    ? 'border-[#5a2a20] bg-[#2a1611] text-[#f5a898]'
    : 'border-[#274a33] bg-[#122219] text-[#9fd8b0]';
  return <div className={`rounded-lg border px-4 py-3 text-[13px] leading-[1.5] ${styles}`}>{children}</div>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[#8a8377]" />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#2a2825] px-6 py-14 text-center text-[14px] text-[#8a8377]">
      {children}
    </div>
  );
}
