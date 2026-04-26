// simulation.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { buildings, params, year } = e.data;
  
  if (!buildings || !buildings.features) {
    self.postMessage({ buildings: null });
    return;
  }

  const yearDiff = Math.max(0, year - 2026);
  
  // Use a faster processing loop
  const total = buildings.features.length;
  const processedFeatures = new Array(total);

  for (let i = 0; i < total; i++) {
    const f = buildings.features[i];
    const baseRoi = f.properties.roi || 5;
    const id = parseInt(f.properties.id) || 0;
    
    let simulatedRoi = baseRoi;
    
    // Optimized business logic: pre-calculate factors
    const growthFactor = (id % 5 === 0) ? 0.8 : 0.3;
    simulatedRoi += (yearDiff * growthFactor);
    simulatedRoi += params.rentRate * 0.5 + params.occupancy * 0.2 - params.inflation * 0.3;
    simulatedRoi += (id % 10 - 5) * 0.05;

    processedFeatures[i] = {
      ...f,
      properties: {
        ...f.properties,
        simulatedRoi: Math.round(simulatedRoi * 100) / 100,
        isSimulated: true,
        simulationBatch: Date.now()
      }
    };
  }

  self.postMessage({ 
    type: 'FeatureCollection',
    features: processedFeatures,
    timestamp: Date.now()
  });
};
