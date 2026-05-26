// src/camera/cinematicController.ts

// Hollywood-style easing curves
export const EASINGS = {
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  cinematic: (t: number) => {
    // Easing curve inspired by modern cinematic sci-fi films: fast buildup, extremely slow settle
    return t < 0.5 
      ? 2 * Math.pow(t, 2) * (3 - 2 * t)
      : 1 - Math.pow(-2 * t + 2, 3.5) / 3.5;
  },
  snap: (t: number) => {
    // Fast snap with an organic overshoot settle
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

export type EasingType = keyof typeof EASINGS;

export interface CameraPose {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface CinematicPreset {
  id: string;
  nameEn: string;
  nameRu: string;
  zoom: number;
  pitch: number;
  bearing: number;
}

export const CAMERA_PRESETS: CinematicPreset[] = [
  { id: 'bird-eye', nameEn: 'Bird-Eye Observ.', nameRu: 'Обзор с воздуха', zoom: 14.2, pitch: 10, bearing: 0 },
  { id: 'drone', nameEn: 'Tactical Drone', nameRu: 'Тактический дрон', zoom: 16.5, pitch: 48, bearing: -35 },
  { id: 'street', nameEn: 'Street Level Patrol', nameRu: 'Уличный патруль', zoom: 18.0, pitch: 75, bearing: 15 },
  { id: 'orbit', nameEn: 'Helicopter Orbit', nameRu: 'Орбитальный облет', zoom: 17.2, pitch: 62, bearing: 45 },
  { id: 'strategic', nameEn: 'Strategic Oversight', nameRu: 'Командный центр', zoom: 15.0, pitch: 30, bearing: -10 }
];

/**
 * Animate camera viewState smoothly using requestAnimationFrame for perfect controlled React states
 */
export function animateCamera(
  current: CameraPose,
  target: Partial<CameraPose> & { longitude: number; latitude: number },
  duration: number = 2500,
  easing: EasingType = 'cinematic',
  onUpdate: (pose: CameraPose) => void,
  onComplete?: () => void
): () => void {
  const startPose = { ...current };
  const targetPose = {
    longitude: target.longitude,
    latitude: target.latitude,
    zoom: target.zoom ?? current.zoom,
    pitch: target.pitch ?? current.pitch,
    bearing: target.bearing ?? current.bearing
  };

  // Adjust bearing to turn the shortest path
  let startBearing = startPose.bearing % 360;
  if (startBearing < 0) startBearing += 360;
  let targetBearing = targetPose.bearing % 360;
  if (targetBearing < 0) targetBearing += 360;

  let diffBearing = targetBearing - startBearing;
  if (diffBearing > 180) {
    diffBearing -= 360;
  } else if (diffBearing < -180) {
    diffBearing += 360;
  }

  const startTime = performance.now();
  let animId: number;

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const easeProgress = EASINGS[easing](progress);

    const nextPose: CameraPose = {
      longitude: startPose.longitude + (targetPose.longitude - startPose.longitude) * easeProgress,
      latitude: startPose.latitude + (targetPose.latitude - startPose.latitude) * easeProgress,
      zoom: startPose.zoom + (targetPose.zoom - startPose.zoom) * easeProgress,
      pitch: startPose.pitch + (targetPose.pitch - startPose.pitch) * easeProgress,
      bearing: (startBearing + diffBearing * easeProgress) % 360
    };

    onUpdate(nextPose);

    if (progress < 1) {
      animId = requestAnimationFrame(step);
    } else {
      onUpdate(targetPose);
      if (onComplete) onComplete();
    }
  };

  animId = requestAnimationFrame(step);

  return () => {
    cancelAnimationFrame(animId);
  };
}
