/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Radio, Activity, XCircle, CheckCircle2, MessageSquare, MapPin, Eye, Camera, Info, Car, Bike, Star, Clock, User, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../LanguageContext';
import { useService } from '../ServiceContext';
import { useUser } from '../UserContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Icon for incident location
const incidentIcon = L.divIcon({
  className: 'incident-div-icon',
  html: `<div class="relative">
           <div class="absolute inset-0 bg-red-500/30 rounded-full animate-ping"></div>
           <div style="background-color: #ff3b30; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px #ff3b30;"></div>
         </div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Tactical helper for workshop map
function WorkshopMapControls({ requests }: { requests: any[] }) {
  const map = useMap();
  useEffect(() => {
    const validRequests = requests.filter(r => r.location && typeof r.location.lat === 'number' && typeof r.location.lng === 'number');
    if (validRequests.length > 0) {
      const bounds = L.latLngBounds(validRequests.map(r => [r.location.lat, r.location.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [requests, map]);
  return null;
}

export default function WorkshopDashboard() {
  const { t, language } = useLanguage();
  const { user, updateProfile, role } = useUser();
  const { mission, workshops, acceptMission, submitOffer, updateMissionStatus, activeMissions, selectMission } = useService();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'terminal' | 'hq' | 'schedules'>((searchParams.get('tab') as any) || 'terminal');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'terminal' || tab === 'hq' || tab === 'schedules') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'terminal' | 'hq' | 'schedules') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || activeTab !== 'hq') return;
      // Fetch both as a workshop or as a participant
      const q = query(
        collection(db, 'missions'),
        where('assignedWorkshopId', '==', user.id),
        where('status', '==', 'completed'),
        limit(20)
      );
      
      try {
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort manually by updatedAt since composite indexes might be missing for some users
        docs.sort((a: any, b: any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setHistory(docs);
      } catch (e) {
        console.error("Error fetching history:", e);
      }
    };
    fetchHistory();
  }, [user, activeTab]);

  // Combine real missions from Firestore
  // 1. Missions assigned to this workshop (Active Ops)
  const assignedMissions = activeMissions.filter(m => 
    m.assignedWorkshopId === user?.id && ['confirmed', 'arriving', 'arrived'].includes(m.status)
  );

  // 2. Missions currently searching or scheduled (Available Pool)
  const poolMissions = activeMissions.filter(m => 
    m.status === 'searching' && !assignedMissions.some(am => am.id === m.id)
  );
  
  const displayRequests = [
    ...assignedMissions.map(m => ({
      id: m.id!,
      vehicle: m.vehicle,
      vehicleType: m.vehicleType,
      serviceCategory: m.serviceCategory,
      issue: m.issue,
      description: m.description,
      photo: m.photo || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=400',
      location: m.userLocation,
      locationName: t.activeCoordination,
      time: t.statusInProgress,
      status: m.status,
      criticality: 'critical',
      distance: m.distance,
      isReal: true
    })),
    ...poolMissions.map(m => ({
      id: m.id!,
      vehicle: m.vehicle,
      vehicleType: m.vehicleType,
      serviceCategory: m.serviceCategory,
      issue: m.issue,
      description: m.description,
      photo: m.photo || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=400',
      location: m.userLocation,
      locationName: (language === 'id' ? 'Lokasi: ' : 'Location: ') + m.userLocation.lat.toFixed(4) + ', ' + m.userLocation.lng.toFixed(4),
      time: t.statusJustNow,
      status: 'pending',
      criticality: 'high',
      distance: m.distance,
      isReal: true
    })),
    // 3. Fallback mock if nothing at all
    ...(assignedMissions.length === 0 && poolMissions.length === 0 ? [{
      id: 'REQ-42Y',
      vehicle: 'Continental G3',
      vehicleType: 'car',
      serviceCategory: 'emergency',
      issue: t.issueEngine,
      description: 'Vehicle lost power while accelerating. Electronics non-responsive.',
      photo: 'https://images.unsplash.com/photo-1544650039-228966838385?auto=format&fit=crop&q=80&w=400',
      location: { lat: -0.9471, lng: 100.3543 },
      locationName: 'PDG Sector: Khatib Sulaiman',
      time: '24 mins ago',
      status: 'pending',
      criticality: 'medium',
      distance: '2.4 km',
      isReal: false
    }] : [])
  ];

  const activeStatsCount = assignedMissions.length;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': t.statusPending,
      'searching': t.statusPending,
      'scheduled': language === 'id' ? 'TERJADWAL' : 'SCHEDULED',
      'confirmed': t.statusConfirmed,
      'arriving': t.statusArriving,
      'arrived': t.statusArrived
    };
    return labels[status] || status.toUpperCase();
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20 lg:pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-1">
           <h2 className="text-4xl font-black tracking-tighter text-glow">
             {role === 'fuel-partner' ? 'FUEL PORTAL' : t.dashboardTitle}
           </h2>
           <div className="flex items-center gap-4 mt-2">
             <button 
               onClick={() => handleTabChange('terminal')}
               className={cn(
                 "text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b-2 transition-all",
                 activeTab === 'terminal' ? "text-garrison-blue border-garrison-blue" : "text-zinc-600 border-transparent hover:text-zinc-400"
               )}
             >
               {t.terminalActive}
             </button>
             <button 
               onClick={() => handleTabChange('hq')}
               className={cn(
                 "text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b-2 transition-all",
                 activeTab === 'hq' ? "text-garrison-blue border-garrison-blue" : "text-zinc-600 border-transparent hover:text-zinc-400"
               )}
             >
               {t.nav.hq}
             </button>
             <button 
                onClick={() => handleTabChange('schedules')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.3em] pb-1 border-b-2 transition-all",
                  activeTab === 'schedules' ? "text-garrison-blue border-garrison-blue" : "text-zinc-600 border-transparent hover:text-zinc-400"
                )}
              >
                Jadwal
              </button>
           </div>
        </div>
         <div className="flex items-center gap-4">
            <button 
              onClick={() => updateProfile({ isAvailable: !user?.isAvailable })}
              className={cn(
                "glass-card px-4 py-2 border-garrison-blue/30 flex items-center gap-3 transition-all",
                user?.isAvailable ? "bg-garrison-blue/10" : "grayscale opacity-50"
              )}
            >
               <span className={cn("status-pulse", !user?.isAvailable && "bg-zinc-600")} />
               <span className="text-[9px] uppercase tracking-[0.2em] font-black text-garrison-blue">
                 {user?.isAvailable ? t.goOffline : t.goOnline}
               </span>
            </button>
         </div>
      </div>

      {activeTab === 'terminal' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: t.pendingJobs, val: displayRequests.length.toString().padStart(2, '0'), icon: Radio, color: 'text-garrison-blue' },
              { label: t.activeUnits, val: activeStatsCount.toString().padStart(2, '0'), icon: Activity, color: 'text-garrison-blue' },
              { label: t.networkLatency, val: '0.4ms', icon: Radio, color: 'text-zinc-600' }
            ].map((stat, idx) => (
              <div key={idx} className="glass-card p-6 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                 <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">{stat.label}</span>
                    <div className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.val}</div>
                 </div>
                 <stat.icon size={24} className={cn("opacity-20 group-hover:opacity-100 transition-all", stat.color)} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 glass-card overflow-hidden relative">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                 <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-garrison-blue">{t.ledgerTitle}</h3>
              </div>

              <div className="divide-y divide-white/5">
                <AnimatePresence>
                  {displayRequests.length > 0 ? (
                    displayRequests.map((req) => (
                      <motion.div 
                        key={req.id} 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "p-6 flex flex-col hover:bg-white/[0.03] transition-all relative group",
                          selectedRequest === req.id && "bg-white/[0.04]"
                        )}
                      >
                         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-start gap-6">
                              <div className={cn(
                                "p-4 rounded-2xl border flex items-center justify-center transition-all",
                                req.criticality === 'high' ? "bg-red-500/5 border-red-500/20 text-red-500" : 
                                req.criticality === 'critical' ? "bg-garrison-blue/10 border-garrison-blue text-garrison-blue shadow-[0_0_20px_rgba(0,242,255,0.2)]" :
                                "bg-garrison-blue/5 border-garrison-blue/20 text-garrison-blue"
                              )}>
                                <Radio className="w-6 h-6 animate-pulse" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-white px-2 py-0.5 bg-white/5 rounded-md tracking-widest flex items-center gap-2">
                                    {req.vehicleType === 'motorcycle' ? <Bike size={10} className="text-garrison-blue" /> : <Car size={10} className="text-garrison-blue" />}
                                    {req.id}
                                  </span>
                                  <span className="garrison-badge bg-white/5 border border-white/10 text-zinc-500">
                                    {req.serviceCategory === 'emergency' ? t.emergency : 
                                     req.serviceCategory === 'home-service' ? t.homeService : t.fuelDelivery}
                                  </span>
                                  <span className={cn(
                                     "garrison-badge",
                                     (req.status === 'confirmed' || req.status === 'intercepted' || req.status === 'arriving' || req.status === 'arrived') ? "bg-garrison-blue/20 text-garrison-blue" : "bg-orange-500/20 text-orange-500"
                                  )}>{getStatusLabel(req.status)}</span>
                                </div>
                                <h4 className="text-xl font-bold tracking-tight text-zinc-100">{req.vehicle}</h4>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-2">
                                  <span>{req.time}</span>
                                  <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                  <span>{req.issue}</span>
                                  <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                  <span className="text-garrison-blue">{req.locationName}</span>
                                  {req.distance && (
                                    <>
                                      <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                      <span className="text-white bg-white/5 border border-white/10 px-1.5 py-0.5 rounded leading-none">{req.distance}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedRequest(selectedRequest === req.id ? null : req.id);
                                  if (selectedRequest !== req.id && req.isReal) selectMission(req.id);
                                }}
                                className={cn(
                                  "garrison-btn-secondary p-3 flex items-center gap-2",
                                  selectedRequest === req.id && "border-garrison-blue text-white"
                                )}
                              >
                                <Eye size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.details}</span>
                              </button>
                            </div>
                         </div>

                         <AnimatePresence>
                           {selectedRequest === req.id && (
                             <motion.div 
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               className="mt-6 pt-6 border-t border-white/5 space-y-6"
                             >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="space-y-4">
                                      <div className="space-y-1">
                                         <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                                            <Info size={10} /> {t.description}
                                         </span>
                                         <p className="text-sm text-zinc-400 leading-relaxed italic">"{req.description || t.noDescription}"</p>
                                      </div>
                                      <div className="space-y-1">
                                         <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                                            <MapPin size={10} /> {t.extractionPoint}
                                         </span>
                                         <p className="text-xs text-white font-bold">{req.locationName}</p>
                                      </div>
                                   </div>
                                   <div className="space-y-2">
                                      <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                                         <Camera size={10} /> {t.visualEvidence}
                                      </span>
                                      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 relative group">
                                         <img src={req.photo || ''} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Evidence" />
                                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-4">
                                            <span className="text-[8px] font-black uppercase text-white tracking-[0.2em]">{t.highPrecisionCapture}</span>
                                         </div>
                                      </div>
                                   </div>
                                </div>

                                <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                                   {req.isReal && mission.status === 'searching' && (
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div className="space-y-2">
                                          <label className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Your Price Quote (IDR)</label>
                                          <input 
                                            id={`price-${req.id}`}
                                            type="number" 
                                            defaultValue={50000} 
                                            className="garrison-input py-2" 
                                          />
                                       </div>
                                       <div className="space-y-2">
                                          <label className="text-[10px] uppercase text-zinc-600 font-black tracking-widest">Estimated ETA</label>
                                          <input 
                                            id={`eta-${req.id}`}
                                            type="text" 
                                            defaultValue="15-20 Mins" 
                                            className="garrison-input py-2" 
                                          />
                                       </div>
                                       <button 
                                         onClick={(e) => {
                                           const p = (document.getElementById(`price-${req.id}`) as HTMLInputElement)?.value;
                                           const t = (document.getElementById(`eta-${req.id}`) as HTMLInputElement)?.value;
                                           submitOffer(req.id, Number(p), t);
                                           e.currentTarget.disabled = true;
                                           e.currentTarget.innerText = "OFFER SENT";
                                         }}
                                         className="garrison-btn-primary py-3 md:col-span-2 flex items-center justify-center gap-3"
                                       >
                                          <CheckCircle2 size={14} />
                                          <span className="text-[10px] font-black uppercase tracking-widest">{language === 'id' ? 'Kirim Penawaran' : 'Submit Quote'}</span>
                                       </button>
                                     </div>
                                   )}

                                   <div className="flex gap-3">
                                   <button className="garrison-btn-secondary flex-1 py-3 flex items-center justify-center gap-3 text-zinc-500">
                                      <XCircle size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{t.ignore}</span>
                                   </button>
                                 {req.isReal && req.status === 'pending' && (
                                   <button 
                                     onClick={() => {
                                       acceptMission(req.id, user?.id || '');
                                       selectMission(req.id);
                                     }}
                                     className="garrison-btn-primary flex-1 py-3 flex items-center justify-center gap-3"
                                   >
                                      <CheckCircle2 size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{t.acceptJob}</span>
                                   </button>
                                 )}
                                 {req.isReal && mission.id === req.id && mission.status === 'confirmed' && (
                                   <button 
                                     onClick={() => updateMissionStatus('arriving')}
                                     className="garrison-btn-primary flex-1 py-3 flex items-center justify-center gap-3 bg-blue-500 border-blue-500"
                                   >
                                      <Activity size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{language === 'id' ? 'Mulai Jalan' : 'Start Journey'}</span>
                                   </button>
                                 )}
                                 {req.isReal && mission.id === req.id && mission.status === 'arriving' && (
                                   <button 
                                     onClick={() => updateMissionStatus('arrived')}
                                     className="garrison-btn-primary flex-1 py-3 flex items-center justify-center gap-3 bg-orange-500 border-orange-500"
                                   >
                                      <MapPin size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{language === 'id' ? 'Saya Sudah Sampai' : 'I Have Arrived'}</span>
                                   </button>
                                 )}
                                 {req.isReal && mission.id === req.id && mission.status === 'arrived' && (
                                   <button 
                                     onClick={() => updateMissionStatus('completed')}
                                     className="garrison-btn-primary flex-1 py-3 flex items-center justify-center gap-3 bg-green-500 border-green-500"
                                   >
                                      <CheckCircle2 size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">{language === 'id' ? 'Selesaikan Bantuan' : 'Mark Completed'}</span>
                                   </button>
                                 )}
                                 {req.isReal && req.id === mission.id && (mission.status === 'confirmed' || mission.status === 'arriving' || mission.status === 'arrived') && (
                                   <Link 
                                     to="/chat"
                                     className="garrison-btn-secondary flex-1 py-3 flex items-center justify-center gap-3 border-garrison-blue/30 text-garrison-blue"
                                   >
                                         <MessageSquare size={14} />
                                         <span className="text-[10px] font-black uppercase tracking-widest">{t.messageDriver}</span>
                                      </Link>
                                    )}
                                </div>
                             </div>
                          </motion.div>
                        )}
                     </AnimatePresence>
                  </motion.div>
                ))
                  ) : (
                    <div className="p-12 text-center text-zinc-600 text-xs uppercase tracking-widest font-black">{t.noActiveSignals}</div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="glass-card h-[400px] overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-[1000] glass-card p-3 bg-black/60 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                       <span className="status-pulse" />
                       <h3 className="font-black text-[10px] tracking-[0.2em] text-garrison-blue uppercase">{t.incidentArea}</h3>
                    </div>
                  </div>
                  <MapContainer 
                    center={displayRequests[0]?.location || { lat: -0.9471, lng: 100.3543 }} 
                    zoom={13} 
                    className="h-full w-full"
                    zoomControl={false}
                  >
                    <WorkshopMapControls requests={displayRequests} />
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {displayRequests.filter(r => r.location && typeof r.location.lat === 'number' && typeof r.location.lng === 'number').map(req => (
                      <Marker key={req.id} position={[req.location.lat, req.location.lng]} icon={incidentIcon}>
                        <Tooltip permanent direction="top" className="garrison-map-tooltip">
                           <span className="font-black text-[8px] uppercase tracking-tighter text-red-500">{req.id}</span>
                        </Tooltip>
                        <Popup className="glass-popup">
                          <div className="w-[140px] p-2 space-y-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-black text-[10px] uppercase tracking-widest text-garrison-blue">{req.id}</h4>
                              <span className="text-[7px] font-bold text-red-500 uppercase">Alert</span>
                            </div>
                            <p className="text-[9px] text-zinc-400 font-bold leading-none flex items-center gap-1">
                              {req.vehicleType === 'motorcycle' ? <Bike size={10} /> : <Car size={10} />}
                              {req.vehicle}
                            </p>
                            <div className="pt-1 mt-1 border-t border-white/5 space-y-1">
                               <div className="flex items-center gap-1">
                                  <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">{req.issue}</span>
                               </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
               </div>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'schedules' && (
        <div className="space-y-6 animate-slide-up">
           <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                 <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-garrison-blue">
                   {language === 'id' ? 'JADWAL LAYANAN' : 'AVAILABLE SCHEDULES'}
                 </h3>
              </div>
              <div className="divide-y divide-white/5">
                 {activeMissions.filter(m => m.status === 'scheduled').length > 0 ? 
                   activeMissions.filter(m => m.status === 'scheduled').sort((a: any, b: any) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime()).map((item) => (
                   <React.Fragment key={item.id}>
                   <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start gap-4">
                         <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                            <Clock className="text-zinc-500" size={16} />
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-garrison-blue uppercase tracking-widest leading-none">
                                 {new Date(item.schedule).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                               </span>
                               <span className="text-[10px] font-black text-white px-2 py-0.5 bg-white/10 rounded tracking-widest leading-none">
                                 {new Date(item.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                            <h4 className="text-lg font-bold text-white tracking-tight">{item.vehicle}</h4>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-2">
                               <MapPin size={10} className="text-garrison-blue" />
                               {item.address || 'No Address Provided'}
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={() => {
                             setSelectedRequest(selectedRequest === item.id ? null : item.id);
                             if (selectedRequest !== item.id) selectMission(item.id);
                           }}
                           className={cn(
                             "garrison-btn-secondary px-6 py-2 text-[9px]",
                             selectedRequest === item.id && "border-garrison-blue text-white"
                           )}
                         >
                            {selectedRequest === item.id ? (language === 'id' ? 'Tutup' : 'Close') : (language === 'id' ? 'Detil' : 'Detail')}
                         </button>
                         <button 
                           onClick={() => {
                             acceptMission(item.id, user?.id || '');
                             selectMission(item.id);
                           }}
                           className="garrison-btn-primary px-6 py-2 text-[9px]"
                         >
                            {language === 'id' ? 'Terima' : 'Accept'}
                         </button>
                      </div>
                   </div>
                   
                   <AnimatePresence>
                     {selectedRequest === item.id && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="px-6 pb-6"
                       >
                          <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-4">
                                <div className="space-y-1">
                                   <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                                      <Info size={10} /> {t.description}
                                   </span>
                                   <p className="text-sm text-zinc-400 leading-relaxed italic">"{item.description || t.noDescription}"</p>
                                </div>
                                <div className="space-y-1">
                                   <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                                      <MapPin size={10} /> Address
                                   </span>
                                   <p className="text-xs text-white font-bold">{item.address}</p>
                                </div>
                             </div>
                             {item.photo && (
                               <div className="space-y-2">
                                  <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                                     <Camera size={10} /> {language === 'id' ? 'Foto Kendaraan' : 'Vehicle Photo'}
                                  </span>
                                  <img src={item.photo} className="w-full aspect-video object-cover rounded-xl border border-white/10 grayscale" alt="Evidence" />
                               </div>
                             )}
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                   </React.Fragment>
                 )) : (
                   <div className="py-20 text-center space-y-4">
                      <Clock className="mx-auto text-zinc-800" size={32} />
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-black">No scheduled home-services detected</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'hq' && (
        <div className="space-y-8 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                   <div className="p-3 bg-garrison-blue/20 rounded-xl">
                      <Activity className="text-garrison-blue" size={20} />
                   </div>
                   <div className="space-y-1">
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">{language === 'id' ? 'Metrik Performa' : 'Performance Stats'}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{language === 'id' ? 'Statistik Operasional' : 'Operational Stats'}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest">Rating Avg</span>
                      <p className="text-2xl font-black text-garrison-blue italic">{user?.rating?.toFixed(1) || '5.0'}</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest">{language === 'id' ? 'Bantuan Selesai' : 'Services Done'}</span>
                      <p className="text-2xl font-black text-white italic">{user?.ratingCount || '0'}</p>
                   </div>
                </div>
             </div>

             <div className="glass-card p-6 space-y-6 bg-garrison-blue/5 border-garrison-blue/20 flex flex-col items-center">
                <div className="flex items-center gap-3 w-full">
                   <div className="w-10 h-10 rounded-xl bg-garrison-blue text-black flex items-center justify-center font-black">?</div>
                   <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-black uppercase tracking-widest text-white">{t.systemGuide}</h4>
                      <p className="text-[10px] text-zinc-500 font-medium">{t.acceptSignalsGuide}</p>
                   </div>
                </div>
                
                <div className="w-full pt-4 border-t border-white/5 space-y-4">
                  <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest block text-center">
                    {language === 'id' ? 'Saluran Bantuan 01' : 'Support Channel 01'}
                  </span>
                  <button 
                    onMouseDown={(e) => {
                      e.currentTarget.classList.add('bg-garrison-blue', 'text-black', 'shadow-[0_0_20px_rgba(0,242,255,0.5)]');
                      e.currentTarget.querySelector('.status-pulse')?.classList.add('bg-white');
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.classList.remove('bg-garrison-blue', 'text-black', 'shadow-[0_0_20px_rgba(0,242,255,0.5)]');
                      e.currentTarget.querySelector('.status-pulse')?.classList.remove('bg-white');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.classList.remove('bg-garrison-blue', 'text-black', 'shadow-[0_0_20px_rgba(0,242,255,0.5)]');
                      e.currentTarget.querySelector('.status-pulse')?.classList.remove('bg-white');
                    }}
                    className="w-full py-8 rounded-full border-2 border-garrison-blue/30 text-garrison-blue flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group relative"
                  >
                    <div className="status-pulse w-3 h-3 mb-2" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">{t.holdToSpeak || 'TEKAN UNTUK BICARA'}</span>
                    <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest">
                      {language === 'id' ? 'Koneksi Aman Aktif' : 'Secure Connection Active'}
                    </span>
                  </button>
                  <p className="text-[8px] text-zinc-600 text-center uppercase tracking-widest italic">{t.intercomHint || 'Use intercom for direct tactical relay'}</p>
                </div>
             </div>
          </div>

          <div className="glass-card overflow-hidden">
             <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-garrison-blue">
                   {language === 'id' ? 'LOG ULASAN BANTUAN' : 'SERVICE REVIEWS'}
                </h3>
             </div>
             <div className="divide-y divide-white/5">
                {history.length > 0 ? history.map((item) => (
                  <div key={item.id} className="p-6 space-y-4 hover:bg-white/[0.02] transition-colors">
                     <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white px-2 py-0.5 bg-white/10 rounded tracking-widest">{item.id.substring(0, 8)}</span>
                            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">{item.vehicle}</span>
                          </div>
                          <h4 className="text-md font-bold text-zinc-100 italic">"{item.reviewComment || item.issue}"</h4>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={10} fill={s <= (item.rating || 5) ? "#00F2FF" : "none"} className={s <= (item.rating || 5) ? "text-garrison-blue" : "text-zinc-800"} />
                              ))}
                           </div>
                           {item.rating && (
                             <span className="text-[8px] font-black text-garrison-blue uppercase tracking-widest">{item.rating.toFixed(1)} {language === 'id' ? 'BINTANG' : 'STARS'}</span>
                           )}
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-600 font-black">
                           <Clock size={10} /> {item.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white font-black">
                           <User size={10} /> Driver: {item.driverId?.substring(0,6)}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-600 font-black">
                           <Clock size={10} /> {item.issue}
                        </div>
                     </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-[10px] uppercase tracking-widest text-zinc-600 font-black">{language === 'id' ? 'BELUM ADA RIWAYAT OPERASIONAL' : 'NO SERVICE HISTORY DETECTED'}</div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
