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
  dataOnlyMode: boolean = false
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
  
  if (data && data.features) {
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
      stroked: isHighDetail, // Only show outlines at high zoom
      lineWidthMinPixels: 1,
      pointRadiusMinPixels: 4,
      getPointRadius: (f: any) => f.properties.isUserAsset ? 8 : 2,
      filled: true,
      wireframe: isHighDetail, // Wireframe is expensive, only show at high zoom
      extruded: zoom >= 13, // Disable extrusion at low zoom for performance
      
      // Material optimization based on zoom
      material: isHighDetail ? {
        ambient: 0.4,
        diffuse: 0.6,
        shininess: 60,
        specularColor: [100, 100, 100]
      } : false, // Disable complex material at distance

      // LOD: Simplify elevation calculation
      getElevation: (f: any) => {
        if (zoom < 13) return 0;
        
        // Custom height based on model type if available
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

        if (f?.properties?.id === selectedId) {
          // Subtle breathing effect for selected building
          return height * (1.5 + 0.05 * pulse);
        }
        return height * 1.1;
      },

      // LOD: Simplify color and line calculations
      getLineColor: (f: any) => {
        if (dataOnlyMode) return [16, 185, 129, 200]; // Emerald for Data Only
        if (!isHighDetail) return [0, 0, 0, 0];
        const id = f?.properties?.id;
        if (id === selectedId) {
          // High-intensity tactical pulse for selection
          return [255, 255, 255, 180 + 75 * pulse];
        }
        if (id === hoveredId) {
          return [0, 255, 255, 200]; // Cyan highlight on hover
        }
        const status = f?.properties?.status || 0;
        if (status === 3) return [161, 161, 170, 200]; // Anomalous - Gray
        if (status === 2) return [255, 255, 255, 200]; // Risk - White
        return [255, 255, 255, 60]; // Stable - Faint White
      },

      getLineWidth: (f: any) => {
        if (!isHighDetail) return 0;
        const id = f?.properties?.id;
        if (id === selectedId) return 3;
        if (id === hoveredId) return 2;
        return 1;
      },

      getFillColor: (f: any) => {
        if (dataOnlyMode) return [16, 185, 129, 20]; // Faint emerald fill
        const props = f?.properties || {};
        const id = props.id;
        const status = props.status || 0;
        
        if (props.isUserAsset) {
          return [0, 255, 255, 200]; // Cyan for strategic nodes
        }

        if (id === selectedId && isHighDetail) {
          return [255, 255, 255, 100 + 50 * pulse];
        }

        if (id === hoveredId && isHighDetail) {
          return [0, 255, 255, 100]; // Subtle cyan fill on hover
        }

        if (status === 3) return [82, 82, 91, 150]; // Anomalous - Dark Gray
        if (status === 2) return [255, 255, 255, 150]; // Risk - White
        
        // Use simpler colors at lower zoom levels
        if (zoom < 13) return [20, 20, 20, 150];
        
        return [15, 15, 20, 220]; 
      },

      _subLayerProps: {
        'polygons-fill': {
          inject: {
            'vs:#decl': 'varying float vZ; varying vec3 vNormal;',
            'vs:#main-end': 'vZ = geometry.position.z; vNormal = geometry.worldNormal;',
            'fs:#decl': 'varying float vZ; varying vec3 vNormal;',
            'fs:#main-end': `
              // Vertical scanline effect
              float s = sin(vZ * 0.8 - project_uTime * 2.0) * 0.5 + 0.5;
              
              // Subtle vertical gradient for depth
              float gradient = clamp(vZ / 100.0, 0.0, 1.0);
              
              // Edge highlight based on normal
              float edge = 1.0 - abs(vNormal.z);
              
              gl_FragColor.rgb *= (0.7 + 0.5 * gradient);
              gl_FragColor.rgb += s * ${scanlineIntensity} * 0.4;
              gl_FragColor.rgb += edge * 0.1;

              // Hover highlight in shader
              if (gl_FragColor.g > 0.9 && gl_FragColor.b > 0.9 && gl_FragColor.r < 0.1) {
                gl_FragColor.rgb += s * 0.2; // Extra pulse for hovered
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
        getElevation: [zoom, selectedId],
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
            return height * 1.1;
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
                  // Scanning horizontal beam
                  float beamPos = mod(project_uTime * 20.0, 150.0);
                  float beam = smoothstep(2.0, 0.0, abs(vZ_holo - beamPos));
                  
                  // Vertical pulse
                  float pulse_holo = sin(vZ_holo * 0.2 - project_uTime * 2.0) * 0.5 + 0.5;

                  // Rotating Beacon Effect
                  float angle = atan(vPos_holo.y, vPos_holo.x);
                  float rotation = project_uTime * 1.5;
                  float beacon = smoothstep(0.1, 0.0, abs(fract((angle + rotation) / 6.28318) - 0.5) - 0.45);
                  
                  gl_FragColor.rgb += beam * 0.8;
                  gl_FragColor.rgb += pulse_holo * 0.2;
                  gl_FragColor.rgb += beacon * 0.4;
                  gl_FragColor.a *= (0.5 + 0.5 * ${pulse});
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

  return layers;
};
