import { useState, useCallback } from 'react';
import { useReveal } from '@/hooks/useReveal';
import { supabase } from '@/lib/supabase';
import { TYPES, BUDGETS } from '@/data/layout';
import { useSiteData } from '@/context/SiteData';
import { RichText } from '@/components/RichText';

type ContactProps = {
  go: (page: string) => void;
};

export function Contact({ go }: ContactProps) {
  const ref = useReveal<HTMLDivElement>();
  const { content } = useSiteData();
  const [type, setType] = useState(0);
  const [budget, setBudget] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    business: '',
    ideal_date: '',
    brief: '',
  });

  const handleChange = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('enquiries').insert({
        name: form.name,
        email: form.email,
        business: form.business || null,
        ideal_date: form.ideal_date || null,
        project_type: TYPES[type] || null,
        budget: budget != null ? BUDGETS[budget] : null,
        brief: form.brief || null,
      });

      if (insertError) throw insertError;
      setSent(true);
    } catch {
      setError('Something went wrong sending your enquiry. Please try again or email directly.');
    } finally {
      setSubmitting(false);
    }
  }, [form, type, budget]);

  const chip = (on: boolean) => ({
    background: on ? '#ece8e0' : 'transparent',
    color: on ? '#0e0d0c' : '#ece8e0',
  });

  return (
    <div ref={ref}>
      <main className="px-[clamp(20px,4vw,56px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(72px,9vw,120px)] grid gap-16 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' }}>
        {/* Left column */}
        <div className="reveal flex flex-col gap-7">
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#8a8377]">Enquire{content.cta_eyebrow ? ` · ${content.cta_eyebrow}` : ''}</span>
          <h1 className="font-serif text-[clamp(56px,7.4vw,112px)] leading-[0.92] tracking-[-0.025em] m-0">
            <RichText text={content.contact_headline} />
          </h1>
          <p className="text-[17px] leading-[1.7] text-[#b3ac9f] m-0 max-w-[440px]">
            {content.contact_intro}
          </p>
          <div className="flex flex-col gap-3.5 border-t border-[#2a2825] pt-6 text-[15px]">
            {content.link_email && (
              <a href={`mailto:${content.link_email}`} className="font-serif text-[30px] link-hover break-all">{content.link_email}</a>
            )}
            <div className="flex gap-[22px] text-[#b3ac9f]">
              {content.link_instagram && <a href={content.link_instagram} target="_blank" rel="noopener noreferrer" className="link-hover">Instagram ↗</a>}
              {content.link_youtube && <a href={content.link_youtube} target="_blank" rel="noopener noreferrer" className="link-hover">YouTube ↗</a>}
            </div>
            <span className="font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">BRISTOL · TRAVELLING UK-WIDE</span>
          </div>
        </div>

        {/* Form card */}
        <div className="reveal bg-[#161513] border border-[#2a2825] p-[clamp(24px,3vw,40px)]">
          {!sent ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
              {/* Type chips */}
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">01 — WHAT DO YOU NEED?</span>
                <div className="flex gap-2 flex-wrap">
                  {TYPES.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setType(i)}
                      className="px-4 py-2.5 rounded-full border text-sm link-hover"
                      style={{ border: '1px solid #3a3732', ...chip(type === i) }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget chips */}
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">02 — BUDGET</span>
                <div className="flex gap-2 flex-wrap">
                  {BUDGETS.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setBudget(i)}
                      className="px-4 py-2.5 rounded-full border text-sm link-hover"
                      style={{ border: '1px solid #3a3732', ...chip(budget === i) }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text fields */}
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {[
                  { key: 'name', label: 'NAME', placeholder: 'Your name', required: true, type: 'text' },
                  { key: 'email', label: 'EMAIL', placeholder: 'you@business.com', required: true, type: 'email' },
                  { key: 'business', label: 'BUSINESS / VENUE', placeholder: 'Optional', required: false, type: 'text' },
                  { key: 'ideal_date', label: 'IDEAL DATE', placeholder: 'e.g. early November', required: false, type: 'text' },
                ].map((field) => (
                  <label key={field.key} className="flex flex-col gap-2">
                    <span className="font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">{field.label}</span>
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="bg-transparent border-none border-b border-[#3a3732] py-2.5 text-[#ece8e0] text-base focus:border-[#e0913f] transition-colors"
                      style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#3a3732', outline: 'none' }}
                    />
                  </label>
                ))}
              </div>

              {/* Brief */}
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[11px] tracking-[0.1em] text-[#8a8377]">THE BRIEF</span>
                <textarea
                  rows={4}
                  placeholder="Where, what, and where the images will be used."
                  value={form.brief}
                  onChange={(e) => handleChange('brief', e.target.value)}
                  className="bg-transparent border-none border-b border-[#3a3732] py-2.5 text-[#ece8e0] text-base resize-y focus:border-[#e0913f] transition-colors"
                  style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#3a3732', outline: 'none' }}
                />
              </label>

              {error && (
                <p className="text-sm text-[#e0913f]">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="self-start bg-[#e0913f] text-[#0e0d0c] border-none px-[30px] py-4 rounded-full text-[15px] font-medium cursor-pointer link-hover disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send enquiry →'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-[18px] py-10">
              <span className="font-mono text-[11px] tracking-[0.12em] text-[#e0913f]">● FRAME CAPTURED</span>
              <span className="font-serif text-[56px] leading-none">Thank you.</span>
              <span className="text-[16px] leading-[1.6] text-[#b3ac9f]">{content.contact_thanks}</span>
              <button onClick={() => go('work')} className="text-sm border-b border-current pb-[3px] self-start link-hover">
                Browse the portfolio meanwhile →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
