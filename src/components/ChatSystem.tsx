/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Send, ShieldCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useLanguage } from '../LanguageContext';
import { useService } from '../ServiceContext';
import { useUser } from '../UserContext';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';

export default function ChatSystem() {
  const { t } = useLanguage();
  const { mission, sendMessage } = useService();
  const { role } = useUser();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mission.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(input, role === 'driver' ? 'user' : 'mechanic');
    setInput('');
  };

  if (mission.status === 'idle') {
    return (
      <div className="glass-card flex flex-col h-[500px] items-center justify-center p-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-600">
          <ShieldCheck size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400">No Active Link</h3>
          <p className="text-xs text-zinc-600 max-w-xs">{role === 'driver' ? 'Submit a mission request to establish an encrypted link with a mechanic.' : 'Wait for an incoming signal to open a secure channel.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col h-[600px] overflow-hidden relative">
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
            <h3 className="font-black text-sm uppercase tracking-widest text-glow">{t.chatTitle}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-600 tracking-tighter uppercase">{t.encrypted}</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right">
           <div className="text-[10px] font-black text-garrison-blue uppercase tracking-widest">{mission.id || 'SEC_LINK'}</div>
           <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Authenticated Perspective: {role.toUpperCase()}</div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {mission.messages.length > 0 ? (
            mission.messages.map((m) => {
              const isOwnMessage = (role === 'driver' && m.sender === 'user') || (role === 'workshop' && m.sender === 'mechanic');
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
                      {m.sender === 'mechanic' ? t.operative : t.user}
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
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">Establishing Sync...</span>
            </div>
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
