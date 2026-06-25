/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Send, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useLanguage } from '../LanguageContext';
import { useService } from '../ServiceContext';
import { useUser } from '../UserContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import React from 'react';

export default function ChatSystem() {
  const { t } = useLanguage();
  const { mission, sendMessage } = useService();
  const { role, user } = useUser();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mission.messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(input, role === 'driver' ? 'user' : 'mechanic');
    setInput('');
  };

  if (mission.status === 'idle') {
    return (
      <div className="glass-card flex flex-col h-[500px] items-center justify-center p-12 text-center space-y-8 animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-600">
          <ShieldCheck size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400">{t.noActiveChat}</h3>
          <p className="text-xs text-zinc-600 max-w-xs mx-auto">
            {role === 'driver' 
              ? 'Silakan buat permintaan bantuan untuk terhubung dengan montir kami.' 
              : 'Menunggu pesanan bantuan untuk membuka saluran chat.'}
          </p>
        </div>
        {role === 'driver' && (
          <button 
            onClick={() => navigate('/')}
            className="garrison-btn-primary px-8 py-4 flex items-center gap-3 text-xs tracking-widest"
          >
            {t.goToRequest}
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col h-[600px] overflow-hidden relative animate-slide-up">
      {/* Chat Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-garrison-blue/10 border border-garrison-blue/20 flex items-center justify-center">
              <ShieldCheck className="text-garrison-blue" size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 status-pulse border-2 border-[#050505]" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest text-glow">
              {role !== 'driver' ? `Mogok: ${mission.vehicle || 'Pengemudi'}` : t.chatTitle}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-600 tracking-tighter uppercase">
                {role !== 'driver' ? (mission.issue || t.encrypted) : t.encrypted}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right">
           <div className="text-[10px] font-black text-garrison-blue uppercase tracking-widest">{mission.id || 'LINK_ID'}</div>
           <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">{t.currentRole}: {role.toUpperCase()}</div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {mission.messages && mission.messages.length > 0 ? (
            mission.messages.map((m) => {
              // m.senderRole is 'driver', 'workshop', or 'operative'
              const isOwnMessage = m.senderId === user?.id;
              
              const getSenderLabel = (m: any) => {
                if (m.senderId === mission.driverId) return t.user;
                if (m.senderRole === 'fuel-partner') return t.fuelPartner;
                if (m.senderRole === 'workshop') return t.operative;
                return t.operative;
              };

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    isOwnMessage ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                      {getSenderLabel(m)}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-3xl text-sm leading-relaxed",
                    isOwnMessage 
                      ? "bg-garrison-blue text-black font-bold shadow-[0_10px_30px_rgba(0,242,255,0.1)] rounded-tr-none"
                      : "bg-white/[0.05] text-zinc-200 border border-white/5 rounded-tl-none"
                  )}>
                    {m.text}
                  </div>
                  <span className="text-[8px] mt-2 font-bold text-zinc-700">{m.timestamp}</span>
                </motion.div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
               <ShieldCheck size={48} className="mb-4" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t.dispatchStatus}</span>
            </div>
          )}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-zinc-600 ml-1"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-garrison-blue/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-garrison-blue/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-garrison-blue/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">{t.mechanicTyping}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-6 bg-white/[0.02] border-t border-white/5">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.typeMessage}
            className="garrison-input pr-16 bg-white/[0.03]"
          />
          <button
            type="submit"
            className="absolute right-2 p-2 bg-garrison-blue text-black rounded-xl hover:scale-105 transition-transform"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
