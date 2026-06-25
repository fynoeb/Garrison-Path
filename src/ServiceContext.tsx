/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, Workshop, SafeSpot } from './types';
import { BASE_COORDINATES, MOCK_WORKSHOPS, MOCK_SAFE_SPOTS } from './constants';
import { fetchNearbyWorkshops, fetchNearbySafeSpots } from './services/overpassService';
import { fetchGoogleWorkshops, fetchGoogleSafeSpots } from './services/googleMapsService';
import { db } from './lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc,
  getDoc,
  serverTimestamp,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { useUser } from './UserContext';
import { auth as firebaseAuth } from './lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth.currentUser?.uid,
      email: firebaseAuth.currentUser?.email,
      emailVerified: firebaseAuth.currentUser?.emailVerified,
      isAnonymous: firebaseAuth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type MissionStatus = 'idle' | 'searching' | 'scheduled' | 'confirmed' | 'intercepted' | 'arriving' | 'arrived' | 'completed' | 'cancelled';

interface MissionState {
  id: string | null;
  status: MissionStatus;
  userLocation: { lat: number, lng: number };
  operativeLocation: { lat: number, lng: number };
  serviceCategory: 'emergency' | 'home-service' | 'fuel-delivery';
  paymentMethod: 'cash' | 'wallet';
  issue: string;
  description: string;
  schedule?: string;
  address?: string;
  photo: string | null;
  vehicle: string;
  vehicleType?: 'car' | 'motorcycle';
  estimatedPrice: number;
  offers?: {
    workshopId: string;
    workshopName: string;
    price: number;
    eta: string;
    createdAt: any;
  }[];
  messages: Message[];
  assignedWorkshopId: string | null;
  driverId: string | null;
  distance: string;
  eta: string;
  chatId?: string | null;
  locationName?: string;
  time?: string;
  criticality?: 'low' | 'high' | 'critical';
  isReal?: boolean;
}

interface ServiceContextType {
  mission: MissionState;
  workshops: Workshop[];
  safeSpots: SafeSpot[];
  activeMissions: MissionState[]; // For workshops
  isLoadingVenues: boolean;
  currentChatId: string | null;
  createRequest: (
    issue: string, 
    vehicle: string, 
    description: string, 
    photo: string | null, 
    vehicleType?: 'car' | 'motorcycle', 
    serviceCategory?: 'emergency' | 'home-service' | 'fuel-delivery',
    paymentMethod?: 'cash' | 'wallet',
    schedule?: string,
    address?: string
  ) => Promise<void>;
  cancelRequest: () => Promise<void>;
  acceptMission: (missionId: string, workshopId: string) => Promise<void>;
  sendMessage: (text: string, sender: 'user' | 'mechanic') => Promise<void>;
  submitOffer: (missionId: string, price: number, eta: string) => Promise<void>;
  acceptOffer: (offerIdx: number) => Promise<void>;
  updateMissionStatus: (status: MissionStatus) => Promise<void>;
  selectMission: (missionId: string) => void;
  resetAll: () => void;
  detectLocation: () => void;
  setVehicleType: (type: 'car' | 'motorcycle') => void;
}

