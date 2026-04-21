/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Radio, Activity, XCircle, CheckCircle2, MessageSquare, MapPin, Eye, Camera, Info, Car, Bike } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../LanguageContext';
import { useService } from '../ServiceContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';

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
    if (requests.length > 0) {
      const bounds = L.latLngBounds(requests.map(r => [r.location.lat, r.location.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [requests, map]);
  return null;
}

export default function WorkshopDashboard() {
  const { t } = useLanguage();
  const { mission, workshops, acceptMission } = useService();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // Combine requests, prioritizing the active accepted mission
  const activeMissionData = mission.status !== 'idle' && mission.status !== 'searching' ? {
    id: mission.id!,
    vehicle: mission.vehicle,
    vehicleType: mission.vehicleType,
    issue: mission.issue,
    description: mission.description,
    photo: mission.photo || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=400',
    location: mission.userLocation,
    locationName: 'Active Coordination at Unit Location',
    time: 'In Progress',
    status: mission.status,
    criticality: 'critical',
    distance: mission.distance,
    isReal: true
  } : null;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Unassigned',
      'searching': 'Incoming Signal',
      'confirmed': 'Assigned to Unit',
      'arriving': 'Arriving Soon',
      'arrived': 'On Site'
    };
    return labels[status] || status;
  };

  const displayRequests = [
    ...(activeMissionData ? [activeMissionData] : []),
    ...(mission.id && mission.status === 'searching' ? [
      {
        id: mission.id,
        vehicle: mission.vehicle,
        vehicleType: mission.vehicleType,
        issue: mission.issue,
        description: mission.description,
        photo: mission.photo || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=400',
        location: { lat: mission.userLocation.lat, lng: mission.userLocation.lng },
        locationName: 'Grid: ' + mission.userLocation.lat.toFixed(4) + ', ' + mission.userLocation.lng.toFixed(4),
        time: 'Just now',
        status: 'pending',
        criticality: 'high',
        distance: mission.distance,
        isReal: true
      }
    ] : []),
    {
      id: 'REQ-42Y',
      vehicle: 'Continental G3',
      vehicleType: 'car',
      issue: 'System Failure',
      description: 'Vehicle lost power while accelerating. Electronics non-responsive.',
      photo: 'https://images.unsplash.com/photo-1544650039-228966838385?auto=format&fit=crop&q=80&w=400',
      location: { lat: -0.9471, lng: 100.3543 },
      locationName: 'PDG Sector: Khatib Sulaiman',
      time: '24 mins ago',
      status: 'pending',
      criticality: 'medium',
      distance: '2.4 km',
      isReal: false
    }
  ];

  return (
    <div className="space-y-8 animate-slide-up pb-20 lg:pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-1">
           <h2 className="text-4xl font-black tracking-tighter text-glow">{t.dashboardTitle}</h2>
           <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-black">{t.dashboardSub}</p>
        </div>
         <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2 border-garrison-blue/30 flex items-center gap-3">
               <span className="status-pulse" />
               <span className="text-[9px] uppercase tracking-[0.2em] font-black text-garrison-blue">{t.terminalActive}</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t.pendingJobs, val: displayRequests.length.toString(), icon: Radio, color: 'text-garrison-blue' },
          { label: t.activeUnits, val: mission.status === 'confirmed' ? '01' : '00', icon: Activity, color: 'text-garrison-blue' },
          { label: 'Network Latency', val: '0.4ms', icon: Radio, color: 'text-zinc-600' }
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
                              <span className={cn(
                                 "garrison-badge",
                                 (req.status === 'confirmed' || req.status === 'intercepted') ? "bg-garrison-blue/20 text-garrison-blue" : "bg-orange-500/20 text-orange-500"
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
                            onClick={() => setSelectedRequest(selectedRequest === req.id ? null : req.id)}
                            className={cn(
                              "garrison-btn-secondary p-3 flex items-center gap-2",
                              selectedRequest === req.id && "border-garrison-blue text-white"
                            )}
                          >
                            <Eye size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
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
                                        <Info size={10} /> Report Description
                                     </span>
                                     <p className="text-sm text-zinc-400 leading-relaxed italic">"{req.description || 'No additional details provided.'}"</p>
                                  </div>
                                  <div className="space-y-1">
                                     <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                                        <MapPin size={10} /> Extraction Point
                                     </span>
                                     <p className="text-xs text-white font-bold">{req.locationName}</p>
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <span className="text-[9px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                                     <Camera size={10} /> Visual Evidence
                                  </span>
                                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 relative group">
                                     <img src={req.photo || ''} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Evidence" />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-4">
                                        <span className="text-[8px] font-black uppercase text-white tracking-[0.2em]">High precision capture</span>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                               <button className="garrison-btn-secondary flex-1 py-3 flex items-center justify-center gap-3 text-zinc-500">
                                  <XCircle size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">{t.ignore}</span>
                               </button>
                               {req.isReal && mission.status === 'searching' && (
                                 <button 
                                   onClick={() => acceptMission('workshop-central')}
                                   className="garrison-btn-primary flex-1 py-3 flex items-center justify-center gap-3"
                                 >
                                    <CheckCircle2 size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.acceptJob}</span>
                                 </button>
                               )}
                               {req.isReal && mission.status !== 'searching' && (
                                 <Link 
                                   to="/chat"
                                   className="garrison-btn-secondary flex-1 py-3 flex items-center justify-center gap-3 border-garrison-blue/30 text-garrison-blue"
                                 >
                                    <MessageSquare size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Message Driver</span>
                                 </Link>
                               )}
                            </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center text-zinc-600 text-xs uppercase tracking-widest font-black">No active signals detected.</div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-card h-[400px] overflow-hidden relative">
              <div className="absolute top-4 left-4 z-[1000] glass-card p-3 bg-black/60 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="status-pulse" />
                  <h3 className="font-black text-[10px] tracking-[0.2em] text-garrison-blue uppercase">Incident Area</h3>
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
                {displayRequests.map(req => (
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

           <div className="glass-card p-6 space-y-6 bg-garrison-blue/5 border-garrison-blue/20">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-garrison-blue text-black flex items-center justify-center font-black">?</div>
                 <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">System Guide</h4>
                    <p className="text-[10px] text-zinc-500 font-medium">Accept signals to begin extraction protocols.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
