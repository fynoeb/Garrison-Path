/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useUser } from '../UserContext';
import { useLanguage } from '../LanguageContext';
import { User, Shield, Car, Phone, Mail, RefreshCw, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useService } from '../ServiceContext';

export default function Profile() {
  const { user, role, switchRole, updateProfile } = useUser();
  const { detectLocation } = useService();
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);

  const handleSync = () => {
    detectLocation();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-glow">{t.profileTitle}</h2>
        <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] font-bold">{t.currentRole}: {role === 'driver' ? t.driverRole : t.workshopRole}</p>
      </div>

      <div className="glass-card p-8 garrison-stripes-g relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-2 border-garrison-blue/30 p-1">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-garrison-blue text-black p-2 rounded-full shadow-[0_0_15px_rgba(0,242,255,0.5)]">
               {role === 'driver' ? <User size={16} /> : <Shield size={16} />}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-garrison-blue font-black tracking-widest opacity-50">Authorized Name</label>
              <h3 className="text-xl font-bold">{user.name}</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="flex items-center gap-3 text-zinc-400">
                  <Mail size={14} className="text-garrison-blue/50" />
                  <span className="text-xs truncate">{user.email}</span>
               </div>
               <div className="flex items-center gap-3 text-zinc-400">
                  <Phone size={14} className="text-garrison-blue/50" />
                  <span className="text-xs">{user.phone}</span>
               </div>
            </div>

            <button 
              onClick={handleSync}
              className="flex items-center gap-2 text-[9px] uppercase font-black text-garrison-blue bg-garrison-blue/5 px-3 py-2 rounded-lg border border-garrison-blue/20 hover:bg-garrison-blue/10 transition-all"
            >
              <MapPin size={12} />
              Sync Real-time Location
            </button>
          </div>
        </div>
      </div>

      {role === 'driver' && user.vehicle && (
        <div className="glass-card p-6 space-y-4">
           <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Car className="text-garrison-blue" size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.vehicleSpec}</h3>
           </div>
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                 <span className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">Manufacturer</span>
                 <p className="text-md font-bold text-zinc-200">{user.vehicle.brand}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">Model Series</span>
                 <p className="text-md font-bold text-zinc-200">{user.vehicle.series}</p>
              </div>
           </div>
        </div>
      )}

      {role === 'workshop' && (
        <div className="glass-card p-6 space-y-4">
           <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Shield className="text-garrison-blue" size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">Division Details</h3>
           </div>
           <div className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">Operational Center</span>
              <p className="text-md font-bold text-zinc-200">{user.workshopName}</p>
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          onClick={switchRole}
          className="garrison-btn-secondary flex-1 flex items-center justify-center gap-3"
        >
          <RefreshCw size={14} />
          {t.switchRole}
        </button>
        <button 
          onClick={handleSave}
          className={cn(
            "garrison-btn-primary flex-1",
            saved && "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          )}
        >
          {saved ? 'LOCKED & SAVED' : t.saveProfile}
        </button>
      </div>
    </div>
  );
}
