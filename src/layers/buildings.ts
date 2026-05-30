import { GeoJsonLayer } from '@deck.gl/layers';

export const createBuildingsLayer = (
  data: any,
  onHover: (info: any) => void, 
  onClick: (info: any) => void, 
  pulse: number = 0,
  selectedId: number | null = null,
  zoom: number = 15
) => {
  // Performance Optimization: Define granular LOD levels
  const isVeryLowDetail = zoom < 11;
  const isLowDetail = zoom >= 11 && zoom < 13;
  const isMediumDetail = zoom >= 13 && zoom < 15;
  const isHighDetail = zoom >= 15;

  // LOD Technique: Filter data based on zoom level to reduce rendering load
  // At lower zoom levels, we only show "significant" assets (e.g., higher value or status)
  let optimizedData = data;
  
  if (data && data.features) {
    if (isVeryLowDetail) {
      // Only show top-tier or anomalous assets at very low zoom
      optimizedData = {
        ...data,
        features: data.features.filter((f: any) => 
          f.properties.status >= 2 || (f.properties.cost && f.properties.cost > 500000000)
        )
      };
    } else if (isLowDetail) {
      // Filter out small, low-value assets at low zoom
      optimizedData = {
        ...data,
        features: data.features.filter((f: any) => 
          f.properties.status >= 2 || (f.properties.cost && f.properties.cost > 100000000)
        )
      };
    }
  }

  const layers = [
    new GeoJsonLayer({
      id: 'buildings-3d',
      data: optimizedData,
      pickable: zoom >= 13, // Disable picking at low zoom for performance
      autoHighlight: isHighDetail,
      highlightColor: [255, 255, 255, 100],
      stroked: isHighDetail, // Only show outlines at high zoom
      lineWidthMinPixels: 1,
      filled: true,
      extruded: !isVeryLowDetail && !isLowDetail, // Disable extrusion at low zoom for performance
      
      // LOD: Simplify elevation calculation
      getElevation: (f: any) => {
        if (isVeryLowDetail || isLowDetail) return 0;
        const height = f?.properties?.height || 20;
        if (f?.properties?.id === selectedId) return height * 1.5;
        return height * 1.1;
      },

      // LOD: Simplify color and line calculations
      getLineColor: (f: any) => {
        if (!isHighDetail) return [0, 0, 0, 0];
        const id = f?.properties?.id;
        if (id === selectedId) {
          return [255, 255, 255, 200 + 55 * pulse];
        }
        const status = f?.properties?.status || 0;
        if (status === 3) return [161, 161, 170, 200]; // Anomalous - Gray
        if (status === 2) return [255, 255, 255, 200]; // Risk - White
        return [255, 255, 255, 100]; // Stable - Faint White
      },

      getLineWidth: (f: any) => {
        if (!isHighDetail) return 0;
        const id = f?.properties?.id;
        if (id === selectedId) return 3;
        return 1;
      },

      getFillColor: (f: any) => {
        const props = f?.properties || {};
        const id = props.id;
        const status = props.status || 0;
        
        if (id === selectedId && isHighDetail) {
          return [255, 255, 255, 100 + 50 * pulse];
        }

        if (status === 3) return [82, 82, 91, 150]; // Anomalous - Dark Gray
        if (status === 2) return [255, 255, 255, 150]; // Risk - White
        
        // Use simpler colors at lower zoom levels
        if (isVeryLowDetail || isLowDetail) return [20, 20, 20, 150];
        
        return [10, 10, 10, 200]; 
      },

      onHover: (info: any) => {
        if (zoom < 13) return; 
        if (info.object) {
          onHover({
            id: info.object.properties.id,
            x: info.x,
            y: info.y,
            properties: info.object.properties
          });
        } else {
          onHover(null);
        }
      },

      onClick: (info: any) => {
        if (zoom < 13) return; 
        if (info.object) {
          onClick({
            id: info.object.properties.id,
            properties: info.object.properties
          });
        }
      },

      updateTriggers: {
        getFillColor: [pulse, selectedId, zoom],
        getLineColor: [pulse, selectedId, zoom],
        getLineWidth: [pulse, selectedId, zoom],
        getElevation: [zoom, selectedId],
        extruded: [zoom]
      },

      transitions: {
        getElevation: {
          duration: 600, // Faster transitions for better responsiveness
          easing: (t: number) => t * (2 - t),
          type: 'interpolation'
        }
      }
    } as any)
  ];

  // Add a "Glow" layer for the selected building only at high zoom
  if (selectedId !== null && isHighDetail) {
    layers.push(
      new GeoJsonLayer({
        id: 'selection-glow',
        data: {
          type: 'FeatureCollection',
          features: data.features.filter((f: any) => f.properties.id === selectedId)
        },
        extruded: true,
        filled: false,
        stroked: true,
        lineWidthMinPixels: 4,
        getElevation: (f: any) => (f?.properties?.height || 20) * 1.15, // Slightly higher
        getLineColor: [255, 255, 255, 100 + 155 * pulse],
        getLineWidth: 6,
        updateTriggers: {
          getLineColor: [pulse]
        }
      } as any)
    );
  }

  return layers;
};

