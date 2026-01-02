
import { Vector3, MathUtils, CanvasTexture, RepeatWrapping, NearestFilter, Object3D } from "three";
import { ParticleData } from "../types";
import { v4 as uuidv4 } from 'uuid';

const COLORS = {
  GOLD: "#D4AF37",
  RED: "#8A0303",
  GREEN: "#1a472a", 
  LIGHT_GREEN: "#2d5a27",
  WHITE: "#F0F0F0"
};

const GIFT_CONTENTS = [
    '😴', '👕', '👔', '👐', '🐷', '👍'
];

/**
 * Helper to resolve asset paths.
 * Returns a relative path if no specific BASE_URL is set,
 * ensuring assets load correctly in proxied environments like AI Studio.
 */
const getAssetPath = (path: string) => {
  const env = (import.meta as any).env;
  const baseUrl = env?.BASE_URL;
  
  // If baseUrl is just '/' or undefined, use relative path (no leading slash)
  if (!baseUrl || baseUrl === '/') {
    return path.startsWith('/') ? path.slice(1) : path;
  }
  
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return normalizedBase + cleanPath;
};

export const generateDefaultPhotos = (): string[] => {
  const defaults: string[] = [];
  for (let i = 0; i < 11; i++) {
    defaults.push(getAssetPath(`photos/${i}.jpg`));
  }
  return defaults;
};

export const getCandyCaneTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#FF0000';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.lineTo(0, 16); ctx.fill();
        ctx.beginPath(); ctx.moveTo(16, 32); ctx.lineTo(32, 32); ctx.lineTo(32, 16); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(32, 0); ctx.lineTo(32, 16); ctx.lineTo(16, 32); ctx.fill();
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping; tex.wrapT = RepeatWrapping;
    tex.repeat.set(1, 4); tex.magFilter = NearestFilter;
    return tex;
};

const getScatterPosition = () => {
    const u = Math.random(); const v = Math.random();
    const theta = 2 * Math.PI * u; const phi = Math.acos(2 * v - 1);
    const scatterRadius = 15 + Math.random() * 15;
    return new Vector3(
        scatterRadius * Math.sin(phi) * Math.cos(theta),
        scatterRadius * Math.sin(phi) * Math.sin(theta),
        scatterRadius * Math.cos(phi)
    );
};

const placeObjectWithoutOverlap = (
    type: 'gift' | 'candy' | 'ornament',
    occupiedPositions: { pos: Vector3, radius: number }[],
    objectRadius: number
): { pos: Vector3, t: number } | null => {
    let attempts = 0; const maxAttempts = 80; 
    while (attempts < maxAttempts) {
        attempts++;
        let tMin = 0, tMax = 1;
        if (type === 'gift') { tMin = 0.75; tMax = 0.98; }
        else if (type === 'candy') { tMin = 0.2; tMax = 0.85; }
        const t = tMin + Math.random() * (tMax - tMin);
        const height = 18; const y = -9 + (height * (1 - t)); 
        const maxRadiusAtHeight = 6.2 * t + 0.2; 
        const r = maxRadiusAtHeight * (0.85 + Math.random() * 0.2);
        const angle = Math.random() * Math.PI * 2;
        const candidate = new Vector3(r * Math.cos(angle), y, r * Math.sin(angle));
        let collision = false;
        for (const existing of occupiedPositions) {
            if (candidate.distanceTo(existing.pos) < (objectRadius + existing.radius) * 1.01) {
                collision = true; break;
            }
        }
        if (!collision) return { pos: candidate, t };
    }
    return null;
};

