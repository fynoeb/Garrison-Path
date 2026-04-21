/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workshop, SafeSpot, Message } from './types';

export const PADANG_CENTER = { lat: -0.9471, lng: 100.4172 };

export const MOCK_WORKSHOPS: Workshop[] = [
  {
    id: 'w1',
    name: 'Garrison Primary Hub 01',
    lat: PADANG_CENTER.lat + 0.005,
    lng: PADANG_CENTER.lng + 0.005,
    address: 'Central Service Sector (Scanning Distance)',
    rating: 4.9,
    services: ['Engine', 'Electrical', 'Battery']
  },
  {
    id: 'w2',
    name: 'Sector 4 Support Point',
    lat: PADANG_CENTER.lat - 0.045,
    lng: PADANG_CENTER.lng + 0.045,
    address: 'Regional Support Zone (5.2km)',
    rating: 4.6,
    services: ['Tires', 'Suspension', 'Emergency']
  }
];

export const MOCK_SAFE_SPOTS: SafeSpot[] = [
  {
    id: 's1',
    name: 'Tactical Shelter Alpha',
    type: 'Safe Zone',
    lat: PADANG_CENTER.lat + 0.001,
    lng: PADANG_CENTER.lng + 0.001,
    address: 'Verified Secure Perimeter (120m)'
  },
  {
    id: 's2',
    name: 'Emergency Hub: Sector 0',
    type: 'Safe Zone',
    lat: PADANG_CENTER.lat - 0.002,
    lng: PADANG_CENTER.lng + 0.001,
    address: 'Secure Extraction Point (350m)'
  }
];

export const MOCK_CHAT: Message[] = [
  {
    id: 'm1',
    sender: 'mechanic',
    text: 'System Link Established. This is Arthur from Garrison Control. Signal received.',
    timestamp: '08:40'
  },
  {
    id: 'm2',
    sender: 'user',
    text: 'Understood. Operational failure detected near the Grand Mosque grid.',
    timestamp: '08:41'
  },
  {
    id: 'm3',
    sender: 'mechanic',
    text: 'Unit #4421 is in transit. Engaging precision sensors. Arrival in 12 pings.',
    timestamp: '08:42'
  }
];