export const createRoiBuildingsLayer = (
  data: any,
  onHover: (info: any) => void, 
  onClick: (info: any) => void, 
  pulse: number = 0,
  selectedId: number | null = null,
  zoom: number = 15
) => {
  const isVeryLowDetail = zoom < 11;
  const isLowDetail = zoom >= 11 && zoom < 13;
  const isMediumDetail = zoom >= 13 && zoom < 15;
  const isHighDetail = zoom >= 15;

  let optimizedData = data;
  
  if (data && data.features) {
    if (isVeryLowDetail) {
      optimizedData = {
        ...data,
        features: data.features.filter((f: any) => 
          f.properties.id === selectedId || f.properties.status >= 2 || (f.properties.cost && f.properties.cost > 500000000)
        )
      };
    } else if (isLowDetail) {
      optimizedData = {
        ...data,
        features: data.features.filter((f: any) => 
          f.properties.id === selectedId || f.properties.status >= 2 || (f.properties.cost && f.properties.cost > 100000000)
        )
      };
    }
  }

  const layers = [
    new GeoJsonLayer({
      id: 'buildings-roi',
      data: optimizedData,
      pickable: zoom >= 13,
      autoHighlight: isHighDetail,
      highlightColor: [255, 255, 255, 60],
      stroked: true,
      lineWidthMinPixels: 1,
      filled: true,
      extruded: !isVeryLowDetail && !isLowDetail,
      
      getElevation: (f: any) => {
        if (isVeryLowDetail || isLowDetail) return 0;
        const height = f?.properties?.height || 20;
        if (f?.properties?.id === selectedId) return height * 1.5;
        return height * 1.1;
      },

      getLineColor: (f: any) => {
        const id = f?.properties?.id;
        if (id === selectedId) {
          return [255, 191, 0, 220 + 35 * pulse]; // Active Gold for highlight
        }
        const roi = f?.properties?.roi !== undefined ? f.properties.roi : 10;
        if (roi < 5) return [239, 68, 68, 140];      // Crimson Red for <5%
        if (roi <= 15) return [245, 158, 11, 140];    // Amber/Yellow for 5-15%
        return [34, 197, 94, 180];                    // Neon Green for >15%
      },

      getLineWidth: (f: any) => {
        const id = f?.properties?.id;
        if (id === selectedId) return 3;
        return 1;
      },

      getFillColor: (f: any) => {
        const props = f?.properties || {};
        const id = props.id;
        
        if (id === selectedId) {
          return [255, 191, 0, 140 + 50 * pulse]; // Active Gold semi-transparent
        }

        const roi = props.roi !== undefined ? props.roi : 10;
        if (roi < 5) {
          return [239, 68, 68, 160]; // Red
        } else if (roi <= 15) {
          return [245, 158, 11, 160]; // Yellow/Amber
        } else {
          return [34, 197, 94, 185]; // Green/Neon
        }
      },

      onHover: (info: any) => {
        if (zoom < 13) return; 
        if (info.object) {
          onHover({
            id: info.object.properties.id,
            x: info.x,
            y: info.y,
            properties: info.object.properties
          });
        } else {
          onHover(null);
        }
      },

      onClick: (info: any) => {
        if (zoom < 13) return; 
        if (info.object) {
          onClick({
            id: info.object.properties.id,
            properties: info.object.properties
          });
        }
      },

      updateTriggers: {
        getFillColor: [pulse, selectedId, zoom],
        getLineColor: [pulse, selectedId, zoom],
        getLineWidth: [pulse, selectedId, zoom],
        getElevation: [zoom, selectedId],
        extruded: [zoom]
      },

      transitions: {
        getElevation: {
          duration: 600,
          easing: (t: number) => t * (2 - t),
          type: 'interpolation'
        }
      }
    } as any)
  ];

  if (selectedId !== null && isHighDetail) {
    layers.push(
      new GeoJsonLayer({
        id: 'roi-selection-glow',
        data: {
          type: 'FeatureCollection',
          features: data.features.filter((f: any) => f.properties.id === selectedId)
        },
        extruded: true,
        filled: false,
        stroked: true,
        lineWidthMinPixels: 4,
        getElevation: (f: any) => (f?.properties?.height || 20) * 1.15,
        getLineColor: [255, 191, 0, 150 + 105 * pulse], // Pulsing Active Gold glow
        getLineWidth: 6,
        updateTriggers: {
          getLineColor: [pulse]
        }
      } as any)
    );
  }

  return layers;
};
