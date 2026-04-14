import { TripsLayer } from '@deck.gl/geo-layers';
import { PathLayer } from '@deck.gl/layers';

export const createTrafficLayer = (
  roadsData: any[],
  currentTime: number,
  visible: boolean = true
) => {
  if (!visible || !roadsData || roadsData.length === 0) return null;

  return new TripsLayer({
    id: 'traffic-trips',
    data: roadsData,
    getPath: (d: any) => d.path,
    getTimestamps: (d: any) => d.timestamps,
    getColor: (d: any) => d.color,
    opacity: 0.8,
    widthMinPixels: 3,
    rounded: true,
    trailLength: 180,
    currentTime: currentTime % 1000,
    shadowEnabled: false
  });
};

// Helper to generate simulated traffic from road GeoJSON
export const processRoadsToTrips = (features: any[]) => {
  const trips: any[] = [];
  
  features.forEach((feature: any, fIdx: number) => {
    if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates;
      const isCongested = Math.random() > 0.7; // 30% chance of traffic jam
      const color = isCongested ? [255, 50, 50] : [50, 255, 50]; // Red vs Green
      const speed = isCongested ? 0.2 : 1.0;
      
      // Create multiple "cars" on this road
      const numCars = Math.floor(coords.length / 2) + 1;
      for (let i = 0; i < numCars; i++) {
        const offset = Math.random() * 1000;
        const timestamps = coords.map((_: any, cIdx: number) => offset + (cIdx * 50 / speed));
        
        trips.push({
          path: coords,
          timestamps: timestamps,
          color: color,
          id: `${fIdx}-${i}`
        });
      }
    }
  });
  
  return trips;
};
