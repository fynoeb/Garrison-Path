/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Car, AlertTriangle, PenTool, Battery, Image as ImageIcon, Search, CheckCircle, ArrowRight, XCircle, Fuel, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { useService } from '../ServiceContext';
import React from 'react';

export default function RequestForm() {
  const { t, language } = useLanguage();
  const { mission, createRequest, cancelRequest, setVehicleType: setGlobalVehicleType } = useService();
  
  const [issueId, setIssueId] = useState('');
  const [vType, setVType] = useState<'car' | 'motorcycle'>('car');

  const handleTypeChange = (type: 'car' | 'motorcycle') => {
    setVType(type);
    setGlobalVehicleType(type);
  };
  const [brand, setBrand] = useState('');
  const [series, setSeries] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleName = `[${vType.toUpperCase()}] ` + ([brand, series].filter(Boolean).join(' ') || 'Unknown Unit');
    createRequest(issueId || 'General Issue', vehicleName, description, null, vType);
  };

  return (
    <div className="glass-card p-6 md:p-8 relative overflow-hidden garrison-stripes-g">
      <AnimatePresence mode="wait">
        {mission.status === 'idle' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h2 className="font-black uppercase tracking-[0.2em] text-[11px] text-garrison-blue">{t.requestTitle}</h2>
              <div className="flex gap-1">
                 <div className="w-4 h-1 bg-garrison-blue rounded-full" />
                 <div className="w-1 h-1 bg-white/10 rounded-full" />
                 <div className="w-1 h-1 bg-white/10 rounded-full" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.vehicleType}</label>
                   <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => handleTypeChange('car')}
                        className={cn(
                          "flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                          vType === 'car' ? "bg-garrison-blue border-garrison-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]" : "bg-white/5 border-white/10 text-zinc-500"
                        )}
                      >
                         {t.vehicleCar}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleTypeChange('motorcycle')}
                        className={cn(
                          "flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                          vType === 'motorcycle' ? "bg-garrison-blue border-garrison-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]" : "bg-white/5 border-white/10 text-zinc-500"
                        )}
                      >
                         {t.vehicleMotor}
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.vehicleBrand}</label>
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Shelby"
                      className="garrison-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.vehicleSeries}</label>
                    <input
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      placeholder="e.g. 2024 V8"
                      className="garrison-input"
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-zinc-600 leading-tight px-1 italic">
                  {t.vehicleHint}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.issueCategory}</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'engine', label: language === 'en' ? 'Engine' : 'Mesin', icon: PenTool },
                    { id: 'tire', label: language === 'en' ? 'Flat Tire' : 'Ban Bocor', icon: AlertTriangle },
                    { id: 'battery', label: language === 'en' ? 'Battery' : 'Aki', icon: Battery },
                    { id: 'fuel', label: t.issueFuel, icon: Fuel },
                    { id: 'other', label: language === 'en' ? 'Other' : 'Lainnya', icon: Car }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setIssueId(cat.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300",
                        issueId === cat.id
                          ? "bg-garrison-blue/10 border-garrison-blue text-garrison-blue shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                          : "bg-white/[0.03] border-white/5 text-zinc-600 hover:border-white/20 hover:text-zinc-400"
                      )}
                    >
                      <cat.icon size={18} />
                      <span className="text-[8px] font-black uppercase tracking-widest">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.description}</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descPlaceholder}
                  className="garrison-input h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.visualEvidence}</label>
                <div className="garrison-input border-dashed flex items-center justify-center gap-3 py-6 group cursor-pointer">
                  <ImageIcon className="text-zinc-600 group-hover:text-garrison-blue transition-colors" size={20} />
                  <span className="text-xs text-zinc-600 group-hover:text-zinc-400 tracking-tight transition-colors">{t.attachPhoto}</span>
                </div>
              </div>

              <button
                type="submit"
                className="garrison-btn-primary w-full py-4 text-xs tracking-[0.2em] flex items-center justify-center gap-3"
              >
                {t.dispatchBtn}
                <ArrowRight size={14} />
              </button>
            </form>
          </motion.div>
        )}

        {mission.status === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-8"
          >
            <div className="relative">
              <div className="w-32 h-32 border-2 border-white/5 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-t-2 border-garrison-blue rounded-full" 
              />
              <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-garrison-blue text-glow" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="font-black uppercase tracking-[0.3em] text-sm text-garrison-blue">{t.searchingTitle}</h3>
              <p className="text-zinc-500 font-medium text-xs tracking-tight">{t.searchingSub}</p>
            </div>
            <button
               onClick={cancelRequest}
               className="garrison-btn-secondary px-8 flex items-center gap-3"
            >
              <XCircle size={14} />
              {t.cancelRequest}
            </button>
          </motion.div>
        )}

        {(mission.status === 'confirmed' || mission.status === 'arriving' || mission.status === 'arrived') && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center space-y-8"
          >
            <div className="w-20 h-20 bg-garrison-blue/10 border border-garrison-blue/30 flex items-center justify-center rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.1)]">
              {mission.status === 'arrived' ? <CheckCircle className="text-garrison-blue text-glow" size={36} /> : <Search className="text-garrison-blue text-glow animate-pulse" size={36} />}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-black uppercase tracking-[0.3em] text-sm text-white">{t.confirmedTitle}</h3>
              <p className="text-zinc-500 font-medium text-xs max-w-xs mx-auto">
                {mission.status === 'arrived' ? 'Your helper has reached the grid coordinates.' : `Unit #${mission.id} ${t.confirmedSub}`}
              </p>
            </div>

            {mission.status === 'arrived' && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-garrison-blue/5 border border-garrison-blue/20 rounded-xl space-y-2 max-w-xs"
              >
                <div className="flex items-center gap-2 text-garrison-blue">
                   <ShieldAlert size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest leading-none">Tactical Instruction</span>
                </div>
                <p className="text-[10px] text-white font-bold leading-tight">
                  {mission.vehicleType === 'motorcycle' ? t.motoNextStep : t.carNextStep}
                </p>
              </motion.div>
            )}

            {/* Grab-style Telemetry Card */}
            <div className="glass-card p-6 w-full space-y-6 bg-white/[0.02]">
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-6">
                 <div className="text-left space-y-1">
                    <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest">{t.distance}</span>
                    <p className="text-xl font-black text-garrison-blue">{mission.distance}</p>
                 </div>
                 <div className="text-right space-y-1">
                    <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest">{t.eta}</span>
                    <p className="text-xl font-black text-white">{mission.eta}</p>
                 </div>
              </div>

              <div className="flex gap-3">
                 <a 
                   href="tel:+6221GARRISON" 
                   className="garrison-btn-secondary flex-1 py-3 flex items-center justify-center gap-2 group"
                 >
                    <ArrowRight className="rotate-[-45deg] group-hover:rotate-0 transition-transform" size={14} />
                    <span>{t.call}</span>
                 </a>
                 <div className="flex-1 flex flex-col justify-center text-left">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">System Link</span>
                    <span className="text-[10px] font-black text-garrison-blue uppercase">ONLINE</span>
                 </div>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span>{t.statusLabel}</span>
                <span className="text-garrison-blue">{mission.status.toUpperCase()}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: '0%' }}
                   animate={{ 
                     width: mission.status === 'confirmed' ? '40%' : 
                            mission.status === 'arriving' ? '80%' : '100%' 
                   }}
                   transition={{ duration: 1 }}
                   className="h-full bg-garrison-blue shadow-[0_0_10px_#00f2ff]" 
                />
              </div>
            </div>

            <button
               onClick={cancelRequest}
               className="text-[9px] uppercase tracking-[0.3em] font-black text-zinc-700 hover:text-white transition-colors"
            >
              {t.cancelRequest}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
