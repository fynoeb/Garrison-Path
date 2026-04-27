/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useUser } from '../UserContext';
import { useLanguage } from '../LanguageContext';
import { LogIn, ShieldCheck, Fuel, User, Wrench } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, isLoggedIn, isLoading, user, updateProfile } = useUser();
  const { t } = useLanguage();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [mode, setMode] = useState<'login' | 'signup' | 'roleSelection' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('driver');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  React.useEffect(() => {
    let interval: any;
    if (isLoadingAction) {
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isLoadingAction]);

  // Handle new Google users who haven't picked a role
  React.useEffect(() => {
    // Only redirect to roleSelection if:
    // 1. User is logged in and isNew is true (e.g. first time Google)
    // 2. User doesn't already have a role assigned
    // 3. We are NOT currently in signup mode (where they pick a role anyway)
    if (user?.isNew && !user?.role && mode !== 'roleSelection' && mode !== 'signup') {
      setMode('roleSelection');
    }
  }, [user, mode]);

  if (user && !user.isNew && user.role && mode !== 'roleSelection') {
    return <Navigate to={from} replace />;
  }

  if (isLoading || isLoadingAction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 flex-col gap-6">
        <div className="w-12 h-12 border-4 border-garrison-blue border-t-transparent rounded-full animate-spin" />
        {loadingTime > 8 && (
          <div className="text-center animate-in fade-in duration-500 px-8">
             <p className="text-white text-[10px] font-black uppercase tracking-widest mb-2">Memeriksa Koneksi...</p>
             <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest max-w-[200px] mx-auto">
                {loadingTime > 15 
                  ? "Terdeteksi keterlambatan jaringan. Pastikan koneksi stabil atau coba muat ulang halaman." 
                  : "Hampir selesai, mohon tunggu sebentar lagi..."}
             </p>
          </div>
        )}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoadingAction(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, name, role);
      } else if (mode === 'roleSelection') {
        await updateProfile({ role, isNew: false } as any);
      } else if (mode === 'forgotPassword') {
        await sendPasswordReset(email);
        setSuccess(t.resetEmailSent);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
      {/* Tactical Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-garrison-blue/5 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px] -ml-24 -mb-24" />
      
      <div className="max-w-md w-full glass-card p-8 md:p-12 space-y-8 animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)] transform -rotate-3 hover:rotate-0 transition-transform">
            <LogIn className="w-8 h-8 text-black" />
          </div>
          <div className="space-y-1 mt-6">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
              {mode === 'roleSelection' ? 'Pilih Peran Anda' : 
               mode === 'forgotPassword' ? t.resetPassword : 
               mode === 'login' ? 'Masuk Dashboard' : 'Daftar Akun'}
            </h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black">
              {mode === 'roleSelection' ? 'Pilih apakah Anda pengemudi atau bengkel' : 
               mode === 'forgotPassword' ? 'Masukkan email pemulihan' :
               mode === 'login' ? 'Silahkan masuk ke akun Anda' : 'Lengkapi data diri Anda'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                {error}
              </div>
              {error.toLowerCase().includes('terdaftar') && (
                <button 
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 transition-colors border border-red-500/30 text-white font-black uppercase tracking-widest text-[8px]"
                >
                  Daftar Akun Baru Sekarang
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              {success}
            </div>
          )}

          {mode === 'roleSelection' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'driver', label: 'Driver / Pengguna', icon: User, desc: 'Butuh bantuan di jalan' },
                  { id: 'workshop', label: 'Bengkel / Mekanik', icon: Wrench, desc: 'Memberi layanan perbaikan' },
                  { id: 'fuel-partner', label: 'Fuel Partner', icon: Fuel, desc: 'Layanan antar bensin' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as UserRole)}
                    className={cn(
                      "p-4 border-2 transition-all flex items-center gap-4 text-left group",
                      role === item.id ? "border-garrison-blue bg-garrison-blue/5" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      role === item.id ? "bg-garrison-blue text-white" : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700"
                    )}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <div className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1", role === item.id ? "text-white" : "text-zinc-500")}>
                        {item.label}
                      </div>
                      <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button 
                type="submit"
                className="w-full h-14 bg-garrison-blue text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-[0_4px_20px_rgba(0,242,255,0.2)] font-black"
              >
                Konfirmasi Peran & Selesaikan Profil
              </button>
            </div>
          ) : (
            <>
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 bg-zinc-900/50 border border-zinc-800 focus:border-garrison-blue outline-none px-4 text-white font-medium"
                    placeholder="Masukkan Nama"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alamat E-Mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-zinc-900/50 border border-zinc-800 focus:border-garrison-blue outline-none px-4 text-white font-medium"
                  placeholder="nama@email.com"
                />
              </div>

              {mode !== 'forgotPassword' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kata Sandi</label>
                    {mode === 'login' && (
                      <button 
                        type="button"
                        onClick={() => setMode('forgotPassword')}
                        className="text-[9px] font-black text-garrison-blue uppercase tracking-widest hover:underline"
                      >
                        {t.forgotPassword}
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 bg-zinc-900/50 border border-zinc-800 focus:border-garrison-blue outline-none px-4 text-white font-medium"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Jenis Akun</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('driver')}
                      className={cn(
                        "py-3 border text-[9px] font-black uppercase tracking-widest transition-all",
                        role === 'driver' ? "bg-white text-black border-white" : "text-zinc-500 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      Driver
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('workshop')}
                      className={cn(
                        "py-3 border text-[9px] font-black uppercase tracking-widest transition-all",
                        role === 'workshop' ? "bg-white text-black border-white" : "text-zinc-500 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      Bengkel
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('fuel-partner')}
                      className={cn(
                        "py-3 border text-[9px] font-black uppercase tracking-widest transition-all",
                        role === 'fuel-partner' ? "bg-white text-black border-white" : "text-zinc-500 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      Bensin
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
              >
                {mode === 'login' ? 'Masuk Sekarang' : 
                 mode === 'signup' ? 'Daftar Akun' : t.sendResetLink}
              </button>

              <>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-900"></div></div>
                  <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em] text-zinc-700 bg-zinc-950 px-4">ATAU</div>
                </div>

                <button 
                  type="button"
                  onClick={signInWithGoogle}
                  className="w-full h-14 border border-zinc-800 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all flex items-center justify-center gap-3 transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-3 h-3 grayscale opacity-60" alt="Google" />
                  Masuk dengan Google
                </button>
              </>

              <p className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'forgotPassword') setMode('login');
                    else setMode(mode === 'login' ? 'signup' : 'login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-widest transition-colors underline underline-offset-4"
                >
                  {mode === 'login' ? 'Belum punya akun? Daftar di sini' : 
                   mode === 'forgotPassword' ? t.backToLogin :
                   'Sudah punya akun? Masuk'}
                </button>
              </p>
            </>
          )}
        </form>

        <div className="pt-6 border-t border-zinc-900 flex justify-center gap-8 opacity-40">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-zinc-500" />
              <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Encrypted</span>
           </div>
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-zinc-500" />
              <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Verified</span>
           </div>
        </div>
      </div>
    </div>
  );
}
