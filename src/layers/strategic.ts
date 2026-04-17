import { GeoJsonLayer } from '@deck.gl/layers';

export const createRiskRadarLayer = (zoom: number, active: boolean, onHover: (info: any) => void) => {
  if (!active) return null;

  // Static mock data for risk zones (Geopolitical & Legal)
  const riskZones = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { 
            name: 'Strategic Buffer Alpha', 
            risk: 'Critical', 
            purity: 'Tier-1 Restricted',
            compliance: 12,
            color: [255, 0, 0, 80], 
            description: 'Direct proximity to Federal Sovereignty Hubs. Extreme zoning restrictions in place.' 
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [37.61, 55.75], [37.62, 55.75], [37.62, 55.76], [37.61, 55.76], [37.61, 55.75]
          ]]
        }
      },
      {
        type: 'Feature',
        properties: { 
            name: 'Financial Sanctuary Zone', 
            risk: 'Minimal', 
            purity: 'Sovereign_Clear',
            compliance: 98,
            color: [0, 255, 150, 60], 
            description: 'Autonomous financial infrastructure district. Guaranteed asset protection under 2026 Legal Act.' 
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [37.59, 55.74], [37.60, 55.74], [37.60, 55.75], [37.59, 55.75], [37.59, 55.74]
          ]]
        }
      },
      {
        type: 'Feature',
        properties: { 
            name: 'Regulatory Audit Enclave', 
            risk: 'Medium', 
            purity: 'High-Audit',
            compliance: 65,
            color: [255, 170, 0, 60], 
            description: 'Active legal scrubbing in progress. 15% ROI uplift projected upon purity certification.' 
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [37.63, 55.76], [37.64, 55.76], [37.64, 55.77], [37.63, 55.77], [37.63, 55.76]
          ]]
        }
      }
    ]
  };

  return new GeoJsonLayer({
    id: 'risk-radar-layer',
    data: riskZones as any,
    pickable: true,
    stroked: true,
    filled: true,
    lineWidthMinPixels: 2,
    getFillColor: (f: any) => f.properties.color,
    getLineColor: (f: any) => [f.properties.color[0], f.properties.color[1], f.properties.color[2], 255],
    getLineWidth: 2,
    onHover: (info) => {
        if (info.object) {
            onHover({
                id: info.object.properties.name,
                x: info.x,
                y: info.y,
                properties: {
                    ...info.object.properties,
                    status: 2,
                    type: 'LEGAL_RISK_ZONE'
                }
            });
        } else {
            onHover(null);
        }
    }
  });
};

export const createStrategicNodesLayer = (zoom: number, active: boolean, onHover: (info: any) => void) => {
    if (!active || zoom < 13) return null;

    const nodes = {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', properties: { name: 'Federal Sovereignty Hub', type: 'Gov', risk: 'Center' }, geometry: { type: 'Point', coordinates: [37.617, 55.752] } },
            { type: 'Feature', properties: { name: 'Embassy Delta', type: 'Diplomatic', risk: 'Low' }, geometry: { type: 'Point', coordinates: [37.595, 55.745] } },
            { type: 'Feature', properties: { name: 'Digital Infrastructure Root', type: 'Tech', risk: 'Maximum' }, geometry: { type: 'Point', coordinates: [37.635, 55.765] } }
        ]
    };

    return new GeoJsonLayer({
        id: 'strategic-nodes-layer',
        data: nodes as any,
        pickable: true,
        getPointRadius: zoom * 2,
        pointRadiusMinPixels: 8,
        pointRadiusMaxPixels: 30,
        filled: true,
        stroked: true,
        getFillColor: [255, 255, 255, 200],
        getLineColor: [255, 0, 0, 255],
        onHover: (info) => {
            if (info.object) {
                onHover({
                    id: info.object.properties.name,
                    x: info.x,
                    y: info.y,
                    properties: {
                        ...info.object.properties,
                        description: `Strategic Node: ${info.object.properties.name}. Proximity triggers legal audit protocols.`,
                        type: 'STRATEGIC_NODE'
                    }
                });
            } else {
                onHover(null);
            }
        }
    });
};

