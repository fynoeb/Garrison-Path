/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapPin, ShieldAlert, Zap, Lock, Navigation } from 'lucide-react';
import { MOCK_SAFE_SPOTS } from '../constants';
import { useLanguage } from '../LanguageContext';
import { useService } from '../ServiceContext';
import { cn } from '../lib/utils';
import React from 'react';

export default function SafetyInstructions() {
  const { t } = useLanguage();
  const { mission, safeSpots } = useService();
  
  const vType = mission.vehicleType || 'car';

  // Filter spots within 500m and suitable for the vehicle
  const nearbySpots = safeSpots.filter(spot => {
    const dLat = Math.abs(mission.userLocation.lat - spot.lat);
    const dLng = Math.abs(mission.userLocation.lng - spot.lng);
    const isNearby = (dLat + dLng) < 0.005; // ~500m threshold
    const isSuitable = !spot.suitableFor || spot.suitableFor.includes(vType);
    return isNearby && isSuitable;
  });

  const isArrived = mission.status === 'arrived';

  const steps = isArrived ? (
    vType === 'car' ? [
      { id: '01', title: t.carArrivedStep1Title, text: t.carArrivedStep1Text, icon: Zap },
      { id: '02', title: t.carArrivedStep2Title, text: t.carArrivedStep2Text, icon: Lock },
      { id: '03', title: t.step1Title, text: t.step1Text, icon: ShieldAlert }
    ] : [
      { id: '01', title: t.motoArrivedStep1Title, text: t.motoArrivedStep1Text, icon: Zap },
      { id: '02', title: t.motoArrivedStep2Title, text: t.motoArrivedStep2Text, icon: Lock },
      { id: '03', title: t.motoStep1Title, text: t.motoStep1Text, icon: ShieldAlert }
    ]
  ) : (
    vType === 'car' ? [
      { id: '01', title: t.step1Title, text: t.step1Text, icon: Zap },
      { id: '02', title: t.step2Title, text: t.step2Text, icon: Lock },
      { id: '03', title: t.step3Title, text: t.step3Text, icon: ShieldAlert }
    ] : [
      { id: '01', title: t.motoStep1Title, text: t.motoStep1Text, icon: Zap },
      { id: '02', title: t.motoStep2Title, text: t.motoStep2Text, icon: Lock },
      { id: '03', title: t.motoStep3Title, text: t.motoStep3Text, icon: ShieldAlert }
    ]
  );

  const sectionTitle = isArrived ? t.arrivedTitle : t.firstAidTitle;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-6 garrison-stripes-g">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h2 className="font-black text-[11px] uppercase tracking-[0.3em] text-garrison-blue">{t.safetyTitle}</h2>
              <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Nearby Extractions (&lt;500m)</p>
            </div>
            <div className="flex gap-1">
               <div className="w-1 h-1 bg-garrison-blue rounded-full" />
               <div className="w-4 h-1 bg-garrison-blue/30 rounded-full" />
            </div>
          </div>

          <div className="space-y-4">
            {nearbySpots.length > 0 ? nearbySpots.map((spot) => (
              <div key={spot.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4 group hover:bg-white/[0.04] transition-all">
                <div className="p-3 rounded-xl bg-garrison-blue/5 border border-garrison-blue/20 group-hover:bg-garrison-blue group-hover:text-black transition-all">
                   <MapPin size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">{spot.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">{spot.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="garrison-badge bg-garrison-blue/10 text-garrison-blue border border-garrison-blue/20">
                      {t.safeSpotLabel}
                    </span>
                    <span className="text-[8px] font-black text-garrison-blue uppercase tracking-widest bg-garrison-blue/5 px-2 py-0.5 rounded border border-garrison-blue/10">
                      {vType === 'car' ? 'Car Authorized' : 'Moto Authorized'}
                    </span>
                    <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{spot.type}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-20 grayscale">
                 <Navigation className="mb-4" size={32} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white">No spots within 500m</span>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 space-y-8 garrison-stripes-g">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <h2 className="font-black text-[11px] uppercase tracking-[0.3em] text-garrison-blue">{sectionTitle}</h2>
          </div>

          <div className="space-y-10 py-2">
            {steps.map((step) => (
              <div key={step.id} className="flex gap-6 items-start relative group">
                <div className="absolute left-6 top-10 w-[1px] h-10 bg-white/5 group-last:hidden" />
                <div className="relative">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-600 group-hover:border-garrison-blue/50 group-hover:text-garrison-blue transition-all",
                     isArrived && "border-garrison-blue/30 text-garrison-blue/70"
                   )}>
                      <step.icon size={20} />
                   </div>
                   <div className="absolute -top-2 -left-2 text-[9px] font-black text-garrison-blue opacity-50 bg-zinc-950 px-1">{step.id}</div>
                </div>
                <div className="space-y-1 pt-1">
                  <h5 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{step.title}</h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
