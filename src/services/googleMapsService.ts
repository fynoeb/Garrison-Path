/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare global {
  interface Window {
    google: any;
  }
}

import { Workshop, SafeSpot } from '../types';

// Load Google Maps JavaScript API
let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;
  
  // Basic validation to avoid InvalidKeyMapError on obvious placeholders
  if (!apiKey || apiKey.includes('YOUR_API_KEY') || apiKey.length < 20) {
    googleMapsPromise = Promise.reject(new Error("Invalid or placeholder Google Maps API Key"));
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

async function getPlaceDetails(service: any, placeId: string): Promise<{ phone?: string; url?: string }> {
  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId: placeId,
        fields: ['formatted_phone_number', 'url'],
      },
      (place: any, status: string) => {
        if (status === 'OK' && place) {
          resolve({
            phone: place.formatted_phone_number,
            url: place.url,
          });
        } else {
          resolve({});
        }
      }
    );
  });
}

export async function fetchGoogleWorkshops(lat: number, lng: number, keywords: string = 'repair shop mechanic', radius: number = 15000): Promise<Workshop[]> {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("Google Maps API Key missing.");
    return [];
  }

  try {
    await loadGoogleMapsScript(apiKey);
    const google = (window as any).google;
    
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve) => {
      service.nearbySearch(
        {
          location: { lat, lng },
          radius: radius,
          keyword: keywords, 
        },
        async (results: any[], status: string) => {
          if (status === 'OK' && results) {
            const topResults = results.slice(0, 8);
            const workshops = await Promise.all(
              topResults.map(async (place) => {
                const details = await getPlaceDetails(service, place.place_id);
                
                const photoUrl = place.photos && place.photos.length > 0 
                  ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
                  : `https://picsum.photos/seed/${place.place_id}/400/300`;

                return {
                  id: place.place_id || Math.random().toString(),
                  name: place.name || 'Workshop',
                  lat: place.geometry?.location?.lat() || lat,
                  lng: place.geometry?.location?.lng() || lng,
                  address: place.vicinity || 'Local Area',
                  rating: place.rating || 4.2,
                  services: place.types?.map((t: string) => t.replace('_', ' ')) || ['Repair Service'],
                  photo: photoUrl,
                  phone: details.phone,
                  mapsUrl: details.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`
                };
              })
            );
            resolve(workshops);
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.error("Google Maps Workshops error:", error);
    return [];
  }
}

export async function fetchGoogleSafeSpots(lat: number, lng: number, radius: number = 2000): Promise<SafeSpot[]> {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  try {
    await loadGoogleMapsScript(apiKey);
    const google = (window as any).google;
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    const types = ['convenience_store', 'gas_station', 'cafe', 'restaurant', 'rest_area', 'parking'];
    
    const results = await Promise.all(types.map(type => {
      return new Promise<any[]>((resolve) => {
        service.nearbySearch(
          { location: { lat, lng }, radius: radius, type },
          (res: any[], status: string) => {
            if (status === 'OK' && res) {
              resolve(res.slice(0, 5));
            } else {
              resolve([]);
            }
          }
        );
      });
    }));

    const flatResults = results.flat();
    return flatResults.map((place) => {
      const photoUrl = place.photos && place.photos.length > 0 
        ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
        : `https://picsum.photos/seed/${place.place_id}/400/300`;

      return {
        id: place.place_id || Math.random().toString(),
        name: place.name || 'Safety Point',
        type: place.types?.[0]?.replace('_', ' ') || 'Public Space',
        lat: place.geometry?.location?.lat() || lat,
        lng: place.geometry?.location?.lng() || lng,
        address: place.vicinity || 'Nearby',
        photo: photoUrl,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`
      };
    });
  } catch (error) {
    console.error("Google Maps SafeSpots error:", error);
    return [];
  }
}
