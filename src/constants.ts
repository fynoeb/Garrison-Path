/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workshop, SafeSpot, Message } from './types';

export const BASE_COORDINATES = { lat: -0.943, lng: 100.362 };

export const MOCK_WORKSHOPS: Workshop[] = [
  {
    id: 'w1',
    name: 'Bengkel Maju Jaya',
    lat: BASE_COORDINATES.lat + 0.005,
    lng: BASE_COORDINATES.lng + 0.005,
    address: 'Jl. Utama No. 12',
    rating: 4.9,
    services: ['Engine', 'Electrical', 'Battery']
  },
  {
    id: 'w2',
    name: 'Bengkel Karya Motor',
    lat: BASE_COORDINATES.lat - 0.045,
    lng: BASE_COORDINATES.lng + 0.045,
    address: 'Jl. Lintas Sektor No. 45',
    rating: 4.6,
    services: ['Tires', 'Suspension', 'Emergency']
  }
];

export const MOCK_SAFE_SPOTS: SafeSpot[] = [
  {
    id: 's1',
    name: 'Indomaret Sudirman 2',
    type: 'Rest Area',
    lat: -0.9432,
    lng: 100.3621,
    address: 'Jl. Pusat Niaga No.14',
    mapsUrl: 'https://maps.app.goo.gl/MjGaCYd9DEdSFUpr9'
  },
  {
    id: 's2',
    name: 'SPBU Pertamina 14.251.512',
    type: 'Gas Station',
    lat: -0.9429,
    lng: 100.3615,
    address: 'Jl. Pusat Niaga No.8',
    mapsUrl: 'https://maps.app.goo.gl/cpCRkgRWpayRnpGp8'
  }
];

export const MOCK_CHAT: Message[] = [
  {
    id: 'm1',
    sender: 'mechanic',
    text: 'Halo! Saya Andi, montir Anda sudah ditemukan.',
    timestamp: '08:40'
  },
  {
    id: 'm2',
    sender: 'user',
    text: 'Baik, terima kasih. Saya mogok di dekat Masjid Raya.',
    timestamp: '08:41'
  },
  {
    id: 'm3',
    sender: 'mechanic',
    text: 'Montir sedang dalam perjalanan ke lokasi Anda. Estimasi tiba 12 menit.',
    timestamp: '08:42'
  }
];

export const VEHICLE_DATA = {
  motorcycle: {
    'Honda': ['Beat', 'Beat Street', 'Vario 125', 'Vario 160', 'PCX 160', 'Scoopy', 'ADV 160', 'CBR150R', 'CB150R', 'Sonic 150R', 'Revo', 'Blade', 'Mega Pro', 'CRF150L', 'EM1 e:', 'CUV e:', 'ICON e:'],
    'Yamaha': ['Mio M3', 'Mio S', 'Mio Z', 'NMAX', 'NMAX Connected', 'Aerox 155', 'R15', 'MT-15', 'Vixion', 'XSR 155', 'Lexi', 'Fazzio', 'FreeGo', 'WR155R', 'E-01', "Neo's EV"],
    'Suzuki': ['Satria F150', 'GSX-R150', 'GSX-S150', 'Address', 'Nex II'],
    'Kawasaki': ['KLX 150', 'D-Tracker 150', 'Ninja 250', 'Ninja ZX-25R', 'W175', 'Versys X-300', 'Z125'],
    'TVS': ['Apache RTR 150', 'Apache RTR 160', 'Ntorq 125'],
    'Alva': ['Alva One', 'Alva Cervo'],
    'United': ['TX1800', 'T1800'],
    'Gesits': ['G1'],
    'Volta': ['401'],
    'Other': ['Sebutkan lainnya...']
  },
  car: {
    'Toyota': ['Avanza', 'Veloz', 'Rush', 'Raize', 'Calya', 'Agya', 'Yaris', 'Vios', 'Fortuner', 'Kijang Innova', 'Kijang Innova Zenix', 'Camry', 'Corolla', 'Land Cruiser', 'Kijang Innova Zenix HEV', 'Corolla Cross HEV', 'Yaris Cross HEV', 'C-HR HEV', 'Prius HEV'],
    'Honda': ['Brio', 'Jazz', 'City', 'HR-V', 'BR-V', 'CR-V', 'Freed', 'Civic', 'WR-V', 'Accord', 'Elevate', 'CR-V HEV', 'Jazz HEV'],
    'Daihatsu': ['Xenia', 'Sigra', 'Terios', 'Rocky', 'Ayla', 'Gran Max', 'Luxio'],
    'Mitsubishi': ['Xpander', 'Xpander Cross', 'Pajero Sport', 'Outlander', 'Eclipse Cross', 'L300', 'Outlander PHEV'],
    'Suzuki': ['Ertiga', 'XL7', 'Baleno', 'Ignis', 'APV', 'Jimny', 'Grand Vitara', 'Grand Vitara HEV'],
    'Hyundai': ['Stargazer', 'Stargazer X', 'Creta', 'Ioniq 5', 'Ioniq 6', 'Kona EV', 'Palisade', 'Santa Fe', 'Tucson', 'i20'],
    'Wuling': ['Confero', 'Cortez', 'Almaz', 'Alvez', 'Air EV', 'Binguo EV'],
    'BYD': ['Atto 3', 'Seal', 'Dolphin', 'M6', 'Sealion 6'],
    'MG': ['ZS EV', 'MG4 EV', 'MG5'],
    'Neta': ['V-II', 'GT'],
    'Chery': ['Omoda 5', 'Omoda 5 GT', 'Tiggo 8'],
    'DFSK': ['Glory 580', 'Glory 500', 'Gelora'],
    'Kia': ['Sonet', 'Seltos', 'Carnival', 'Sportage HEV', 'Niro HEV'],
    'Nissan': ['Livina', 'Terra', 'Magnite', 'Kicks', 'Serena', 'X-Trail'],
    'Other': ['Sebutkan lainnya...']
  }
};
