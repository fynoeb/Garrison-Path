import { Home, ClipboardList, Map as MapIcon, Shield, MessageSquare, Menu, X, User, LogIn, Globe, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { useUser } from '../UserContext';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

import { useService } from '../ServiceContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';
  const { t, language, setLanguage } = useLanguage();
  const { user, role, isLoggedIn, signOut } = useUser();
  const { mission } = useService();

  const navItems = [
    { name: role === 'workshop' || role === 'fuel-partner' ? t.terminalActive : t.nav.request, path: role === 'workshop' || role === 'fuel-partner' ? '/dashboard?tab=terminal' : '/', icon: Home, show: isLoggedIn, mobile: true },
    { name: t.nav.hq, path: '/dashboard?tab=hq', icon: ClipboardList, show: (isLoggedIn && (role === 'workshop' || role === 'fuel-partner')), mobile: true },
    { name: t.nav.safety, path: '/safety', icon: Shield, show: isLoggedIn && role === 'driver', mobile: true },
    { name: t.nav.chat, path: '/chat', icon: MessageSquare, show: isLoggedIn, mobile: true },
    { name: t.nav.profile, path: '/profile', icon: User, show: isLoggedIn, mobile: true },
  ];

  const isActiveMission = mission.status !== 'idle';

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-garrison-blue/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-garrison-blue/5 blur-[120px] rounded-full" />
      </div>

      {/* Global Mission Bar */}
      <AnimatePresence>
        {isActiveMission && location.pathname !== '/' && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-[100px] left-1/2 -translate-x-1/2 z-[1500] w-[90%] max-w-sm"
          >
            <Link to="/" className="glass-card p-3 flex items-center justify-between border-garrison-blue/30 bg-garrison-blue/5 backdrop-blur-xl group">
               <div className="flex items-center gap-3">
                  <div className="status-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-garrison-blue tracking-widest">
                      {role === 'workshop' ? t.workshopStatusLabel : t.statusLabel}
                    </span>
                    <span className="text-[10px] font-bold text-white uppercase">
                      {mission.status === 'searching' 
                        ? t.searchingTitle 
                        : (role === 'workshop' ? t.workshopConfirmedTitle : t.confirmedTitle)
                      }
                    </span>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-garrison-blue text-[9px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                  {role === 'workshop' ? t.activeProtocol : t.viewTrack} <ArrowRight size={10} />
               </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-[2000] p-4 lg:p-6 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass-card px-6 py-4 border-white/5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-garrison-blue text-black flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(0,242,255,0.3)] group-hover:scale-105 transition-transform">
              <span className="font-black text-xl italic tracking-tighter">G</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-sm leading-tight group-hover:text-garrison-blue transition-colors">{t.brand}</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{t.division}</span>
            </div>
          </Link>
          
          <nav className="hidden lg:flex gap-10">
            {navItems.filter(i => i.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-[10px] uppercase tracking-[0.3em] font-black transition-all hover:text-garrison-blue flex items-center gap-2",
                  location.pathname === item.path ? "text-garrison-blue text-glow" : "text-zinc-500"
                )}
              >
                <item.icon size={12} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shrink-0">
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-3 py-1 text-[9px] font-black rounded-full transition-all",
                  language === 'en' ? "bg-garrison-blue text-black" : "text-zinc-500 hover:text-white"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('id')}
                className={cn(
                  "px-3 py-1 text-[9px] font-black rounded-full transition-all",
                  language === 'id' ? "bg-garrison-blue text-black" : "text-zinc-500 hover:text-white"
                )}
              >
                ID
              </button>
            </div>

            {isLoggedIn && (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden group-hover:border-garrison-blue/50 transition-colors bg-white/5">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600"><User size={14} /></div>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">{user?.name}</span>
                    <span className="text-[8px] font-bold text-garrison-blue/60 uppercase tracking-widest">{user?.role}</span>
                  </div>
                </Link>
                <button 
                  onClick={signOut}
                  className="p-2 border border-white/5 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white"
                  title="Sign Out"
                >
                  <LogIn className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Nav Mobile */}
      {isLoggedIn && navItems.filter(i => i.show && i.mobile).length > 0 && (
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-[3000]">
          <div className="glass-card flex items-center justify-around py-3 px-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {navItems.filter(i => i.show && i.mobile).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all flex-1",
                    isActive ? "text-garrison-blue" : "text-zinc-500"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl transition-all",
                    isActive && "bg-garrison-blue/10 text-glow"
                  )}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-6 py-6 overflow-x-hidden">
        {children}
      </main>

      {!isAuthPage && (
        <footer className="p-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
            <div className="text-[10px] uppercase font-black tracking-[0.3em]">{t.footer.services}</div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase font-black tracking-widest">{t.footer.builtBy}</span>
              <div className="w-6 h-6 bg-white/[0.05] rounded-lg flex items-center justify-center">
                <span className="italic font-black text-[10px]">G</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