export const createInfrastructureTwinLayer = (zoom: number, active: boolean, type: 'power' | 'comm' | 'traffic') => {
  if (!active) return null;

  // Mock data for infrastructure nodes
  const nodes = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { type: 'power', capacity: '85%', status: 'Optimal' }, geometry: { type: 'Point', coordinates: [37.615, 55.755] } },
      { type: 'Feature', properties: { type: 'comm', signal: '5G_Extreme', status: 'Stable' }, geometry: { type: 'Point', coordinates: [37.605, 55.745] } },
    ]
  };

  return new GeoJsonLayer({
    id: `infra-twin-${type}`,
    data: nodes as any,
    visible: active,
    pickable: true,
    getPointRadius: 20,
    pointRadiusMinPixels: 10,
    filled: true,
    getFillColor: (f: any) => {
        if (f.properties.type === 'power') return [255, 255, 0, 200];
        return [0, 100, 255, 200];
    },
    updateTriggers: {
        getFillColor: [active]
    }
  });
};

export const createFutureProjectsLayer = (zoom: number, active: boolean, simulationYear: number, onHover: (info: any) => void) => {
  if (!active) return null;

  // Mock data for future projects
  const futureProjects = {
    type: 'FeatureCollection',
    features: [
      { 
        type: 'Feature', 
        properties: { 
          name: 'Central Transport Hub', 
          type: 'transport', 
          startYear: 2028, 
          endYear: 2032,
          impact: '+15% ROI',
          description: 'Multi-modal transit station. High impact on nearby commercial liquidity.'
        }, 
        geometry: { type: 'Point', coordinates: [37.625, 55.758] } 
      },
      { 
        type: 'Feature', 
        properties: { 
          name: 'Neo-Residential Complex B', 
          type: 'residential', 
          startYear: 2027, 
          endYear: 2029,
          impact: '+8% Yield',
          description: '3,000 unit sustainable housing. Increases local retail demand.'
        }, 
        geometry: { type: 'Point', coordinates: [37.608, 55.765] } 
      },
      { 
        type: 'Feature', 
        properties: { 
          name: 'Federal Tech Cluster', 
          type: 'government', 
          startYear: 2030, 
          endYear: 2035,
          impact: '+22% Capital Gain',
          description: 'Government-backed innovation district. Major sovereign investment node.'
        }, 
        geometry: { type: 'Point', coordinates: [37.635, 55.752] } 
      },
    ]
  };

  // Filter projects by simulation year: show if completion year <= simulationYear
  const visibleFeatures = futureProjects.features.filter(f => f.properties.endYear <= simulationYear);
  
  // Show projects under construction: startYear <= simulationYear < endYear
  const constructionFeatures = futureProjects.features.filter(f => f.properties.startYear <= simulationYear && simulationYear < f.properties.endYear);

  return new GeoJsonLayer({
    id: 'future-projects-layer',
    data: [...visibleFeatures, ...constructionFeatures] as any,
    pickable: true,
    getPointRadius: 40,
    pointRadiusMinPixels: 15,
    filled: true,
    stroked: true,
    lineWidthMinPixels: 2,
    getFillColor: (f: any) => {
      const isUnderConstruction = f.properties.startYear <= simulationYear && simulationYear < f.properties.endYear;
      if (isUnderConstruction) return [255, 165, 0, 150]; // Orange for construction
      
      switch (f.properties.type) {
        case 'transport': return [0, 200, 255, 200];
        case 'residential': return [0, 255, 100, 200];
        case 'government': return [255, 0, 150, 200];
        default: return [255, 255, 255, 200];
      }
    },
    getLineColor: [255, 255, 255, 200],
    updateTriggers: {
        getFillColor: [simulationYear]
    },
    onHover: (info) => {
      if (info.object) {
          onHover({
              id: info.object.properties.name,
              x: info.x,
              y: info.y,
              properties: {
                  ...info.object.properties,
                  status: (info.object.properties.startYear <= simulationYear && simulationYear < info.object.properties.endYear) ? 2 : 1,
                  type: 'FUTURE_PROJECT'
              }
          });
      } else {
          onHover(null);
      }
    }
  });
};
