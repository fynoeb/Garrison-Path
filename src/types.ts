/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'driver' | 'workshop';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  vehicle?: {
    brand: string;
    series: string;
    type?: 'car' | 'motorcycle';
  };
  workshopName?: string;
}

export interface Workshop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  services: string[];
  photo?: string;
  phone?: string;
  mapsUrl?: string;
  distance?: string;
  suitableFor?: ('car' | 'motorcycle')[];
}

export interface ServiceRequest {
  id: string;
  userId: string;
  vehicleBrand: string;
  vehicleSeries: string;
  issueCategory: 'Engine' | 'Flat Tire' | 'Battery' | 'Fuel' | 'Other';
  description: string;
  status: 'Searching' | 'Found' | 'On The Way' | 'Ongoing' | 'Completed';
  workshopId?: string;
  timestamp: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'mechanic';
  text: string;
  timestamp: string;
}

export interface SafeSpot {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  photo?: string;
  mapsUrl?: string;
  distance?: string;
  suitableFor?: ('car' | 'motorcycle')[];
}