const INITIAL_STATE: MissionState = {
  id: null,
  status: 'idle',
  userLocation: BASE_COORDINATES,
  operativeLocation: { lat: BASE_COORDINATES.lat + 0.02, lng: BASE_COORDINATES.lng + 0.02 },
  serviceCategory: 'emergency',
  paymentMethod: 'cash',
  issue: '',
  description: '',
  photo: null,
  vehicle: '',
  vehicleType: 'car',
  estimatedPrice: 0,
  messages: [],
  assignedWorkshopId: null,
  driverId: null,
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
  const { user, role } = useUser();
  const [mission, setMission] = useState<MissionState>(INITIAL_STATE);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>(MOCK_WORKSHOPS);
  const [safeSpots, setSafeSpots] = useState<SafeSpot[]>(MOCK_SAFE_SPOTS);
  const [activeMissions, setActiveMissions] = useState<MissionState[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  // Persistence & Real-time Listeners
  useEffect(() => {
    // Attempt to load persisted location from localStorage
    const savedLocation = localStorage.getItem('garrison_location');
    if (savedLocation) {
      try {
        const loc = JSON.parse(savedLocation);
        setMission(prev => ({
          ...prev,
          userLocation: loc.user,
          operativeLocation: loc.operative
        }));
      } catch (e) {
        console.error("Failed to parse saved location");
      }
    }

    if (!user) {
      setMission(prev => ({ ...INITIAL_STATE, userLocation: prev.userLocation, operativeLocation: prev.operativeLocation }));
      setCurrentChatId(null);
      return;
    }

    let unsub: () => void;

    if (role === 'driver') {
      // Listen for the latest active mission of this driver
      const q = query(
        collection(db, 'missions'),
        where('driverId', '==', user.id),
        where('status', 'not-in', ['completed', 'cancelled']),
        limit(1)
      );

      unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setMission(prev => ({ ...data, id: doc.id, messages: prev.messages } as MissionState));
          if (data.chatId) setCurrentChatId(data.chatId);
        } else {
          setMission(prev => ({ ...INITIAL_STATE, userLocation: prev.userLocation, operativeLocation: prev.operativeLocation }));
          setCurrentChatId(null);
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'missions/driver'));
    } else if (role === 'workshop' || role === 'fuel-partner') {
      // Workshop / Partner Mode: Listen for searching, scheduled and assigned
      const qPool = query(
        collection(db, 'missions'),
        where('status', 'in', ['searching', 'scheduled'])
      );
      const unsubPool = onSnapshot(qPool, (snapshot) => {
        const poolMissions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MissionState));
        setActiveMissions(prev => {
          const assigned = prev.filter(m => m.assignedWorkshopId === user.id && m.status !== 'searching' && m.status !== 'scheduled');
          return [...assigned, ...poolMissions];
        });
      }, (error) => handleFirestoreError(error, OperationType.GET, 'missions/pool'));

      const qAssigned = query(
        collection(db, 'missions'),
        where('assignedWorkshopId', '==', user.id),
        where('status', 'in', ['confirmed', 'intercepted', 'arriving', 'arrived'])
      );
      const unsubAssigned = onSnapshot(qAssigned, (snapshot) => {
        const assignedMissions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MissionState));
        setActiveMissions(prev => {
          const pooling = prev.filter(m => m.status === 'searching' || m.status === 'scheduled');
          return [...pooling, ...assignedMissions];
        });

        if (!snapshot.empty) {
          const currentId = selectedMissionId || snapshot.docs[0].id;
          const found = assignedMissions.find(m => m.id === currentId) || assignedMissions[0];
          if (found) {
            setMission(prev => ({ ...found, messages: prev.messages }));
            if (found.chatId) setCurrentChatId(found.chatId);
          }
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'missions/assigned'));

      unsub = () => {
        unsubPool();
        unsubAssigned();
      };
    }

    return () => unsub && unsub();
  }, [user, role]);

  // Messages real-time listener (Subcollection Chat Messages)
  useEffect(() => {
    if (!currentChatId) return;

    const q = query(
      collection(db, `chats/${currentChatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        let roleLabel = data.senderRole || (data.senderId === mission.driverId ? 'driver' : 'workshop');

        return {
          id: doc.id,
          senderId: data.senderId,
          senderRole: roleLabel as any,
          text: data.text,
          timestamp: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        } as Message;
      });
      setMission(prev => ({ ...prev, messages }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `chats/${currentChatId}/messages`));

    return () => unsub();
  }, [currentChatId, mission.driverId]);

  const loadRealVenues = async (lat: number, lng: number, vehicleType?: 'car' | 'motorcycle') => {
    setIsLoadingVenues(true);
    const googleKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
    const hasValidGoogleKey = googleKey && !googleKey.includes('YOUR_API_KEY') && googleKey.length > 20;
    const vType = vehicleType || mission.vehicleType || 'car';

    try {
      let realWorkshops: Workshop[] = [];
      let realSafeSpots: SafeSpot[] = [];

      [realWorkshops, realSafeSpots] = await Promise.all([
        fetchNearbyWorkshops(lat, lng),
        fetchNearbySafeSpots(lat, lng)
      ]);

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
          console.warn("Google Maps fallback failed");
        }
      }
      
      setWorkshops(realWorkshops.map(w => ({ ...w, distance: calculateDistance(lat, lng, w.lat, w.lng) })));
      setSafeSpots(realSafeSpots.map(s => ({ ...s, distance: calculateDistance(lat, lng, s.lat, s.lng) })));
    } catch (e) {
      console.error("Venue sync failed", e);
    } finally {
      setIsLoadingVenues(false);
    }
  };

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const userLoc = { lat: latitude, lng: longitude };
        const opLoc = { lat: latitude + 0.015, lng: longitude + 0.015 };
        
        setMission(prev => ({
          ...prev,
          userLocation: userLoc,
          operativeLocation: opLoc
        }));

        localStorage.setItem('garrison_location', JSON.stringify({
          user: userLoc,
          operative: opLoc
        }));

        loadRealVenues(latitude, longitude);
      }, (error) => {
        console.warn("Geolocation denied, using center", error);
        loadRealVenues(BASE_COORDINATES.lat, BASE_COORDINATES.lng);
      });
    }
  };

  // 4. Workshop Real-time Location Sync
  useEffect(() => {
    if (role !== 'workshop' || !mission.id) return;

    const interval = setInterval(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          updateDoc(doc(db, 'missions', mission.id!), {
            operativeLocation: { lat: latitude, lng: longitude },
            updatedAt: serverTimestamp()
          }).catch(console.error);
        });
      }
    }, 10000); // 10s sync

    return () => clearInterval(interval);
  }, [role, mission.id]);

  const createRequest = async (
    issue: string, 
    vehicle: string, 
    description: string, 
    photo: string | null, 
    vehicleType?: 'car' | 'motorcycle', 
    serviceCategory?: 'emergency' | 'home-service' | 'fuel-delivery',
    paymentMethod?: 'cash' | 'wallet',
    schedule?: string,
    address?: string
  ) => {
    if (!user) return;
    
    // Simple estimating logic
    const basePrices = {
      'emergency': 50000,
      'home-service': 35000,
      'fuel-delivery': 20000
    };
    const cat = serviceCategory || mission.serviceCategory;
    const base = basePrices[cat] || 50000;
    
    // Distance multiplier (dummy logic since we don't know the distance to EVERY workshop yet)
    // But we can estimate it being 2-5km on average
    const estPrice = base + (15000 * 3); // Assume 3km avg

    const newMission = {
      driverId: user.id,
      status: schedule ? 'scheduled' : 'searching',
      issue,
      description,
      schedule: schedule || null,
      address: address || null,
      photo,
      vehicle,
      vehicleType: vehicleType || mission.vehicleType,
      serviceCategory: cat,
      paymentMethod: paymentMethod || mission.paymentMethod,
      estimatedPrice: estPrice,
      userLocation: mission.userLocation,
      operativeLocation: mission.operativeLocation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      distance: '0.0 km',
      eta: '0 mins'
    };

    try {
      await addDoc(collection(db, 'missions'), newMission);
    } catch (error) {
      console.error("Failed to create request", error);
    }
  };

  const cancelRequest = async () => {
    if (!mission.id) return;
    try {
      await updateDoc(doc(db, 'missions', mission.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to cancel request", error);
    }
  };

  const acceptMission = async (missionId: string, workshopId: string) => {
    if (!missionId) return;
    try {
      await updateDoc(doc(db, 'missions', missionId), {
        status: 'confirmed',
        assignedWorkshopId: workshopId,
        workshopId: workshopId, // Maintain both for compatibility
        updatedAt: serverTimestamp()
      });
      // Initial message
      const msgRef = collection(db, `missions/${missionId}/messages`);
      await addDoc(msgRef, {
        senderId: workshopId,
        senderRole: 'workshop',
        text: 'Pesanan diterima. Saya sedang menuju lokasi Anda.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to accept mission", error);
    }
  };

  const updateMissionStatus = async (status: MissionStatus) => {
    if (!mission.id) return;
    try {
      await updateDoc(doc(db, 'missions', mission.id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const submitOffer = async (missionId: string, price: number, eta: string) => {
    if (!user || role !== 'workshop') return;
    try {
      const missionRef = doc(db, 'missions', missionId);
      const snap = await getDoc(missionRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const offers = data.offers || [];
      
      // Don't duplicate offers from same workshop
      if (offers.some((o: any) => o.workshopId === user.id)) return;

      await updateDoc(missionRef, {
        offers: [...offers, {
          workshopId: user.id,
          workshopName: user.workshopName || user.name,
          price,
          eta,
          createdAt: new Date().toISOString()
        }]
      });
    } catch (error) {
      console.error("Failed to submit offer", error);
    }
  };

  const acceptOffer = async (offerIdx: number) => {
    if (!mission.id || !mission.offers || !mission.offers[offerIdx]) return;
    const offer = mission.offers[offerIdx];
    try {
      await updateDoc(doc(db, 'missions', mission.id), {
        status: 'confirmed',
        assignedWorkshopId: offer.workshopId,
        workshopId: offer.workshopId, // compatibility
        estimatedPrice: offer.price,
        eta: offer.eta,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to accept offer", error);
    }
  };

  const sendMessage = async (text: string, sender: 'user' | 'mechanic') => {
    if (!user || !mission.id) return;
    
    try {
      let chatId = currentChatId;
      
      // If no chat, create one
      if (!chatId) {
        const chatRef = collection(db, 'chats');
        const participants = [mission.driverId, user.id].filter(Boolean) as string[];
        const newChat = await addDoc(chatRef, {
          requestId: mission.id,
          participants,
          createdAt: serverTimestamp()
        });
        chatId = newChat.id;
        setCurrentChatId(chatId);
        
        // Update mission with chatId
        await updateDoc(doc(db, 'missions', mission.id), {
          chatId: chatId,
          updatedAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, `chats/${chatId}/messages`), {
        senderId: user.id,
        senderRole: role,
        text,
        participants: [mission.driverId, user.id].filter(Boolean) as string[],
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const setVehicleType = (type: 'car' | 'motorcycle') => {
    setMission(prev => ({ ...prev, vehicleType: type }));
  };

  const selectMission = (missionId: string) => {
    setSelectedMissionId(missionId);
    const selected = activeMissions.find(m => m.id === missionId);
    if (selected) {
      setMission(selected);
      if (selected.chatId) setCurrentChatId(selected.chatId);
    }
  };

  const resetAll = () => setMission(prev => ({
    ...INITIAL_STATE,
    userLocation: prev.userLocation,
    operativeLocation: prev.operativeLocation
  }));
  
  const value = {
    mission,
    workshops,
    safeSpots,
    activeMissions,
    isLoadingVenues,
    currentChatId,
    createRequest,
    cancelRequest,
    acceptMission,
    sendMessage,
    submitOffer,
    acceptOffer,
    updateMissionStatus,
    selectMission,
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
