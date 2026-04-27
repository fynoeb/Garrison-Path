import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { PADANG_CENTER } from '../constants';
import { useLanguage } from '../LanguageContext';
import { useService } from '../ServiceContext';
import { useEffect } from 'react';
import { cn } from '../lib/utils';
import React from 'react';

// Custom icons with increased visual clarity
const workshopIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #00f2ff; width: 24px; height: 24px; border-radius: 6px; border: 2px solid white; box-shadow: 0 0 15px #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: black;">W</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const fuelIcon = L.divIcon({
  className: 'fuel-div-icon',
  html: `<div style="background-color: #ff9f0a; width: 20px; height: 20px; border-radius: 5px; border: 2px solid white; box-shadow: 0 0 12px #ff9f0a; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: black;">F</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const restIcon = L.divIcon({
  className: 'rest-div-icon',
  html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 5px; border: 2px solid white; box-shadow: 0 0 12px #10b981; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: black;">P</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const utilityIcon = L.divIcon({
  className: 'utility-div-icon',
  html: `<div style="background-color: #fce303; width: 14px; height: 14px; border-radius: 50%; border: 2px solid black; box-shadow: 0 0 8px #fce303;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const userIcon = L.divIcon({
  className: 'user-div-icon',
  html: `<div style="background-color: white; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #00f2ff; box-shadow: 0 0 20px #00f2ff;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const operativeIcon = L.divIcon({
  className: 'operative-div-icon',
  html: `<div class="relative group">
           <div class="absolute inset-0 bg-garrison-blue/30 rounded-full animate-ping"></div>
           <div style="background-color: #00f2ff; width: 18px; height: 18px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 15px #00f2ff; transform: rotate(45deg); display: flex; align-items: center; justify-center: center;">
              <div style="width: 4px; height: 4px; background: black; border-radius: 50%;"></div>
           </div>
         </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapControls({ mission, workshops }: { mission: any, workshops: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (mission.status !== 'idle' && mission.status !== 'searching') {
      const bounds = L.latLngBounds([mission.userLocation.lat, mission.userLocation.lng], [mission.operativeLocation.lat, mission.operativeLocation.lng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (workshops.length > 0) {
      const bounds = L.latLngBounds([mission.userLocation.lat, mission.userLocation.lng]);
      workshops.forEach(shop => bounds.extend([shop.lat, shop.lng]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
    }
  }, [mission.status, mission.operativeLocation, mission.userLocation, workshops, map]);
  return null;
}

export default function MapSection() {
  const { t } = useLanguage();
  const { mission, workshops, safeSpots, isLoadingVenues } = useService();

  const isTracking = mission.status === 'confirmed' || mission.status === 'arriving' || mission.status === 'arrived';

  return (
    <div className="glass-card h-full min-h-[400px] overflow-hidden relative">
      {/* Map Overlay UI */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="glass-card p-3 bg-black/60 backdrop-blur-md">
           <div className="flex items-center gap-2 mb-1">
              <span className={cn("status-pulse", isLoadingVenues && "bg-yellow-400")} />
              <h3 className="font-black text-[10px] tracking-[0.2em] text-garrison-blue uppercase">{isLoadingVenues ? 'Syncing...' : t.telemetry}</h3>
           </div>
           <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
             SENSORS: {mission.status.toUpperCase()}
           </div>
           <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1.5">
             SERVICE: {mission.serviceCategory?.toUpperCase() || 'EMERGENCY'}
           </div>
        </div>

        {/* Legend */}
        <div className="glass-card p-3 bg-black/60 backdrop-blur-md space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#00f2ff] flex items-center justify-center text-[7px] font-black text-black">W</div>
              <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">{t.legendWorkshop}</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#ff9f0a] flex items-center justify-center text-[7px] font-black text-black">F</div>
              <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">{t.legendFuel}</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#10b981] flex items-center justify-center text-[7px] font-black text-black">P</div>
              <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">{t.legendRest}</span>
           </div>
        </div>
      </div>

      <MapContainer 
        center={PADANG_CENTER} 
        zoom={13} 
        className="h-full w-full"
        zoomControl={false}
      >
        <MapControls mission={mission} workshops={workshops} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Workshops */}
        {workshops.map((shop) => (
          <Marker key={shop.id} position={[shop.lat, shop.lng]} icon={workshopIcon}>
            <Tooltip permanent direction="top" className="garrison-map-tooltip">
               <span className="font-black text-[8px] uppercase tracking-tighter text-glow-blue">{shop.name}</span>
            </Tooltip>
            <Popup className="glass-popup">
              <div className="w-[180px] overflow-hidden -m-1">
                {shop.photo && (
                  <div className="h-20 w-full overflow-hidden mb-2">
                    <img 
                      src={shop.photo} 
                      alt={shop.name} 
                      className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-2 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-garrison-blue truncate max-w-[100px]">{shop.name}</h4>
                    <div className="text-right">
                       <span className="text-[9px] font-black text-garrison-blue block">{shop.distance}</span>
                       {shop.rating && (
                         <span className="text-[7px] font-black text-yellow-400">★ {shop.rating.toFixed(1)}</span>
                       )}
                    </div>
                  </div>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-garrison-blue" />
                    {t.workshopDiv}
                  </p>
                  {shop.address && (
                    <p className="text-[8px] text-zinc-400 font-bold leading-tight mt-1 border-t border-white/5 pt-1">
                      {shop.address}
                    </p>
                  )}
                  
                  <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
                    {shop.phone && (
                      <a 
                        href={`tel:${shop.phone}`} 
                        className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center gap-1 transition-colors no-underline"
                      >
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">{t.call}</span>
                      </a>
                    )}
                    {shop.mapsUrl && (
                      <a 
                        href={shop.mapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 px-2 py-1 bg-garrison-blue/20 hover:bg-garrison-blue/30 border border-garrison-blue/30 rounded flex items-center justify-center gap-1 transition-colors no-underline"
                      >
                        <span className="text-[8px] font-black text-garrison-blue uppercase tracking-widest text-center">{t.directions}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Safe Spots */}
        {safeSpots.map((spot) => {
          const typeLower = spot.type.toLowerCase();
          const isGasStation = typeLower.includes('gas') || typeLower.includes('fuel');
          const isRestStop = typeLower.includes('rest') || typeLower.includes('parking') || typeLower.includes('cafe');
          
          let icon = utilityIcon;
          let tooltipClass = "garrison-map-tooltip-yellow";
          let textColor = "text-yellow-500";
          
          if (isGasStation) {
            icon = fuelIcon;
            tooltipClass = "garrison-map-tooltip-orange";
            textColor = "text-orange-500";
          } else if (isRestStop) {
            icon = restIcon;
            tooltipClass = "garrison-map-tooltip-green";
            textColor = "text-emerald-500";
          }

          return (
            <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={icon}>
              <Tooltip permanent direction="bottom" className={tooltipClass}>
                 <span className={cn("font-black text-[8px] uppercase tracking-tighter", textColor)}>
                   {spot.name}
                 </span>
              </Tooltip>
              <Popup className="glass-popup">
              <div className="w-[160px] overflow-hidden -m-1">
                {spot.photo && (
                  <div className="h-16 w-full overflow-hidden mb-2">
                    <img 
                      src={spot.photo} 
                      alt={spot.name} 
                      className="w-full h-full object-cover grayscale brightness-75 transition-all"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-2 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className={cn("font-black text-[10px] uppercase tracking-widest truncate max-w-[100px]", 
                      isGasStation ? "text-orange-400" : isRestStop ? "text-emerald-400" : "text-yellow-400"
                    )}>{spot.name}</h4>
                    <span className="text-[9px] font-black text-zinc-400">{spot.distance}</span>
                  </div>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">{spot.type}</p>
                  {spot.address && (
                    <p className="text-[8px] text-zinc-400 font-bold leading-tight border-t border-white/5 pt-1 mt-1">
                      {spot.address}
                    </p>
                  )}
                  {spot.mapsUrl && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <a 
                        href={spot.mapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full px-2 py-1 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 rounded flex items-center justify-center transition-colors no-underline"
                      >
                        <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">{t.directions}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );})}

        <Marker position={[mission.userLocation.lat, mission.userLocation.lng]} icon={userIcon}>
          <Popup>
            <div className="text-[10px] uppercase font-black tracking-widest text-white">{t.yourPosition}</div>
          </Popup>
        </Marker>

        {isTracking && (
          <>
            <Polyline 
              positions={[
                [mission.userLocation.lat, mission.userLocation.lng],
                [mission.operativeLocation.lat, mission.operativeLocation.lng]
              ]} 
              pathOptions={{ color: '#00f2ff', weight: 4, opacity: 0.5, dashArray: '10, 10' }}
            />
            <Marker position={[mission.operativeLocation.lat, mission.operativeLocation.lng]} icon={operativeIcon}>
              <Popup>
                <div className="text-[10px] uppercase font-black tracking-widest text-garrison-blue">{t.operative} (ETA: {mission.eta})</div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Decorative details */}
      <div className="absolute bottom-4 right-4 z-[1000] text-[8px] uppercase tracking-[0.4em] font-black text-velocity-blue/30 rotate-90 origin-right select-none pointer-events-none">
        GRID_SYNC_STREAM_{mission.id || 'NOLNK'}
      </div>
    </div>
  );
}
