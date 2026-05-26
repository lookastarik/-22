// /src/recon/isochroneGenerator.ts

/**
 * Generates an asymmetric, organic star polygon representing an isochrone
 * around a given coordinate [lng, lat].
 */
export function generateIsochronePolygon(
  center: [number, number],
  minutes: number,
  mode: 'walk' | 'bike' | 'drive'
): any {
  const [lng, lat] = center;
  
  // Base radii in degrees (approximate distances for Walk, Bike, Drive)
  // 1 degree latitude ~ 111km, 1 degree longitude ~ 63km at 55.7N
  let baseRadius = 0.0012; // ~130 meters basic unit
  if (mode === 'walk') {
    baseRadius = minutes * 0.00065; // 5 min walk is approx 300-400m
  } else if (mode === 'bike') {
    baseRadius = minutes * 0.0020;  // 5 min bike is approx 1.2km
  } else {
    baseRadius = minutes * 0.0048;  // 5 min drive is approx 3km
  }

  const numPoints = 16;
  const coordinates: [number, number][] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    
    // Create organic asymmetry by using pseudo-random sine wave variations
    // derived from the angle and the minutes, simulating actual street grid constraints
    const noiseFactor = 0.75 + 
      0.22 * Math.sin(angle * 3 + minutes * 1.5) + 
      0.12 * Math.cos(angle * 5 - minutes * 0.5) +
      0.06 * Math.sin(angle * 8);

    const r = baseRadius * noiseFactor;
    
    // Scale longitude according to Moscow latitude (cos(55.7 deg) ~ 0.56)
    const offsetLng = (r * Math.cos(angle)) / 0.563;
    const offsetLat = r * Math.sin(angle);
    
    coordinates.push([lng + offsetLng, lat + offsetLat]);
  }

  // Close the polygon
  coordinates.push([...coordinates[0]]);

  return {
    type: 'Feature',
    properties: {
      minutes,
      mode,
      areaSqm: Math.round(Math.PI * Math.pow(baseRadius * 111000, 2) * 0.8)
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  };
}

export function generateFullIsochroneGeoJSON(
  center: [number, number],
  mode: 'walk' | 'bike' | 'drive'
): any {
  return {
    type: 'FeatureCollection',
    features: [
      generateIsochronePolygon(center, 15, mode),
      generateIsochronePolygon(center, 10, mode),
      generateIsochronePolygon(center, 5, mode)
    ]
  };
}
