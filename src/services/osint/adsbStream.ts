// src/services/osint/adsbStream.ts

export interface FlightState {
  icao: string;
  callsign: string;
  lat: number;
  lon: number;
  alt: number; // Altitude in meters
  speed: number; // Ground speed in km/h
  track: number; // Heading in degrees (0-360)
  timestamp: number; // Current time in ms
  category: 'MILITARY' | 'VIP_JET' | 'GOV' | 'COMMERCIAL';
  path: [number, number, number][]; // Historical path of [lon, lat, alt]
  timestamps: number[]; // Corresponding absolute timestamps (in seconds)
}

export class ADSBStream {
  private ws: WebSocket | null = null;
  private buffer: Map<string, FlightState> = new Map();
  private listeners: Set<(flights: FlightState[]) => void> = new Set();
  private intervalId: any = null;
  private wsUrl: string = 'wss://opendata.adsbexchange.com/v2/ws';
  private autoSimulate: boolean = true;

  // Track coordinates for Moscow City center (Presnenskaya Naberezhnaya)
  private centerLat = 55.7558;
  private centerLon = 37.6173;

  constructor() {
    // Generate initial tactical/military flights in the local region
    this.initializeLocalTacticalFlights();
  }

  // Connects to a real-time ADS-B WebSocket feed
  connect(customUrl?: string) {
    if (customUrl) {
      this.wsUrl = customUrl;
    }
    
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('⚡ OSINT OSIRIS: Connected to ADS-B Stream');
        // Let's disable simulation only if we receive actual external WebSocket data
        this.autoSimulate = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.ac) {
            this.autoSimulate = false; // We have real data streaming
            msg.ac.forEach((aircraft: any) => {
              if (aircraft.hex && aircraft.lat && aircraft.lon) {
                const icao = aircraft.hex;
                const callsign = (aircraft.flight || aircraft.r || 'UNKNOWN').trim();
                const category = this.classifyAircraft(aircraft);
                const lat = aircraft.lat;
                const lon = aircraft.lon;
                const alt = (aircraft.alt_baro || aircraft.alt_geom || 3000) * 0.3048; // convert feet to meters
                const speed = (aircraft.gs || 250) * 1.852; // knots to km/h
                const track = aircraft.track || 0;
                const nowMs = Date.now();
                const nowSec = nowMs / 1000;

                const existing = this.buffer.get(icao);
                let path: [number, number, number][] = [];
                let timestamps: number[] = [];

                if (existing) {
                  path = [...existing.path];
                  timestamps = [...existing.timestamps];
                }

                // Add current point
                path.push([lon, lat, alt]);
                timestamps.push(nowSec);

                // Keep only last 100 points
                if (path.length > 200) {
                  path.shift();
                  timestamps.shift();
                }

                this.buffer.set(icao, {
                  icao,
                  callsign,
                  lat,
                  lon,
                  alt,
                  speed,
                  track,
                  timestamp: nowMs,
                  category,
                  path,
                  timestamps
                });
              }
            });
            this.notifyListeners();
          }
        } catch (err) {
          // Parse error or non-conforming message
        }
      };

      this.ws.onerror = () => {
        console.warn('⚡ OSINT OSIRIS: WebSocket encountered an error, falling back.');
        this.autoSimulate = true;
      };

      this.ws.onclose = () => {
        console.log('⚡ OSINT OSIRIS: WebSocket connection closed, reconnecting in 10s...');
        this.autoSimulate = true;
        setTimeout(() => this.connect(), 10000);
      };

    } catch (e) {
      console.warn('Could not launch real ADS-B WebSocket:', e);
      this.autoSimulate = true;
    }

    // Start local simulated motion update loop
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.updateMotion();
      }, 1000);
    }
  }

  // Subscribe to flight telemetry changes
  subscribe(callback: (flights: FlightState[]) => void) {
    this.listeners.add(callback);
    // Initialize immediately with currently tracked assets
    callback(this.getFlights());
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Retrieve current array of tracked aircraft
  getFlights(): FlightState[] {
    return Array.from(this.buffer.values());
  }

  // Force simulation loop on/off
  setSimulationMode(active: boolean) {
    this.autoSimulate = active;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notifyListeners() {
    const flights = this.getFlights();
    this.listeners.forEach(cb => cb(flights));
  }

  // Classify real ADS-B aircraft into cyber-military categories
  private classifyAircraft(ac: any): 'MILITARY' | 'VIP_JET' | 'GOV' | 'COMMERCIAL' {
    const desc = (ac.desc || ac.type || '').toUpperCase();
    const flight = (ac.flight || '').toUpperCase();

    if (ac.t === 'mil' || desc.includes('MILITARY') || desc.includes('FIGHTER') || desc.includes('MIG') || desc.includes('SU-') || flight.startsWith('MIL') || flight.startsWith('RFF')) {
      return 'MILITARY';
    }
    if (desc.includes('GULFSTREAM') || desc.includes('CHALLENGER') || desc.includes('LEARJET') || desc.includes('FALCON') || flight.startsWith('VIP') || flight.startsWith('PVT')) {
      return 'VIP_JET';
    }
    if (desc.includes('REPUBLIC') || desc.includes('GOVERNMENT') || flight.startsWith('RSD') || flight.startsWith('GOV')) {
      return 'GOV';
    }
    return 'COMMERCIAL';
  }

  // Generate initial high-quality tactical flights around Moscow City
  private initializeLocalTacticalFlights() {
    const baseFlights = [
      {
        icao: 'A4C7FF',
        callsign: 'RFF-069_SU35',
        category: 'MILITARY' as const,
        offsetLat: 0.04,
        offsetLon: -0.05,
        alt: 12000,
        speed: 1100, // Speed in km/h
        track: 110
      },
      {
        icao: 'B22D11',
        callsign: 'RSD-007_GOV',
        category: 'GOV' as const,
        offsetLat: -0.05,
        offsetLon: 0.08,
        alt: 8500,
        speed: 820,
        track: 320
      },
      {
        icao: 'C104BB',
        callsign: 'PVT-G500_VIP',
        category: 'VIP_JET' as const,
        offsetLat: 0.06,
        offsetLon: 0.06,
        alt: 6200,
        speed: 780,
        track: 215
      },
      {
        icao: 'AF8899',
        callsign: 'RECON-TACT_03',
        category: 'MILITARY' as const,
        offsetLat: -0.02,
        offsetLon: -0.08,
        alt: 4500,
        speed: 550,
        track: 45
      },
      {
        icao: 'D33022',
        callsign: 'COMM-S7_910',
        category: 'COMMERCIAL' as const,
        offsetLat: 0.10,
        offsetLon: -0.10,
        alt: 10000,
        speed: 800,
        track: 135
      }
    ];

    const nowSec = Date.now() / 1000;

    baseFlights.forEach((bf, index) => {
      const lat = this.centerLat + bf.offsetLat;
      const lon = this.centerLon + bf.offsetLon;
      
      // Seed pre-populated historical path for the trails to render instantly
      const path: [number, number, number][] = [];
      const timestamps: number[] = [];
      const headingRad = (bf.track * Math.PI) / 180;
      
      // Backfill trail points over the last 15 seconds
      for (let step = 15; step >= 0; step--) {
        const timeDiffSec = step * 1;
        const speedMps = bf.speed / 3.6;
        const distanceMeters = speedMps * timeDiffSec;
        
        // Dynamic earth radius (roughly 6371km)
        const dLat = (distanceMeters * Math.sin(headingRad)) / 111000;
        const dLon = (distanceMeters * Math.cos(headingRad)) / (111000 * Math.cos((lat * Math.PI) / 180));
        
        path.push([lon - dLon, lat - dLat, bf.alt]);
        timestamps.push(nowSec - timeDiffSec);
      }

      this.buffer.set(bf.icao, {
        icao: bf.icao,
        callsign: bf.callsign,
        lat,
        lon,
        alt: bf.alt,
        speed: bf.speed,
        track: bf.track,
        timestamp: Date.now(),
        category: bf.category,
        path,
        timestamps
      });
    });
  }

  // Simulates real-time movements based on speed, bearings, trajectories, and noise
  private updateMotion() {
    if (!this.autoSimulate) return;

    const nowMs = Date.now();
    const nowSec = nowMs / 1000;

    this.buffer.forEach((flight, icao) => {
      const speedMps = flight.speed / 3.6;
      const headingRad = (flight.track * Math.PI) / 180;
      
      // Calculate delta position (1-second update)
      const distTraveled = speedMps * 1.0; 
      const dLat = (distTraveled * Math.cos(headingRad)) / 111000;
      const dLon = (distTraveled * Math.sin(headingRad)) / (111000 * Math.cos((flight.lat * Math.PI) / 180));

      const newLat = flight.lat + dLat;
      const newLon = flight.lon + dLon;

      // Wrap-around logic to ensure they stay within reasonable bounds of Moscow region (approx. +/- 0.25 deg)
      let finalLat = newLat;
      let finalLon = newLon;
      let finalTrack = flight.track;

      const maxOffset = 0.22;
      if (Math.abs(newLat - this.centerLat) > maxOffset || Math.abs(newLon - this.centerLon) > maxOffset) {
        // Pivot/U-turn or direct course redirection back to center
        const dy = this.centerLat - newLat;
        const dx = this.centerLon - newLon;
        let angle = Math.atan2(dx, dy) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        
        finalTrack = Math.round((angle + (Math.random() * 30 - 15) + 360) % 360);
      } else {
        // Small heading adjustments for a organic/dynamic flight paths
        if (Math.random() < 0.12) {
          finalTrack = Math.round((flight.track + (Math.random() * 10 - 5) + 360) % 360);
        }
      }

      // Append trail
      const currentPath = [...flight.path];
      const currentTimestamps = [...flight.timestamps];

      currentPath.push([finalLon, finalLat, flight.alt]);
      currentTimestamps.push(nowSec);

      // Keep maximum points of size 120
      if (currentPath.length > 120) {
        currentPath.shift();
        currentTimestamps.shift();
      }

      this.buffer.set(icao, {
        ...flight,
        lat: finalLat,
        lon: finalLon,
        track: finalTrack,
        timestamp: nowMs,
        path: currentPath,
        timestamps: currentTimestamps
      });
    });

    this.notifyListeners();
  }
}

export const adsbStream = new ADSBStream();
