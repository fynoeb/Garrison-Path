/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workshop, SafeSpot } from '../types';

export async function fetchNearbyWorkshops(lat: number, lng: number, radius: number = 15000): Promise<Workshop[]> {
  const query = `[out:json];(node(around:${radius},${lat},${lng})["shop"~"car_repair|motorcycle_repair"];way(around:${radius},${lat},${lng})["shop"~"car_repair|motorcycle_repair"];);out center;`;
  
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (response.status === 429) {
      console.warn("Overpass API rate limit (workshops) exceeded. Using fallback sensors.");
      return [];
    }
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    return data.elements.map((el: any) => {
      const tags = el.tags || {};
      const street = tags['addr:street'] || tags['addr:full'] || '';
      const housenumber = tags['addr:housenumber'] || '';
      const suburb = tags['addr:suburb'] || '';
      const city = tags['addr:city'] || 'Padang';
      
      const fullAddress = street 
        ? `${street} ${housenumber}${suburb ? ', ' + suburb : ''}, ${city}`.trim()
        : `${suburb ? suburb + ', ' : ''}${city}`;

      const isMotorcycle = (tags.shop === 'motorcycle_repair') || (tags.amenity === 'motorcycle_parking');
      const isCar = (tags.shop === 'car_repair') || !isMotorcycle;

      return {
        id: el.id.toString(),
        name: tags.name || 'Anonymous Workshop',
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        address: fullAddress || 'Padang Area Location',
        rating: 4.5,
        services: ['Engine Repair', 'Maintenance', 'Emergency Service'],
        photo: `https://picsum.photos/seed/${el.id}/400/250`,
        mapsUrl: `https://www.openstreetmap.org/?mlat=${el.lat || el.center?.lat}&mlon=${el.lon || el.center?.lon}#map=17/${el.lat || el.center?.lat}/${el.lon || el.center?.lon}`,
        suitableFor: isMotorcycle && isCar ? ['car', 'motorcycle'] : isMotorcycle ? ['motorcycle'] : ['car']
      };
    });
  } catch (error) {
    console.error("Overpass error:", error);
    return [];
  }
}

export async function fetchNearbySafeSpots(lat: number, lng: number, radius: number = 2000): Promise<SafeSpot[]> {
  const query = `[out:json];(node(around:${radius},${lat},${lng})["shop"~"convenience|supermarket"];node(around:${radius},${lat},${lng})["amenity"~"fuel|cafe|restaurant"];);out center;`;
  
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (response.status === 429) {
      console.warn("Overpass API rate limit (safe spots) exceeded. Using fallback sensors.");
      return [];
    }
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    return data.elements.map((el: any) => {
      const tags = el.tags || {};
      return {
        id: el.id.toString(),
        name: tags.name || 'Nearby Point',
        type: tags.shop ? 'Convenience' : (tags.amenity || 'Public Space'),
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        address: tags['addr:street'] ? `${tags['addr:street']} ${tags['addr:housenumber'] || ''}` : 'Sector 0',
        photo: `https://picsum.photos/seed/${el.id}/400/250`,
        mapsUrl: `https://www.openstreetmap.org/?mlat=${el.lat || el.center?.lat}&mlon=${el.lon || el.center?.lon}#map=17/${el.lat || el.center?.lat}/${el.lon || el.center?.lon}`,
        suitableFor: ['car', 'motorcycle']
      };
    });
  } catch (error) {
    console.error("Overpass error:", error);
    return [];
  }
}
