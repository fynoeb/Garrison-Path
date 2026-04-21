/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, Workshop, SafeSpot } from './types';
import { PADANG_CENTER, MOCK_WORKSHOPS, MOCK_SAFE_SPOTS } from './constants';
import { fetchNearbyWorkshops, fetchNearbySafeSpots } from './services/overpassService';
import { fetchGoogleWorkshops, fetchGoogleSafeSpots } from './services/googleMapsService';

export type MissionStatus = 'idle' | 'searching' | 'confirmed' | 'arriving' | 'arrived';

interface MissionState {
  id: string | null;
  status: MissionStatus;
  userLocation: { lat: number, lng: number };
  operativeLocation: { lat: number, lng: number };
  issue: string;
  description: string;
  photo: string | null;
  vehicle: string;
  vehicleType?: 'car' | 'motorcycle';
  messages: Message[];
  assignedWorkshopId: string | null;
  distance: string;
  eta: string;
}

interface ServiceContextType {
  mission: MissionState;
  workshops: Workshop[];
  safeSpots: SafeSpot[];
  isLoadingVenues: boolean;
  createRequest: (issue: string, vehicle: string, description: string, photo: string | null, vehicleType?: 'car' | 'motorcycle') => void;
  cancelRequest: () => void;
  acceptMission: (workshopId: string) => void;
  sendMessage: (text: string, sender: 'user' | 'mechanic') => void;
  resetAll: () => void;
  detectLocation: () => void;
  setVehicleType: (type: 'car' | 'motorcycle') => void;
}

