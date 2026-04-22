import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';

export const createBuildingsLayer = (
  data: any,
  onHover: (info: any) => void, 
  onClick: (info: any) => void, 
  pulse: number = 0,
  selectedId: number | string | null = null,
  hoveredId: number | string | null = null,
  zoom: number = 15,
  scanlineIntensity: number = 0.2,
  dataOnlyMode: boolean = false,
  investorMode: boolean = false,
  ownedIds: (number | string)[] = [],
  simulationYear: number = 2026
) => {
  // Performance Optimization: Define granular LOD levels
  const isFar = zoom < 10;
  const isVeryLowDetail = zoom >= 10 && zoom < 12;
  const isLowDetail = zoom >= 12 && zoom < 13;
  const isMediumDetail = zoom >= 13 && zoom < 15;
  const isHighDetail = zoom >= 15;

  // LOD Technique: Filter data based on zoom level to reduce rendering load
  // At lower zoom levels, we only show "significant" assets
  let optimizedData = data;

  // Apply Simulation Year Impact
  if (data && data.features && simulationYear > 2026) {
    const yearDiff = simulationYear - 2026;
    optimizedData = {
      ...data,
      features: data.features.map((f: any) => {
        const baseRoi = f.properties.roi || 5;
        // Deterministic simulation based on ID and year
        // Buildings with specific IDs (strategic nodes) get higher growth
        const growthFactor = (parseInt(f.properties.id) % 5 === 0) ? 0.8 : 0.3;
        const simulatedRoi = parseFloat((baseRoi + (yearDiff * growthFactor)).toFixed(1));
        
        return {
          ...f,
          properties: {
            ...f.properties,
            simulatedRoi,
            originalRoi: baseRoi,
            isSimulated: true
          }
        };
      })
    };
  }
  
  if (optimizedData && optimizedData.features) {
    if (isFar) {
      // Only show Landmarks or Billion-dollar assets
      optimizedData = {
        ...data,
        features: data.features.filter((f: any) => 
          f.properties.status === 3 || (f.properties.cost && f.properties.cost > 1000000000)
        )
      };
    } else if (isVeryLowDetail) {
      // Only show top-tier or anomalous assets
      optimizedData = {
        ...data,
        features: data.features.filter((f: any) => 
          f.properties.status >= 2 || (f.properties.cost && f.properties.cost > 500000000)
        )
      };
    } else if (isLowDetail) {
      // Filter out small, low-value assets
      optimizedData = {
        ...data,
        features: data.features.filter((f: any) => 
          f.properties.status >= 1 || (f.properties.cost && f.properties.cost > 100000000)
        )
      };
    }
  }

  const layers: any[] = [
    new GeoJsonLayer({
      id: 'buildings-3d',
      data: optimizedData,
      pickable: zoom >= 13, // Disable picking at low zoom for performance
      autoHighlight: false, 
      highlightColor: [255, 255, 255, 100],
      stroked: zoom >= 13, // Ensure outlines are visible for hover/selection feedback
      lineWidthMinPixels: 1,
      pointRadiusMinPixels: 4,
      getPointRadius: (f: any) => f.properties.isUserAsset ? 8 : 2,
      filled: true,
      wireframe: isHighDetail, 
      extruded: zoom >= 13, 
      
      // Material optimization based on zoom
      material: isHighDetail ? {
        ambient: 0.4,
        diffuse: 0.6,
        shininess: 60,
        specularColor: [100, 100, 100]
      } : false, // Disable complex material at distance

      // LOD: Optimized elevation calculation based on zoom detail levels
      getElevation: (f: any) => {
        // At low zoom levels (LOD 0), buildings are effectively flat for performance
        if (zoom < 12) return 0;
        
        const props = f?.properties || {};
        const id = props.id;
        
        // LOD 1: Simplified height for distance visibility
        if (zoom < 14) {
          if (id === selectedId) return 100 * (1.1 + 0.1 * pulse);
          return 50; 
        }
        
        // LOD 2: Detailed height logic for close-up view
        let height = props.height;
        
        // Rule 1 & 2: OSM Extrusion Logic for Sovereign Stacks
        // If height is missing, derive from levels (institutional default)
        if (!height && (props.levels || props.building_levels)) {
          height = (props.levels || props.building_levels) * 3.5;
        }
        
        if (!height) height = 20; // Strategic fallback
        
        const model = props.model;
        
        if (model) {
          switch (model) {
            case 'office': height = Math.max(height, 150); break;
            case 'apartment': height = Math.max(height, 40); break;
            case 'warehouse': height = Math.max(height, 15); break;
            case 'house': height = Math.max(height, 10); break;
          }
        }

        // Add roof height as per user technical specs
        if (props.roof_height) {
          height += props.roof_height;
        }

        let finalHeight = height * 1.1;

        // Apply Investor Mode scaling only when zoomed in enough to see detail
        if (investorMode && zoom >= 15) {
          const isOwned = ownedIds.includes(id);
          if (isOwned) {
            const ltv = props.ltv || 0.65;
            finalHeight = height * (1 - ltv) * 2;
          }
        }

        if (id === selectedId) {
          return finalHeight * (1.3 + 0.15 * pulse);
        }
        if (id === hoveredId) {
          return finalHeight * 1.15;
        }
        return finalHeight;
      },

      // OSM Base Height implementation (min_height / building:min_level)
      getFillColor: (f: any) => {
        if (dataOnlyMode) return [16, 185, 129, 20];
        
        const props = f?.properties || {};
        const id = props.id;

        // Extreme Distance LOD: Single static color
        if (zoom < 11) return [15, 23, 42, 180]; // Slate 900
        
        // Medium Distance LOD: Simplified status colors
        if (zoom < 13) {
          const status = props.status || 0;
          if (status === 3) return [71, 85, 105, 150]; // Slate 600
          if (status === 2) return [255, 255, 255, 150];
          return [15, 23, 42, 180];
        }

        // Close Zoom LOD: Obsidian / Strategic materials
        if (props.isUserAsset) {
          return [0, 255, 255, 200]; 
        }

        if (id === selectedId) {
          return [255, 255, 255, 100 + 50 * pulse];
        }

        if (id === hoveredId) {
          return [0, 255, 255, 100]; 
        }

        const status = props.status || 0;
        if (status === 3) return [71, 85, 105, 150];
        if (status === 2) return [255, 255, 255, 150];
        
        return [15, 23, 42, 220]; // Deep Slate for stable assets
      },

      getLineColor: (f: any) => {
        const id = f?.properties?.id;
        if (id === selectedId) return [255, 255, 255, 200 + 55 * pulse];
        if (id === hoveredId) return [0, 255, 255, 255];
        if (investorMode && ownedIds.includes(id)) return [16, 185, 129, 255];
        return [255, 255, 255, 30];
      },

      getLineWidth: (f: any) => {
        const id = f?.properties?.id;
        if (id === selectedId) return 3;
        if (id === hoveredId) return 2;
        return 1;
      },

      // Tactical Shader Enhancements
      _subLayerProps: {
        'polygons-fill': {
          inject: {
            'vs:#decl': 'varying float vZ; varying vec3 vNormal; varying float vHeight;',
            'vs:#main-end': 'vZ = geometry.position.z; vNormal = geometry.worldNormal; vHeight = positions.z;',
            'fs:#decl': 'varying float vZ; varying vec3 vNormal; varying float vHeight;',
            'fs:#main-end': `
              // Vertical scanline effect
              float s = sin(vZ * 0.8 - project_uTime * 2.0) * 0.5 + 0.5;
              
              // Subtle vertical gradient for depth (Strategic Obsidian style)
              float gradient = clamp(vZ / 120.0, 0.0, 1.0);
              
              // Edge highlight based on normal (Palantir aesthetic)
              float edge = 1.0 - abs(vNormal.z);

              // TACTICAL RELIEF SHADING
              vec3 lightDir = normalize(vec3(0.3, 0.5, 1.0));
              float diff = max(dot(vNormal, lightDir), 0.0) * 0.5 + 0.5;
              
              // Advanced Ambient Occlusion (Bottom Darkening)
              float ao = smoothstep(0.0, 15.0, vZ) * 0.5 + 0.5;
              
              // Glass Reflection / Tactical highlights
              float reflex = pow(max(dot(reflect(-lightDir, vNormal), vec3(0,0,1)), 0.0), 16.0);
              
              gl_FragColor.rgb *= (diff * ao);
              gl_FragColor.rgb += s * ${scanlineIntensity} * 0.3;
              gl_FragColor.rgb += edge * 0.15;
              gl_FragColor.rgb += vec3(reflex * 0.2);
              gl_FragColor.rgb += vec3(gradient * 0.05);

              // Selection Highlight Pulse
              if (gl_FragColor.a > 0.95 && gl_FragColor.r > 0.9 && gl_FragColor.g > 0.9) {
                gl_FragColor.rgb += s * 0.1;
              }
            `
          }
        }
      },

      onHover: (info: any) => {
        if (zoom < 13) return; 
        if (info.object) {
          onHover({
            id: info.object.properties.id,
            x: info.x,
            y: info.y,
            properties: info.object.properties,
            geometry: info.object.geometry
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
            properties: info.object.properties,
            geometry: info.object.geometry
          });
        }
      },

      updateTriggers: {
        getFillColor: [pulse, selectedId, hoveredId, zoom, dataOnlyMode],
        getLineColor: [pulse, selectedId, hoveredId, zoom, dataOnlyMode],
        getLineWidth: [pulse, selectedId, hoveredId, zoom, dataOnlyMode],
        getElevation: [zoom, selectedId, hoveredId],
        extruded: [zoom],
        _subLayerProps: [scanlineIntensity]
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

  // Add a subtle hover hologram
  if (hoveredId !== null && hoveredId !== selectedId && isHighDetail) {
    const hoveredFeature = data.features.find((f: any) => f.properties.id === hoveredId);
    if (hoveredFeature) {
      layers.push(
        new GeoJsonLayer({
          id: 'hover-hologram',
          data: {
            type: 'FeatureCollection',
            features: [hoveredFeature]
          },
          extruded: true,
          filled: true,
          stroked: false,
          getElevation: (f: any) => {
            let height = f?.properties?.height || 20;
            const model = f?.properties?.model;
            if (model) {
              switch (model) {
                case 'office': height = 150; break;
                case 'apartment': height = 40; break;
                case 'warehouse': height = 15; break;
                case 'house': height = 10; break;
              }
            }
            return height * 1.25;
          },
          getFillColor: [0, 255, 255, 30],
          _subLayerProps: {
            'polygons-fill': {
              inject: {
                'vs:#decl': 'varying float vZ_hover;',
                'vs:#main-end': 'vZ_hover = geometry.position.z;',
                'fs:#decl': 'varying float vZ_hover;',
                'fs:#main-end': `
                  float beam = smoothstep(2.0, 0.0, abs(vZ_hover - mod(project_uTime * 10.0, 150.0)));
                  gl_FragColor.rgb += beam * 0.3;
                  gl_FragColor.a *= (0.3 + 0.2 * sin(project_uTime * 5.0));
                `
              }
            }
          },
          updateTriggers: {
            getFillColor: [hoveredId]
          }
        } as any)
      );
    }
  }

  // Add a "Holographic" scanning effect for the selected building
  if (selectedId !== null && isHighDetail) {
    const selectedFeature = data.features.find((f: any) => f.properties.id === selectedId);
    if (selectedFeature) {
      layers.push(
        new GeoJsonLayer({
          id: 'selection-hologram',
          data: {
            type: 'FeatureCollection',
            features: [selectedFeature]
          },
          extruded: true,
          filled: true,
          stroked: false,
          getElevation: (f: any) => {
            let height = f?.properties?.height || 20;
            const model = f?.properties?.model;
            if (model) {
              switch (model) {
                case 'office': height = 150; break;
                case 'apartment': height = 40; break;
                case 'warehouse': height = 15; break;
                case 'house': height = 10; break;
              }
            }
            return height * (1.5 + 0.05 * pulse);
          },
          getFillColor: [255, 255, 255, 40],
          _subLayerProps: {
            'polygons-fill': {
              inject: {
                'vs:#decl': 'varying float vZ_holo; varying vec2 vPos_holo;',
                'vs:#main-end': 'vZ_holo = geometry.position.z; vPos_holo = geometry.position.xy;',
                'fs:#decl': 'varying float vZ_holo; varying vec2 vPos_holo;',
                'fs:#main-end': `
                  // Multiple tactical scanning beams
                  float beam1 = smoothstep(3.0, 0.0, abs(vZ_holo - mod(project_uTime * 30.0, 200.0)));
                  float beam2 = smoothstep(2.0, 0.0, abs(vZ_holo - mod(project_uTime * 25.0 + 50.0, 200.0)));
                  
                  // Grid interaction
                  float grid = sin(vZ_holo * 0.5) * cos(vPos_holo.x * 0.1) * cos(vPos_holo.y * 0.1);
                  float pulse_holo = sin(vZ_holo * 0.1 - project_uTime * 4.0) * 0.5 + 0.5;

                  // Rotating Beacon Effect (Scanning Radar)
                  float angle = atan(vPos_holo.y, vPos_holo.x);
                  float rotation = project_uTime * 2.0;
                  float beacon = smoothstep(0.15, 0.0, abs(fract((angle + rotation) / 6.283) - 0.5) - 0.45);
                  
                  gl_FragColor.rgb += beam1 * 0.8;
                  gl_FragColor.rgb += beam2 * 0.4;
                  gl_FragColor.rgb += pulse_holo * 0.1;
                  gl_FragColor.rgb += beacon * 0.6;
                  gl_FragColor.rgb += grid * 0.05 * pulse_holo;
                  
                  // Hologram transparency
                  gl_FragColor.a *= (0.4 + 0.4 * ${pulse});
                `
              }
            }
          },
          updateTriggers: {
            getElevation: [pulse],
            getFillColor: [pulse]
          }
        } as any)
      );

      // Add a tactical "Radar" ring at the base
      layers.push(
        new GeoJsonLayer({
          id: 'selection-ring',
          data: {
            type: 'FeatureCollection',
            features: [selectedFeature]
          },
          extruded: false,
          filled: false,
          stroked: true,
          lineWidthMinPixels: 2,
          getLineColor: [255, 255, 255, 150 * (1 - pulse)],
          getLineWidth: 2,
          _subLayerProps: {
            'polygons-stroke': {
              inject: {
                'vs:#decl': 'varying vec2 vPos;',
                'vs:#main-end': 'vPos = geometry.position.xy;',
                'fs:#decl': 'varying vec2 vPos;',
                'fs:#main-end': `
                  float dist = length(vPos);
                  float ring1 = smoothstep(0.1, 0.0, abs(fract(dist * 0.05 - project_uTime * 1.0) - 0.5));
                  float ring2 = smoothstep(0.1, 0.0, abs(fract(dist * 0.03 - project_uTime * 0.7) - 0.5));
                  gl_FragColor.a *= (ring1 + ring2 * 0.5);
                `
              }
            }
          },
          updateTriggers: {
            getLineColor: [pulse]
          }
        } as any)
      );
    }

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
        getElevation: (f: any) => {
          let height = f?.properties?.height || 20;
          const model = f?.properties?.model;
          if (model) {
            switch (model) {
              case 'office': height = 150; break;
              case 'apartment': height = 40; break;
              case 'warehouse': height = 15; break;
              case 'house': height = 10; break;
            }
          }
          return height * (1.5 + 0.05 * pulse) * 1.02;
        },
        getLineColor: [255, 255, 255, 100 + 155 * pulse],
        getLineWidth: 6,
        _subLayerProps: {
          'polygons-stroke': {
            inject: {
              'vs:#decl': 'varying float vZ_glow;',
              'vs:#main-end': 'vZ_glow = geometry.position.z;',
              'fs:#decl': 'varying float vZ_glow;',
              'fs:#main-end': `
                float p = sin(vZ_glow * 0.1 + project_uTime * 3.0) * 0.5 + 0.5;
                gl_FragColor.rgb += p * 0.5;
                gl_FragColor.a *= (0.7 + 0.3 * p);
              `
            }
          }
        },
        updateTriggers: {
          getLineColor: [pulse],
          getElevation: [pulse]
        }
      } as any)
    );
  }

  if (dataOnlyMode && isHighDetail) {
    layers.push(
      new TextLayer({
        id: 'roi-labels',
        data: data.features,
        getPosition: (f: any) => {
          const coords = f.geometry.coordinates;
          const [lng, lat] = f.geometry.type === 'Polygon' ? coords[0][0] : coords;
          let height = f?.properties?.height || 20;
          const model = f?.properties?.model;
          if (model) {
            switch (model) {
              case 'office': height = 150; break;
              case 'apartment': height = 40; break;
              case 'warehouse': height = 15; break;
              case 'house': height = 10; break;
            }
          }
          return [lng, lat, height + 5];
        },
        getText: (f: any) => `${f.properties.roi || 0}%`,
        getSize: 16,
        getColor: [16, 185, 129, 255],
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 'bold',
        updateTriggers: {
          getPosition: [zoom]
        }
      } as any)
    );
  }

  // Tactical Asset ID Badge (Overlay on map)
  if ((hoveredId || selectedId) && isHighDetail) {
    const activeFeatures = data.features.filter((f: any) => 
      f.properties.id === hoveredId || f.properties.id === selectedId
    );
    
    if (activeFeatures.length > 0) {
      layers.push(
        new TextLayer({
          id: 'tactical-id-badge',
          data: activeFeatures,
          getPosition: (f: any) => {
            const coords = f.geometry.coordinates;
            const [lng, lat] = f.geometry.type === 'Polygon' ? coords[0][0] : coords;
            
            let h = f?.properties?.height || 20;
            const model = f?.properties?.model;
            if (model) {
              switch (model) {
                case 'office': h = 150; break;
                case 'apartment': h = 40; break;
                case 'warehouse': h = 15; break;
                case 'house': h = 10; break;
              }
            }
            
            let finalH = h * 1.1;
            // Note: We use the same scaling logic as getElevation to keep label anchored
            if (investorMode && ownedIds.includes(f.properties.id)) {
              const ltv = f.properties.ltv || 0.65;
              finalH = h * (1 - ltv) * 2;
            }

            if (f.properties.id === selectedId) finalH = finalH * (1.3 + 0.05 * pulse);
            else if (f.properties.id === hoveredId) finalH = finalH * 1.15;
            
            return [lng, lat, finalH + 15]; // Positioned above the building
          },
          getText: (f: any) => `ID_${f.properties.id}`,
          getSize: 10,
          getColor: (f: any) => f.properties.id === selectedId ? [255, 255, 255, 255] : [0, 255, 255, 255],
          characterSet: 'auto',
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 'bold',
          background: true,
          getBackgroundColor: [0, 0, 0, 200],
          backgroundPadding: [6, 4, 6, 4],
          borderWidth: 1,
          getBorderColor: (f: any) => f.properties.id === selectedId ? [255, 255, 255, 100] : [0, 255, 255, 100],
          updateTriggers: {
            getPosition: [pulse, selectedId, hoveredId, zoom, investorMode, ownedIds],
            getColor: [selectedId, hoveredId],
            getBorderColor: [selectedId, hoveredId]
          }
        } as any)
      );
    }
  }

  return layers;
};