export const generateTreeParticles = (photos: string[]): { particles: ParticleData[], spiralPoints: Vector3[] } => {
  const particles: ParticleData[] = [];
  const occupiedPositions: { pos: Vector3, radius: number }[] = [];
  occupiedPositions.push({ pos: new Vector3(0, 9.5, 0), radius: 1.5 });

  const photoCount = 11;
  const spiralPoints: Vector3[] = [];
  const dummyObj = new Object3D();

  const spiralSampleCount = 128; 
  for(let i=0; i<=spiralSampleCount; i++) {
     const t = i / spiralSampleCount;
     const y = -8 + t * 16;
     const treeRadius = Math.max(0.2, (9 - y) * (6.7 / 18.0));
     const spiralRadius = treeRadius * 1.6; 
     const angle = t * 3.0 * Math.PI * 2;
     spiralPoints.push(new Vector3(spiralRadius * Math.cos(angle), y, spiralRadius * Math.sin(angle)));
  }

  for(let i=0; i<photoCount; i++) {
      const t = i / (photoCount - 1); 
      const y = -8 + t * 16;
      const treeRadius = Math.max(0.2, (9 - y) * (6.7 / 18.0));
      const spiralRadius = treeRadius * 1.6; 
      const angle = t * 3.0 * Math.PI * 2;
      const pos = new Vector3(spiralRadius * Math.cos(angle), y, spiralRadius * Math.sin(angle));
      const radial = new Vector3(pos.x, 0, pos.z).normalize();
      const finalPos = pos.clone().add(radial.clone().multiplyScalar(0.5));
      dummyObj.position.copy(finalPos);
      dummyObj.lookAt(finalPos.clone().add(radial));
      occupiedPositions.push({ pos: finalPos, radius: 1.5 });
      particles.push({
        id: uuidv4(), type: 'photo', position: finalPos.clone(), treePosition: finalPos,
        scatterPosition: getScatterPosition(), rotation: new Vector3(dummyObj.rotation.x, dummyObj.rotation.y, dummyObj.rotation.z),
        scale: 1.4, radius: 1.1, color: COLORS.GOLD, imageUrl: photos[i % photos.length], aspectRatio: 1
      });
  }

  const giftRadius = 1.0;
  for (let i = 0; i < 6; i++) {
      const result = placeObjectWithoutOverlap('gift', occupiedPositions, giftRadius);
      if (result) {
          occupiedPositions.push({ pos: result.pos, radius: giftRadius });
          particles.push({
              id: uuidv4(), type: 'gift', position: result.pos.clone(), treePosition: result.pos,
              scatterPosition: getScatterPosition(), rotation: new Vector3(Math.random()*0.2, Math.random()*Math.PI*2, Math.random()*0.2), 
              scale: 0.7, radius: giftRadius, color: Math.random() > 0.5 ? COLORS.RED : COLORS.GOLD, content: GIFT_CONTENTS[i % GIFT_CONTENTS.length]
          });
      }
  }

  const candyRadius = 0.8;
  for (let i = 0; i < 15; i++) {
      const result = placeObjectWithoutOverlap('candy', occupiedPositions, candyRadius);
      if (result) {
          occupiedPositions.push({ pos: result.pos, radius: candyRadius });
          particles.push({
              id: uuidv4(), type: 'candy', position: result.pos.clone(), treePosition: result.pos,
              scatterPosition: getScatterPosition(), rotation: new Vector3(Math.random() * 0.2, Math.random() * Math.PI * 2, Math.random() * 0.2),
              scale: 0.6, radius: candyRadius, color: '#FFFFFF',
          });
      }
  }

  const ornamentRadius = 0.3; 
  const remaining = 1300 - particles.length;
  for (let i = 0; i < remaining; i++) {
      const result = placeObjectWithoutOverlap('ornament', occupiedPositions, ornamentRadius); 
      if (result) {
           occupiedPositions.push({ pos: result.pos, radius: ornamentRadius });
           const cRand = Math.random();
           let color = COLORS.GOLD;
           if (cRand < 0.6) color = Math.random() > 0.5 ? COLORS.GREEN : COLORS.LIGHT_GREEN; 
           else if (cRand < 0.75) color = COLORS.RED; 
           else if (cRand > 0.9) color = COLORS.WHITE; 

           particles.push({
               id: uuidv4(), type: 'ornament', position: result.pos.clone(), treePosition: result.pos,
               scatterPosition: getScatterPosition(), rotation: new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
               scale: Math.random() * 0.35 + 0.15, radius: ornamentRadius, color,
           });
      }
  }
  return { particles, spiralPoints };
};