const INITIAL_STATE: MissionState = {
  id: null,
  status: 'idle',
  userLocation: PADANG_CENTER,
  operativeLocation: { lat: PADANG_CENTER.lat + 0.02, lng: PADANG_CENTER.lng + 0.02 },
  issue: '',
  description: '',
  photo: null,
  vehicle: '',
  vehicleType: 'car',
  messages: [],
  assignedWorkshopId: null,
  distance: '0.0 km',
  eta: '0 mins'
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [mission, setMission] = useState<MissionState>(INITIAL_STATE);
  const [workshops, setWorkshops] = useState<Workshop[]>(MOCK_WORKSHOPS);
  const [safeSpots, setSafeSpots] = useState<SafeSpot[]>(MOCK_SAFE_SPOTS);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);

  // Load real data (Prefer OSM, use Google as fallback ONLY if key is valid)
  const loadRealVenues = async (lat: number, lng: number, vehicleType?: 'car' | 'motorcycle') => {
    setIsLoadingVenues(true);
    const googleKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
    const hasValidGoogleKey = googleKey && !googleKey.includes('YOUR_API_KEY') && googleKey.length > 20;
    const vType = vehicleType || mission.vehicleType || 'car';

    try {
      let realWorkshops: Workshop[] = [];
      let realSafeSpots: SafeSpot[] = [];

      // ALWAYS TRY OSM FIRST
      [realWorkshops, realSafeSpots] = await Promise.all([
        fetchNearbyWorkshops(lat, lng),
        fetchNearbySafeSpots(lat, lng)
      ]);

      // ONLY if OSM fails or returns nothing, and we have a valid key, try Google
      if ((realWorkshops.length === 0 || realSafeSpots.length === 0) && hasValidGoogleKey) {
        try {
          const workshopKeywords = vType === 'motorcycle' 
            ? 'motorcycle repair mechanic spare parts' 
            : 'car repair mechanic workshop';
            
          const [gWorkshops, gSafeSpots] = await Promise.all([
            fetchGoogleWorkshops(lat, lng, workshopKeywords),
            fetchGoogleSafeSpots(lat, lng)
          ]);
          
          if (realWorkshops.length === 0) realWorkshops = gWorkshops;
          if (realSafeSpots.length === 0) realSafeSpots = gSafeSpots;
        } catch (error) {
          console.warn("Google Maps fallback failed, using OSM results (if any)");
        }
      }
      
      // LOGICAL DUMMY DATA GENERATOR (Tight Proximity)
      // We ensure several tactical points are extremely close to the user's unit position
      if (realWorkshops.length < 4) {
        const dummyWorkshops: Workshop[] = [
          {
            id: 'v-hub-alpha',
            name: vType === 'motorcycle' ? 'Garrison Moto-Specialist' : 'Garrison Hub: Alpha Sector',
            lat: lat + 0.0012,
            lng: lng + 0.0008,
            address: 'Command Sector (150m)',
            rating: 4.9,
            services: vType === 'motorcycle' ? ['Chain Svc', 'Oil', 'Battery'] : ['Full Diagnostics', 'Quick Repair', 'Battery'],
            suitableFor: vType === 'motorcycle' ? ['motorcycle'] : ['car']
          },
          {
            id: 'v-hub-beta',
            name: vType === 'motorcycle' ? 'Garrison Moto Care' : 'Garrison Tactical Mechanics',
            lat: lat - 0.0015,
            lng: lng + 0.0012,
            address: 'Rapid Defense Point (250m)',
            rating: 4.8,
            services: ['Tires', 'Electrical', 'Towing'],
            suitableFor: ['car', 'motorcycle']
          }
        ];
        realWorkshops = [...realWorkshops, ...dummyWorkshops];
      }

      if (realSafeSpots.length < 4) {
        const dummySafeSpots: SafeSpot[] = [
          {
            id: 's-gas-01',
            name: 'Garrison Refuel Point',
            type: 'Gas Station',
            lat: lat + 0.0006,
            lng: lng + 0.0007,
            address: 'Tactical Fuel Support (100m)',
            photo: 'https://images.unsplash.com/photo-1545142125-94736f1c485f?auto=format&fit=crop&q=80&w=400',
            suitableFor: ['car', 'motorcycle']
          },
          {
            id: 's-rest-01',
            name: 'Garrison Rest Stop',
            type: 'Rest Stop',
            lat: lat - 0.0004,
            lng: lng - 0.0005,
            address: 'Garrison Comfort Node (60m)',
            photo: 'https://images.unsplash.com/photo-1542010589005-d1eacc3918f2?auto=format&fit=crop&q=80&w=400',
            suitableFor: ['car', 'motorcycle']
          }
        ];
        realSafeSpots = [...realSafeSpots, ...dummySafeSpots];
      }
      
      setWorkshops(realWorkshops.map(w => ({ ...w, distance: calculateDistance(lat, lng, w.lat, w.lng) })));
      setSafeSpots(realSafeSpots.map(s => ({ ...s, distance: calculateDistance(lat, lng, s.lat, s.lng) })));
    } catch (e) {
      console.error("Venue sync failed", e);
    } finally {
      setIsLoadingVenues(false);
    }
  };

  // Detect real location on mount or when requested
  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setMission(prev => ({
          ...prev,
          userLocation: { lat: latitude, lng: longitude },
          operativeLocation: { lat: latitude + 0.015, lng: longitude + 0.015 }
        }));
        loadRealVenues(latitude, longitude);
      }, (error) => {
        console.warn("Geolocation denied, using center", error);
        loadRealVenues(PADANG_CENTER.lat, PADANG_CENTER.lng);
      });
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // Re-sync venues when vehicle type changes
  useEffect(() => {
    if (mission.userLocation) {
      loadRealVenues(mission.userLocation.lat, mission.userLocation.lng, mission.vehicleType);
    }
  }, [mission.vehicleType]);

  // Simulated Operative Movement & Calculation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mission.status === 'confirmed' || mission.status === 'arriving') {
      interval = setInterval(() => {
        setMission(prev => {
          const latDiff = prev.userLocation.lat - prev.operativeLocation.lat;
          const lngDiff = prev.userLocation.lng - prev.operativeLocation.lng;
          
          // distance in degrees approx
          const distDeg = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2));
          const distKm = distDeg * 111; // 1 degree ~ 111km
          const etaMin = Math.ceil(distKm * 2); // 2 mins per km simulation

          // Move closer
          const stepSize = 0.02; // move 2% closer per tick
          const newLat = prev.operativeLocation.lat + latDiff * stepSize;
          const newLng = prev.operativeLocation.lng + lngDiff * stepSize;
          
          let nextStatus = prev.status;
          if (distKm < 0.1) {
            nextStatus = 'arrived';
          } else if (distKm < 0.5) {
            nextStatus = 'arriving';
          }

          return {
            ...prev,
            operativeLocation: { lat: newLat, lng: newLng },
            status: nextStatus,
            distance: distKm.toFixed(1) + ' km',
            eta: etaMin + ' mins'
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mission.status]);

  const createRequest = (issue: string, vehicle: string, description: string, photo: string | null, vehicleType?: 'car' | 'motorcycle') => {
    setMission(prev => ({
      ...prev,
      id: `REQ-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      status: 'searching',
      issue,
      description,
      photo,
      vehicle,
      vehicleType: vehicleType || prev.vehicleType,
      messages: []
    }));
  };

  const setVehicleType = (type: 'car' | 'motorcycle') => {
    setMission(prev => ({ ...prev, vehicleType: type }));
  };

  const cancelRequest = () => {
    setMission(INITIAL_STATE);
  };

  const acceptMission = (workshopId: string) => {
    setMission(prev => ({
      ...prev,
      status: 'confirmed',
      assignedWorkshopId: workshopId,
      messages: [
        ...prev.messages,
        {
          id: Date.now().toString(),
          sender: 'mechanic',
          text: 'Signal accepted. I am moving to your coordinates now.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }));
  };

  const sendMessage = (text: string, sender: 'user' | 'mechanic') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMission(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  };

  const resetAll = () => setMission(INITIAL_STATE);
  
  const value = {
    mission,
    workshops,
    safeSpots,
    isLoadingVenues,
    createRequest,
    cancelRequest,
    acceptMission,
    sendMessage,
    resetAll,
    detectLocation,
    setVehicleType
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
}
