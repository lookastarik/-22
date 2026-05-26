// src/layers/airTraffic.ts
import { TripsLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { FlightState } from '../services/osint/adsbStream';

export const createAirTrafficLayer = (
  flights: FlightState[],
  onHover: (info: any) => void,
  userRole: 'demo' | 'investor' | 'admin',
  visible: boolean = true
) => {
  if (!visible || !flights || flights.length === 0) return [];

  // RBAC Permission check: MILITARY, VIP_JET, GOV layers are visible only to investor or admin
  const hasPremiumAccess = userRole === 'investor' || userRole === 'admin';
  
  // Filter out luxury/premium aircraft categories if the user does not have permission
  const authorizedFlights = flights.filter(f => {
    if (!hasPremiumAccess) {
      // Demo users can only see COMMERCIAL aircraft to preserve corporate and military intelligence
      return f.category === 'COMMERCIAL';
    }
    return true;
  });

  if (authorizedFlights.length === 0) return [];

  // Color matching based on cyber-tactical design guidelines
  const getColorByCategory = (category: string): [number, number, number, number] => {
    switch (category) {
      case 'MILITARY':
        return [239, 68, 68, 220]; // tactical solid red [R, G, B, A]
      case 'GOV':
        return [168, 85, 247, 200]; // deep electronic purple
      case 'VIP_JET':
        return [234, 179, 8, 210]; // gold amber
      case 'COMMERCIAL':
      default:
        return [6, 182, 212, 140]; // neon cyan with lower opacity
    }
  };

  const layers: any[] = [];

  // 1. TripsLayer for Animated Trails
  layers.push(
    new TripsLayer({
      id: 'osint-air-traffic-trails',
      data: authorizedFlights,
      getPath: (d: FlightState) => d.path,
      getTimestamps: (d: FlightState) => d.timestamps,
      getColor: (d: FlightState) => getColorByCategory(d.category),
      getWidth: (d: FlightState) => (d.category === 'MILITARY' ? 4 : 2),
      opacity: 0.9,
      trailLength: 90, // trail length of 90 seconds
      currentTime: Date.now() / 1000, // Sync current time directly in seconds
      widthMinPixels: 2,
      rounded: true,
      shadowEnabled: false,
      updateTriggers: {
        currentTime: [Date.now()],
        getColor: [userRole],
        getWidth: [userRole]
      }
    } as any)
  );

  // 2. ScatterplotLayer for Radar Node Core points
  layers.push(
    new ScatterplotLayer({
      id: 'osint-air-traffic-cores',
      data: authorizedFlights,
      getPosition: (d: FlightState) => [d.lon, d.lat, d.alt],
      getRadius: (d: FlightState) => (d.category === 'MILITARY' ? 35 : 25),
      getFillColor: (d: FlightState) => {
        const baseColor = getColorByCategory(d.category);
        // Make the point cores pulsate slightly or keep them fully bright
        return [baseColor[0], baseColor[1], baseColor[2], 255];
      },
      getLineColor: [255, 255, 255, 200],
      getLineWidth: 2,
      stroked: true,
      radiusMinPixels: 5,
      radiusMaxPixels: 12,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          onHover({
            id: info.object.icao,
            x: info.x,
            y: info.y,
            properties: {
              icao: info.object.icao,
              callsign: info.object.callsign,
              category: info.object.category,
              altitude: Math.round(info.object.alt),
              speed: Math.round(info.object.speed),
              heading: info.object.track,
              latitude: info.object.lat,
              longitude: info.object.lon
            }
          });
        } else {
          onHover(null);
        }
      },
      updateTriggers: {
        getFillColor: [userRole],
        getPosition: [authorizedFlights]
      }
    } as any)
  );

  // 3. TextLayer for HUD-style callsign overlays on top of the nodes
  layers.push(
    new TextLayer({
      id: 'osint-air-traffic-labels',
      data: authorizedFlights,
      getPosition: (d: FlightState) => [d.lon, d.lat, d.alt + 50], // Slightly raised in vertical space
      getText: (d: FlightState) => `${d.callsign}\nALT ${Math.round(d.alt)}m\nGS ${Math.round(d.speed)}km/h`,
      getSize: 11,
      getColor: (d: FlightState) => {
        const baseColor = getColorByCategory(d.category);
        return [baseColor[0], baseColor[1], baseColor[2], 220];
      },
      fontFamily: '"JetBrains Mono", Courier, monospace',
      fontWeight: 'bold',
      getAngle: 0,
      getTextAnchor: 'start',
      getAlignmentBaseline: 'center',
      pixelOffset: [15, 0], // Position callsign details next to the node
      updateTriggers: {
        getPosition: [authorizedFlights],
        getText: [authorizedFlights],
        getColor: [userRole]
      }
    } as any)
  );

  return layers;
};
