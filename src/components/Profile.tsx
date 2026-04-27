/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../UserContext';
import { useLanguage } from '../LanguageContext';
import { User, Shield, Car, Phone, Mail, RefreshCw, MapPin, PenTool, History, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useService } from '../ServiceContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { VEHICLE_DATA } from '../constants';

export default function Profile() {
  const { user, role, updateProfile } = useUser();
  const { detectLocation } = useService();
  const { t, language } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Local form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    brand: user?.vehicle?.brand || '',
    series: user?.vehicle?.series || '',
    vType: user?.vehicle?.type || 'car',
    workshopName: user?.workshopName || ''
  });

  // Sync formData with user updates from context (listener)
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        brand: user?.vehicle?.brand || '',
        series: user?.vehicle?.series || '',
        vType: user?.vehicle?.type || 'car',
        workshopName: user?.workshopName || ''
      });
    }
  }, [user, isEditing]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setIsLoadingHistory(true);
      try {
        const qField = role === 'driver' ? 'driverId' : 'workshopId';
        const q = query(
          collection(db, 'missions'),
          where(qField, '==', user.id),
          where('status', '==', 'completed'),
          orderBy('updatedAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(docs);
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user, role]);

  const handleSync = () => {
    detectLocation();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSave = () => {
    updateProfile({
      name: formData.name,
      phone: formData.phone,
      vehicle: role === 'driver' ? { brand: formData.brand, series: formData.series, type: formData.vType as 'car' | 'motorcycle' } : user?.vehicle,
      workshopName: role === 'workshop' ? formData.workshopName : user?.workshopName
    });
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  // [MINOR-7] Initials fallback helper
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-glow">{t.profileTitle}</h2>
        <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] font-bold">{t.currentRole}: {role === 'driver' ? t.driverRole : t.workshopRole}</p>
      </div>

      <div className="glass-card p-8 garrison-stripes-g relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-2 border-garrison-blue/30 p-1 flex items-center justify-center bg-zinc-900 overflow-hidden">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <span className="text-3xl font-black text-garrison-blue">{getInitials(user.name)}</span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-garrison-blue text-black p-2 rounded-full shadow-[0_0_15px_rgba(0,242,255,0.5)]">
               {role === 'driver' ? <User size={16} /> : <Shield size={16} />}
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-garrison-blue font-black tracking-widest opacity-50">{t.authorizedName}</label>
              {isEditing ? (
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="garrison-input text-lg font-bold py-1 h-auto"
                />
              ) : (
                <h3 className="text-xl font-bold">{user.name}</h3>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="flex items-center gap-3 text-zinc-400">
                  <Mail size={14} className="text-garrison-blue/50" />
                  <span className="text-xs truncate">{user.email}</span>
               </div>
               <div className="flex items-center gap-3 text-zinc-400">
                  <Phone size={14} className="text-garrison-blue/50" />
                  {isEditing ? (
                    <input 
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="garrison-input text-xs py-1 h-auto bg-transparent border-white/5"
                    />
                  ) : (
                    <span className="text-xs">{user.phone}</span>
                  )}
               </div>
            </div>

            <button 
              onClick={handleSync}
              className="flex items-center gap-2 text-[9px] uppercase font-black text-garrison-blue bg-garrison-blue/5 px-3 py-2 rounded-lg border border-garrison-blue/20 hover:bg-garrison-blue/10 transition-all"
            >
              <MapPin size={12} />
              {t.syncLocation}
            </button>
          </div>
        </div>
      </div>

      {role === 'driver' && (
        <div className="glass-card p-6 space-y-4">
           <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Car className="text-garrison-blue" size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.divisionDetails}</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                 <span className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">{t.vehicleType}</span>
                 {isEditing ? (
                   <select 
                     value={formData.vType}
                     onChange={(e) => setFormData(prev => ({ ...prev, vType: e.target.value as any, brand: '', series: '' }))}
                     className="garrison-input text-sm p-2 appearance-none bg-zinc-900/50"
                   >
                     <option value="car">{t.vehicleCar}</option>
                     <option value="motorcycle">{t.vehicleMotor}</option>
                   </select>
                 ) : (
                   <p className="text-md font-bold text-zinc-200 uppercase">{formData.vType}</p>
                 )}
              </div>
              <div className="space-y-1">
                 <span className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">{t.carBrand}</span>
                 {isEditing ? (
                   <select 
                     value={formData.brand}
                     onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value, series: '' }))}
                     className="garrison-input text-sm p-2 appearance-none bg-zinc-900/50"
                   >
                     <option value="">-- Pilih Merek --</option>
                     {Object.keys(VEHICLE_DATA[formData.vType as 'car' | 'motorcycle']).map(b => (
                       <option key={b} value={b}>{b}</option>
                     ))}
                   </select>
                 ) : (
                   <p className="text-md font-bold text-zinc-200">{user.vehicle?.brand || '-'}</p>
                 )}
              </div>
              <div className="space-y-1">
                 <span className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">{t.carModel}</span>
                 {isEditing ? (
                   <select 
                     value={formData.series}
                     onChange={(e) => setFormData(prev => ({ ...prev, series: e.target.value }))}
                     className="garrison-input text-sm p-2 appearance-none bg-zinc-900/50"
                     disabled={!formData.brand || formData.brand === 'Other'}
                   >
                     <option value="">-- Pilih Model --</option>
                     {formData.brand && formData.brand !== 'Other' && VEHICLE_DATA[formData.vType as 'car' | 'motorcycle'][formData.brand as keyof typeof VEHICLE_DATA['car']].map(m => (
                       <option key={m} value={m}>{m}</option>
                     ))}
                     <option value="Other">Lainnya...</option>
                   </select>
                 ) : (
                   <p className="text-md font-bold text-zinc-200">{user.vehicle?.series || '-'}</p>
                 )}
              </div>
           </div>
        </div>
      )}

      {role === 'workshop' && (
        <div className="glass-card p-6 space-y-4">
           <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Shield className="text-garrison-blue" size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.operationalCenter}</h3>
           </div>
           <div className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">{t.workshopNameLabel}</span>
              {isEditing ? (
                <input 
                  value={formData.workshopName}
                  onChange={(e) => setFormData(prev => ({ ...prev, workshopName: e.target.value }))}
                  className="garrison-input text-md p-2"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-md font-bold text-zinc-200">{user.workshopName || '-'}</p>
                  <div className="flex items-center gap-2">
                     <div className="flex bg-garrison-blue/10 px-2 py-1 rounded border border-garrison-blue/20 items-center gap-1.5">
                        <Star size={12} className="text-garrison-blue fill-garrison-blue" />
                        <span className="text-[10px] font-black text-white">{user.rating?.toFixed(1) || '0.0'}</span>
                     </div>
                     <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">({user.ratingCount || 0} reviews)</span>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="garrison-btn-secondary flex-1 flex items-center justify-center gap-3"
          >
            <PenTool size={14} />
            {t.editProfile}
          </button>
        ) : (
          <button 
            onClick={() => setIsEditing(false)}
            className="garrison-btn-secondary flex-1 flex items-center justify-center gap-3 border-zinc-700 text-zinc-500 hover:text-white"
          >
            {t.cancel}
          </button>
        )}
        
        {isEditing && (
          <button 
            onClick={handleSave}
            className={cn(
              "garrison-btn-primary flex-1",
              saved && "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            )}
          >
            {saved ? 'SUCCESS' : t.saveProfile}
          </button>
        )}
      </div>
      
      {saved && (
        <div className="text-center">
          <span className="text-[10px] font-black uppercase text-green-500 tracking-widest animate-pulse">{t.profileSaved}</span>
        </div>
      )}

      {/* History Section */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History size={18} className="text-garrison-blue" />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.missionHistory}</h3>
            </div>
            {isLoadingHistory && <RefreshCw size={12} className="animate-spin text-zinc-600" />}
        </div>
        <div className="divide-y divide-white/5">
            {history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white px-2 py-0.5 bg-white/10 rounded tracking-widest">{item.id.substring(0, 8)}</span>
                        <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">{item.vehicle}</span>
                      </div>
                      <h4 className="text-md font-bold text-zinc-100 italic">"{item.reviewComment || item.description}"</h4>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} fill={s <= (item.rating || 5) ? "#00F2FF" : "none"} className={s <= (item.rating || 5) ? "text-garrison-blue" : "text-zinc-800"} />
                          ))}
                       </div>
                       {item.rating && (
                         <span className="text-[8px] font-black text-garrison-blue uppercase tracking-widest">{item.rating.toFixed(1)} STARS</span>
                       )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-600 font-black">
                       <Clock size={10} /> {item.updatedAt?.toDate?.()?.toLocaleDateString() || item.completedAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                    </div>
                    {role === 'workshop' ? (
                       <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white font-black">
                          <User size={10} /> Driver: {item.driverId?.substring(0,6)}
                       </div>
                    ) : (
                       <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-garrison-blue font-black">
                          <Shield size={10} /> {item.workshopId || 'Garrison Unit'}
                       </div>
                    )}
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-600 font-black">
                       <PenTool size={10} /> {item.issue}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center space-y-4">
                 <History size={32} className="mx-auto text-zinc-800" />
                 <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black leading-relaxed max-w-[180px] mx-auto">
                    {t.noHistory}
                 </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
