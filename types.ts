
import { Vector3 } from "three";

export enum AppState {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  ZOOM = 'ZOOM'
}

export interface ParticleData {
  id: string;
  type: 'ornament' | 'photo' | 'gift' | 'candy';
  position: Vector3; // Current position
  treePosition: Vector3; // Target position in Tree state
  scatterPosition: Vector3; // Target position in Scatter state
  rotation: Vector3;
  color: string;
  scale: number;
  radius: number; // Bounding radius for collision
  imageUrl?: string;
  aspectRatio?: number;
  content?: string; // NEW: Message or Emoji content for gifts
}

export interface HandGesture {
  isFist: boolean;
  isOpenPalm: boolean;
  isPinching: boolean; // NEW: replaces isIndexUp
  pinchConfirmed: boolean; // NEW: debounced pinch
  handPosition: { x: number; y: number }; // Normalized -1 to 1
}

// Global MediaPipe types
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}
