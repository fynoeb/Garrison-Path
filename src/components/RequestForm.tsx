/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Car, AlertTriangle, PenTool, Battery, Image as ImageIcon, Search, CheckCircle, ArrowRight, XCircle, Fuel, ShieldAlert, Loader2, Wallet, CreditCard, Bike, ChevronRight, MapPin, Navigation, MessageSquare, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { useService } from '../ServiceContext';
import { useBlocker } from 'react-router-dom';
import React from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VEHICLE_DATA } from '../constants';

export default function RequestForm() {
  const { t, language } = useLanguage();
  const { mission, createRequest, cancelRequest, acceptOffer, setVehicleType: setGlobalVehicleType } = useService();
  
  const [issueId, setIssueId] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'wallet'>('cash');
  const [sCategory, setSCategory] = useState<'emergency' | 'home-service' | 'fuel-delivery'>('emergency');
  const [vType, setVType] = useState<'car' | 'motorcycle'>('car');
  const [brand, setBrand] = useState('');
  const [series, setSeries] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customSeries, setCustomSeries] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [schedule, setSchedule] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [scheduledList, setScheduledList] = useState<any[]>([]);

  // Fetch driver's schedules
  React.useEffect(() => {
    const fetchSchedules = async () => {
      const q = query(
        collection(db, 'missions'),
        where('driverId', '==', mission.driverId || ''),
        where('serviceCategory', '==', 'home-service'),
        where('status', 'not-in', ['completed', 'cancelled']),
        orderBy('schedule', 'asc')
      );
      try {
        const snap = await getDocs(q);
        setScheduledList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Scheduled fetch error", e);
      }
    };
    if (mission.driverId) fetchSchedules();
  }, [mission.driverId, isSuccess]);

  const handleTypeChange = (type: 'car' | 'motorcycle') => {
    setVType(type);
    setGlobalVehicleType(type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync service and issue logic
  React.useEffect(() => {
    if (sCategory === 'fuel-delivery') {
      setIssueId('fuel');
    }
  }, [sCategory]);

  // [MINOR-6] Navigation protection
  const isDirty = (brand || series || description || issueId) && mission.status === 'idle';
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname && !isSuccess
  );

  React.useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmed = window.confirm(t.leavePagePrompt);
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, t.leavePagePrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // [MAYOR-4] Validation
    if (!issueId) {
      setError(t.selectIssueError);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const finalBrand = brand === 'Other' ? customBrand : brand;
      const finalSeries = series === 'Other' ? customSeries : series;
      const vehicleName = `[${vType.toUpperCase()}] ` + ([finalBrand, finalSeries].filter(Boolean).join(' ') || 'Unknown Unit');
      await createRequest(issueId, vehicleName, description, photoData, vType, sCategory, payMethod, schedule, address);
      setIsSuccess(true);
      // Mission state update in ServiceContext will trigger the UI transition
    } catch (err) {
      setError('Connection failure. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 relative overflow-hidden garrison-stripes-g">
      <AnimatePresence mode="wait">
        {mission.status === 'idle' && !isSuccess && (
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

                <div className="space-y-2">
                   <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.serviceCategory}</label>
                   <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'emergency', label: t.emergency, icon: ShieldAlert },
                        { id: 'home-service', label: t.homeService, icon: Search },
                        { id: 'fuel-delivery', label: t.fuelDelivery, icon: Fuel }
                      ].map((cat) => (
                        <button 
                          key={cat.id}
                          type="button"
                          onClick={() => setSCategory(cat.id as any)}
                          className={cn(
                            "flex-1 min-w-[100px] py-3 px-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                            sCategory === cat.id ? "bg-garrison-blue border-garrison-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.3)]" : "bg-white/5 border-white/10 text-zinc-500"
                          )}
                        >
                           <cat.icon size={10} />
                           {cat.label}
                        </button>
                      ))}
                   </div>
                </div>

                {sCategory === 'home-service' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">Service Address</label>
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Masukkan alamat lengkap"
                        className="garrison-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">Schedule (Date & Time)</label>
                      <input
                        type="datetime-local"
                        min={new Date().toISOString().slice(0, 16)}
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                        className="garrison-input"
                      />
                    </div>
                  </motion.div>
                )}

                  <div className="space-y-4">
                    <div className="space-y-2 relative">
                      <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.vehicleBrand}</label>
                      <div className="relative">
                        <select
                          value={brand}
                          onChange={(e) => {
                            setBrand(e.target.value);
                            setSeries('');
                          }}
                          className="garrison-input appearance-none bg-zinc-900/50 pr-10"
                        >
                          <option value="">-- {language === 'id' ? 'Pilih Merek' : 'Select Brand'} --</option>
                          {Object.keys(VEHICLE_DATA[vType]).sort().map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {brand === 'Other' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{language === 'id' ? 'Ketik Merek' : 'Type Brand'}</label>
                          <input
                            value={customBrand}
                            onChange={(e) => setCustomBrand(e.target.value)}
                            placeholder={language === 'id' ? 'Contoh: Vespa' : 'e.g. Vespa'}
                            className="garrison-input"
                          />
                        </motion.div>
                      )}

                      {brand && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 relative"
                        >
                          <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.vehicleSeries}</label>
                          <div className="relative">
                            <select
                              value={series}
                              onChange={(e) => setSeries(e.target.value)}
                              className="garrison-input appearance-none bg-zinc-900/50 pr-10"
                            >
                              <option value="">-- {language === 'id' ? 'Pilih Model' : 'Select Model'} --</option>
                                {brand !== 'Other' && VEHICLE_DATA[vType][brand as keyof typeof VEHICLE_DATA[typeof vType]]?.sort().map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                              <option value="Other">{language === 'id' ? 'Lainnya...' : 'Other...'}</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                              <ChevronRight size={14} className="rotate-90" />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {series === 'Other' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{language === 'id' ? 'Ketik Model' : 'Type Model'}</label>
                          <input
                            value={customSeries}
                            onChange={(e) => setCustomSeries(e.target.value)}
                            placeholder={language === 'id' ? 'Tahun / Tipe Modifikasi' : 'Year / Mod Type'}
                            className="garrison-input"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                
                <p className="text-[10px] text-zinc-600 leading-tight px-1 italic">
                  {t.vehicleHint}
                </p>
              </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.issueCategory}</label>
                    {error && <span className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-widest">{error}</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { id: 'engine', label: t.issueEngine, icon: PenTool },
                      { id: 'tire', label: t.issueFlatTire, icon: AlertTriangle },
                      { id: 'battery', label: t.issueBattery, icon: Battery },
                      { id: 'fuel', label: t.issueFuel, icon: Fuel },
                      { id: 'other', label: t.issueOther, icon: Car }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        disabled={isSubmitting || (sCategory === 'fuel-delivery' && cat.id !== 'fuel')}
                        onClick={() => setIssueId(cat.id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300",
                          issueId === cat.id
                            ? "bg-garrison-blue/10 border-garrison-blue text-garrison-blue shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                            : "bg-white/[0.03] border-white/5 text-zinc-600 hover:border-white/20 hover:text-zinc-400",
                          (isSubmitting || (sCategory === 'fuel-delivery' && cat.id !== 'fuel')) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <cat.icon size={18} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Estimation Section */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.priceEstimate}</span>
                      <ShieldAlert size={12} className="text-zinc-700" />
                   </div>
                   <div className="flex justify-between items-end">
                      <div className="space-y-1">
                         <span className="text-[8px] uppercase text-zinc-600 font-black tracking-widest">{t.baseFee} ({t.emergency})</span>
                         <p className="text-xs font-black text-white">{t.idr} 50.000</p>
                      </div>
                      <div className="text-right space-y-1">
                         <span className="text-[8px] uppercase text-zinc-600 font-black tracking-widest">{t.totalPrice}</span>
                         <p className="text-xl font-black text-garrison-blue">{t.idr} 95.000*</p>
                      </div>
                   </div>
                   <p className="text-[7px] text-zinc-700 uppercase tracking-widest font-bold">*Final price adjusts based on precise distance & parts used.</p>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.paymentMethod}</label>
                   <div className="flex gap-2">
                      {[
                        { id: 'cash', label: t.cash, icon: Wallet },
                        { id: 'wallet', label: t.digitalWallet, icon: CreditCard }
                      ].map((pm) => (
                        <button 
                          key={pm.id}
                          type="button"
                          onClick={() => setPayMethod(pm.id as any)}
                          className={cn(
                            "flex-1 py-3 px-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                            payMethod === pm.id ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-zinc-500"
                          )}
                        >
                           <pm.icon size={10} />
                           {pm.label}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.description}</label>
                <textarea
                  required
                  disabled={isSubmitting}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descPlaceholder}
                  className="garrison-input h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{t.visualEvidence}</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  {photoData ? (
                    <div className="relative rounded-2xl overflow-hidden border border-garrison-blue/30 aspect-video">
                       <img src={photoData} alt="Preview" className="w-full h-full object-cover" />
                       <button 
                         onClick={(e) => { e.stopPropagation(); setPhotoData(null); }}
                         className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-black transition-colors"
                       >
                          <XCircle size={14} />
                       </button>
                    </div>
                  ) : (
                    <div className="garrison-input border-dashed flex items-center justify-center gap-3 py-6 group cursor-pointer">
                      <ImageIcon className="text-zinc-600 group-hover:text-garrison-blue transition-colors" size={20} />
                      <span className="text-xs text-zinc-600 group-hover:text-zinc-400 tracking-tight transition-colors">{t.attachPhoto}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="garrison-btn-primary w-full py-4 text-xs tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    {t.dispatchBtn}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {scheduledList.length > 0 && mission.status === 'idle' && (
          <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-garrison-blue">Jadwal Mendatang</h3>
                <span className="text-[8px] font-bold text-zinc-600 uppercase">{scheduledList.length} Active</span>
             </div>
             <div className="space-y-3">
                {scheduledList.map((item, idx) => (
                  <div key={idx} className="glass-card p-4 flex items-center justify-between border-white/5 hover:border-white/10 transition-all">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-garrison-blue uppercase tracking-widest">
                             {new Date(item.schedule).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                           </span>
                           <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{new Date(item.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs font-bold text-white tracking-tight">{item.vehicle}</p>
                     </div>
                     <div className="text-right">
                        <span className="text-[8px] font-black text-zinc-600 block uppercase tracking-widest">Address</span>
                        <p className="text-[9px] font-medium text-zinc-400 truncate max-w-[100px]">{item.address}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {isSuccess && mission.status === 'idle' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 flex items-center justify-center rounded-full shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black uppercase tracking-[0.3em] text-sm text-green-500">{t.successTitle}</h3>
              <p className="text-zinc-500 font-medium text-xs tracking-tight">{t.successSub}</p>
            </div>
            <div className="w-16 h-1 bg-green-500/20 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '100%' }}
                 transition={{ duration: 0.8 }}
                 className="h-full bg-green-500" 
               />
            </div>
          </motion.div>
        )}

        {mission.status === 'scheduled' && (
          <motion.div
            key="scheduled-waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center space-y-8"
          >
            <div className="w-20 h-20 bg-garrison-blue/10 border border-garrison-blue/30 flex items-center justify-center rounded-full shadow-[0_0_30px_rgba(0,242,255,0.1)]">
              <Clock size={40} className="text-garrison-blue text-glow" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black uppercase tracking-[0.3em] text-sm text-garrison-blue">Service Scheduled</h3>
              <p className="text-zinc-500 font-medium text-xs tracking-tight">Your request is floating in the tactical pool. A mechanic will pre-book your slot soon.</p>
            </div>

            <div className="glass-card p-6 w-full space-y-4 bg-white/[0.02]">
               <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="text-left">
                     <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest">Time</span>
                     <p className="text-xs font-bold text-white">{new Date(mission.schedule!).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                     <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest">Type</span>
                     <p className="text-xs font-bold text-white">Home Service</p>
                  </div>
               </div>
               <div className="text-left space-y-1">
                  <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest">Address</span>
                  <p className="text-xs text-zinc-400 font-medium">{mission.address}</p>
               </div>
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

        {mission.status === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center space-y-8"
          >
            <div className="relative">
              <div className="w-24 h-24 border-2 border-white/5 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-t-2 border-garrison-blue rounded-full" 
              />
              <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-garrison-blue text-glow" size={24} />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-black uppercase tracking-[0.3em] text-sm text-garrison-blue">{t.searchingTitle}</h3>
              <p className="text-zinc-500 font-medium text-xs tracking-tight">{t.searchingSub}</p>
            </div>

            {/* Bidding Offers List */}
            <div className="w-full space-y-4 pt-4">
               <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Available Quotes</span>
                  <div className="flex items-center gap-1.5 bg-garrison-blue/10 px-2 py-0.5 rounded border border-garrison-blue/20">
                     <span className="status-pulse w-1.5 h-1.5" />
                     <span className="text-[8px] font-black text-garrison-blue uppercase">{mission.offers?.length || 0} Found</span>
                  </div>
               </div>
               
               <div className="space-y-2 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                  {mission.offers && mission.offers.length > 0 ? (
                    mission.offers.map((offer, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="glass-card p-4 border-white/5 hover:border-garrison-blue/30 transition-all group flex items-center justify-between"
                      >
                         <div className="text-left space-y-1">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{offer.workshopName}</h4>
                            <div className="flex items-center gap-3">
                               <span className="text-[9px] text-zinc-500 font-bold uppercase">{offer.eta}</span>
                               <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                               <span className="text-[9px] text-garrison-blue font-black uppercase">IDR {offer.price.toLocaleString()}</span>
                            </div>
                         </div>
                         <button 
                           onClick={() => acceptOffer(idx)}
                           className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-garrison-blue transition-all"
                         >
                            Deploy
                         </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-8 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-3">
                       <Loader2 size={16} className="text-zinc-700 animate-spin" />
                       <p className="text-[9px] text-zinc-700 uppercase font-black tracking-widest italic text-center px-8">Waiting for local mechanics to quote your mission...</p>
                    </div>
                  )}
               </div>
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
                {mission.status === 'arrived' ? t.helperReached : `Unit #${mission.id} ${t.confirmedSub}`}
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
                   <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t.systemGuide}</span>
                </div>
                <p className="text-[10px] text-white font-bold leading-tight">
                  {mission.vehicleType === 'motorcycle' ? t.motoNextStep : t.carNextStep}
                </p>
              </motion.div>
            )}

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

              <div className="flex flex-col gap-3">
                 <div className="flex gap-3">
                    <a 
                      href="tel:+628112345678" 
                      className="garrison-btn-secondary flex-1 py-3 flex items-center justify-center gap-2 group"
                    >
                       <ArrowRight className="rotate-[-45deg] group-hover:rotate-0 transition-transform" size={14} />
                       <span>{t.call}</span>
                    </a>
                    <button 
                      onClick={() => window.location.href = '/chat'}
                      className="garrison-btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                    >
                       <MessageSquare size={14} />
                       <span>Chat</span>
                    </button>
                 </div>
                 <div className="flex-1 flex flex-col justify-center text-center">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t.division}</span>
                    <span className="text-[10px] font-black text-garrison-blue uppercase">{t.activeProtocol}</span>
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
