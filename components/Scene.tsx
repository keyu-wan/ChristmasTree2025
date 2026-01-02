
import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Environment, Stars, Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import MagicParticles from './MagicParticles';
import { AppState, HandGesture } from '../types';

interface Props {
  appState: AppState;
  setAppState: (state: AppState) => void;
  photos: string[];
  gesture: HandGesture;
}

const BackgroundInteraction: React.FC<{ appState: AppState; setAppState: (s: AppState) => void }> = ({ appState, setAppState }) => {
    const { camera, pointer, scene, raycaster } = useThree();
    const appStateRef = useRef(appState);
    const setAppStateRef = useRef(setAppState);

    useEffect(() => {
        appStateRef.current = appState;
        setAppStateRef.current = setAppState;
    }, [appState, setAppState]);

    useEffect(() => {
        const handleDoubleClick = () => {
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            
            let hitInteractive = false;
            for (let hit of intersects) {
                if (hit.distance < 50 && hit.object.type === 'Mesh') {
                    hitInteractive = true;
                    break;
                }
            }

            if (!hitInteractive) {
                if (appStateRef.current === AppState.TREE) {
                    setAppStateRef.current(AppState.SCATTER);
                } else if (appStateRef.current === AppState.SCATTER) {
                    setAppStateRef.current(AppState.TREE);
                }
            }
        };

        window.addEventListener('dblclick', handleDoubleClick);
        return () => window.removeEventListener('dblclick', handleDoubleClick);
    }, [camera, pointer, scene, raycaster]);

    return null;
};

const Scene: React.FC<Props> = ({ appState, setAppState, photos, gesture }) => {
  const setAppStateRef = useRef(setAppState);
  const appStateRef = useRef(appState);

  useEffect(() => {
    setAppStateRef.current = setAppState;
    appStateRef.current = appState;
  }, [setAppState, appState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && appStateRef.current === AppState.ZOOM) {
            setAppStateRef.current(AppState.SCATTER);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 24], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#020502']} />
      
      <BackgroundInteraction appState={appState} setAppState={setAppState} />

      <OrbitControls 
        makeDefault 
        enablePan={false} 
        minDistance={10} 
        maxDistance={50} 
      />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffd700" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff0000" />
      <spotLight position={[0, 20, 0]} angle={0.5} penumbra={1} intensity={2} color="#fff" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={300} scale={15} size={2} speed={0.4} opacity={0.5} color="#D4AF37" />

      <Suspense fallback={null}>
        <MagicParticles 
            appState={appState} 
            setAppState={setAppState} 
            photos={photos} 
            gesture={gesture} 
        />
        <Environment preset="city" />
      </Suspense>

      <EffectComposer enableNormalPass={false}>
        <Bloom 
            /* 
               Threshold raised to 1.0. 
               This ensures sRGB textures (intensity <= 1.0) don't glow, 
               while emissive decorative items (intensity > 1.0) retain their cinematic shine.
            */
            luminanceThreshold={1.0} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.6} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};

export default Scene;
