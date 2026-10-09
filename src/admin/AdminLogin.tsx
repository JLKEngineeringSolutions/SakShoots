import { useEffect, useState, type FormEvent } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Field, Notice, TextInput } from './ui';

const USERNAME_DOMAIN = 'admin.sakshoots.co.uk';
const MAX_ADMINS = 2;

function toEmail(identifier: string): string {
  const value = identifier.trim().toLowerCase();
  return value.includes('@') ? value : `${value}@${USERNAME_DOMAIN}`;
}

export function AdminLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const [slots, setSlots] = useState<number | null>(null);
  const [setupMode, setSetupMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc('admin_slots_remaining').then(({ data, error }) => {
      const remaining = !error && typeof data === 'number' ? data : 0;
      setSlots(remaining);
      setSetupMode(remaining >= MAX_ADMINS);
    });
  }, []);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
    setBusy(false);
    if (error) {
      setError('That username and password combination was not recognised.');
      return;
    }
    onSignedIn();
  };

  const createAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[a-z0-9._-]{3,}$/i.test(username.trim()) && !username.includes('@')) {
      setError('Usernames need at least 3 characters: letters, numbers, dots, dashes or underscores.');
      return;
    }
    if (password.length < 8) {
      setError('Please use a password with at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: toEmail(username), password });
    if (error || !data.session) {
      setBusy(false);
      setError(error?.message.includes('registered') ? 'That username is already taken.' : 'Could not create the account. Please try again.');
      return;
    }
    const { data: claimed, error: claimError } = await supabase.rpc('claim_first_admin');
    setBusy(false);
    if (claimError || claimed !== true) {
      await supabase.auth.signOut();
      setError('Admin sign-ups are closed. Please sign in with an existing admin account.');
      setSlots(0);
      setSetupMode(false);
      return;
    }
    onSignedIn();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0e0d0c] text-[#ece8e0]">
      <div className="hidden lg:flex relative flex-col justify-between p-12 border-r border-[#22201d] overflow-hidden">
        <img
          src="https://images.pexels.com/photos/32568165/pexels-photo-32568165.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0c] via-[#0e0d0c]/40 to-transparent" />
        <img src="/283150b1-3d59-454d-8f5e-c9239aee950c_rwc_20x0x1413x356x4096.png" alt="Sak Shoots" className="relative h-12 w-auto self-start" />
        <div className="relative flex flex-col gap-4 max-w-[440px]">
          <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#e0913f]">Studio admin</span>
          <p className="font-serif text-[48px] leading-[1.02] m-0">Every frame, every word — <em className="italic">yours</em> to edit.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[380px] flex flex-col gap-8 admin-rise">
          <div className="flex flex-col gap-3">
            <span className="w-11 h-11 rounded-full bg-[#1a1917] border border-[#2a2825] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#e0913f]" />
            </span>
            <h1 className="font-serif text-[44px] leading-none m-0">
              {setupMode ? 'Create admin account' : 'Admin sign in'}
            </h1>
            <p className="text-[14px] leading-[1.5] text-[#8a8377] m-0">
              {setupMode
                ? `Choose the username and password you will use to manage the site. ${slots === 1 ? 'This is the last admin account that can be created.' : `Up to ${MAX_ADMINS} admin accounts can be created.`}`
                : 'Sign in to manage photos, collections and page content.'}
            </p>
          </div>

          {slots === null ? (
            <div className="h-40" />
          ) : (
            <form onSubmit={setupMode ? createAdmin : signIn} className="flex flex-col gap-5">
              <Field label="Username">
                <TextInput autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </Field>
              <Field label="Password">
                <TextInput type="password" autoComplete={setupMode ? 'new-password' : 'current-password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              {setupMode && (
                <Field label="Confirm password">
                  <TextInput type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </Field>
              )}
              {error && <Notice tone="error">{error}</Notice>}
              <Button type="submit" variant="primary" loading={busy} className="h-11 mt-1">
                {setupMode ? 'Create account' : 'Sign in'} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {!!slots && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setConfirm('');
                setSetupMode((m) => !m);
              }}
              className="text-[13px] text-[#b3ac9f] hover:text-[#e0913f] transition-colors self-start -mt-4"
            >
              {setupMode ? 'Already have an admin account? Sign in' : 'Need an admin account? Create one'}
            </button>
          )}

          <a href="/" className="text-[13px] text-[#8a8377] hover:text-[#ece8e0] transition-colors self-start">← Back to the website</a>
        </div>
      </div>
    </div>
  );
}
