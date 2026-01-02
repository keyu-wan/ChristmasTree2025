
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Instances, Instance, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { AppState, HandGesture, ParticleData } from '../types';
import { generateTreeParticles, getCandyCaneTexture } from '../services/utils';

interface Props {
  appState: AppState;
  photos: string[];
  gesture: HandGesture;
  setAppState: (s: AppState) => void;
}

interface ParticleProps {
  data: ParticleData;
  appState: AppState;
  isZoomed: boolean;
  onClick?: () => void;
  focusRig?: THREE.Group | null;
}

const disposeObject = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
            } else {
                mesh.material.dispose();
            }
        }
    });
};

const Snowfall = () => {
    const count = 1200;
    const { positions, speeds, phases } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        const phs = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = Math.random() * 20 - 2;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
            spd[i] = 0.5 + Math.random() * 1.5;
            phs[i] = Math.random() * Math.PI * 2;
        }
        return { positions: pos, speeds: spd, phases: phs };
    }, []);

    const pointsRef = useRef<THREE.Points>(null);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const geo = pointsRef.current.geometry;
        const posAttr = geo.attributes.position;
        const time = state.clock.elapsedTime;

        for (let i = 0; i < count; i++) {
            let x = posAttr.getX(i);
            let y = posAttr.getY(i);
            let z = posAttr.getZ(i);

            y -= speeds[i] * delta * 1.5;
            x += Math.sin(time + phases[i]) * 0.01;
            z += Math.cos(time + phases[i]) * 0.01;

            if (y < -4) {
                y = 18;
                x = (Math.random() - 0.5) * 30;
                z = (Math.random() - 0.5) * 30;
            }

            posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} raycast={() => null}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.04}
                color="#E0F7FA"
                transparent
                opacity={0.4}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
};

const GoldenGlints = ({ appState }: { appState: AppState }) => {
    const count = 180;
    const { positions, scatterPositions, phases } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const scPos = new Float32Array(count * 3);
        const phs = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const t = 0.1 + Math.random() * 0.85; 
            const height = 18;
            const y = -9 + (height * (1 - t));
            const maxRadius = 6.2 * t + 0.1;
            const angle = Math.random() * Math.PI * 2;
            
            pos[i * 3] = maxRadius * Math.cos(angle);
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = maxRadius * Math.sin(angle);

            scPos[i * 3] = (Math.random() - 0.5) * 40;
            scPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
            scPos[i * 3 + 2] = (Math.random() - 0.5) * 40;

            phs[i] = Math.random() * Math.PI * 2;
        }
        return { positions: pos, scatterPositions: scPos, phases: phs };
    }, []);

    const pointsRef = useRef<THREE.Points>(null);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime;
        const mat = pointsRef.current.material as THREE.PointsMaterial;
        const posAttr = pointsRef.current.geometry.attributes.position;
        const k = 1 - Math.pow(0.001, delta);

        mat.opacity = 0.12 + 0.1 * Math.sin(time * 1.8);

        for (let i = 0; i < count; i++) {
            const targetX = appState === AppState.TREE ? positions[i * 3] : scatterPositions[i * 3];
            const targetY = appState === AppState.TREE ? positions[i * 3 + 1] : scatterPositions[i * 3 + 1];
            const targetZ = appState === AppState.TREE ? positions[i * 3 + 2] : scatterPositions[i * 3 + 2];

            const curX = posAttr.getX(i);
            const curY = posAttr.getY(i);
            const curZ = posAttr.getZ(i);

            posAttr.setXYZ(
                i,
                THREE.MathUtils.lerp(curX, targetX, k),
                THREE.MathUtils.lerp(curY, targetY, k),
                THREE.MathUtils.lerp(curZ, targetZ, k)
            );
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} raycast={() => null}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.025}
                color="#FFD700"
                transparent
                opacity={0.2}
                blending={THREE.AdditiveBlending}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
};

const Star = () => {
    const starShape = useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 1.2;
        const innerRadius = 0.5;
        const points = 5;
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const a = (i / (points * 2)) * Math.PI * 2 - Math.PI/2;
            if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        shape.closePath();
        return shape;
    }, []);

    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
            const t = state.clock.elapsedTime;
            const pulse = 2.5 + Math.sin(t * 3) * 0.5;
            if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
                meshRef.current.material.emissiveIntensity = pulse;
            }
        }
    });

    useEffect(() => {
        return () => { if (meshRef.current) disposeObject(meshRef.current); };
    }, []);

    return (
        <mesh ref={meshRef} position={[0, 9.8, 0]} scale={0.9} rotation={[0, 0, Math.PI]}>
            <extrudeGeometry args={[starShape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 }]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={3} toneMapped={false} />
        </mesh>
    );
};

const GiftMesh: React.FC<ParticleProps> = ({ data, appState, isZoomed, onClick, focusRig }) => {
    const groupRef = useRef<THREE.Group>(null);
    const lidRef = useRef<THREE.Group>(null);
    const { camera } = useThree();
    const originalParent = useRef<THREE.Object3D | null>(null);
    const savedTransform = useRef({
        pos: new THREE.Vector3(),
        quat: new THREE.Quaternion(),
        scale: new THREE.Vector3()
    });

    const setDepth = (test: boolean) => {
        if (!groupRef.current) return;
        groupRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                if (mat) {
                    mat.depthTest = test;
                    mat.depthWrite = test;
                    mat.needsUpdate = true;
                }
            }
        });
    };

    useEffect(() => {
        if (isZoomed && groupRef.current && focusRig) {
            originalParent.current = groupRef.current.parent;
            savedTransform.current.pos.copy(groupRef.current.position);
            savedTransform.current.quat.copy(groupRef.current.quaternion);
            savedTransform.current.scale.copy(groupRef.current.scale);
            
            focusRig.attach(groupRef.current);
            groupRef.current.renderOrder = 1000;
            setDepth(false);
        } else if (!isZoomed && groupRef.current && originalParent.current) {
            originalParent.current.attach(groupRef.current);
            groupRef.current.position.copy(savedTransform.current.pos);
            groupRef.current.quaternion.copy(savedTransform.current.quat);
            groupRef.current.scale.copy(savedTransform.current.scale);
            groupRef.current.renderOrder = 1;
            setDepth(true);
        }
    }, [isZoomed, focusRig]);
    
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const k = 1 - Math.pow(0.001, delta);
        if (isZoomed && appState === AppState.ZOOM && focusRig) {
             const camDir = new THREE.Vector3();
             camera.getWorldDirection(camDir);
             const focusDistance = 9;
             const focusPoint = camera.position.clone().add(camDir.multiplyScalar(focusDistance));
             const fpLocal = focusRig.worldToLocal(focusPoint.clone());
             groupRef.current.position.lerp(fpLocal, k);
             groupRef.current.lookAt(camera.position);
             const targetScale = 2.4;
             groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), k);
        } else {
             let targetPos = appState === AppState.TREE ? data.treePosition : data.scatterPosition;
             let targetRot = data.rotation;
             let targetScale = data.scale;
             easing.damp3(groupRef.current.position, targetPos, 1.2, delta);
             easing.dampE(groupRef.current.rotation, [targetRot.x, targetRot.y, targetRot.z], 1.2, delta);
             const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 4);
             groupRef.current.scale.setScalar(s);
             if (appState === AppState.SCATTER) groupRef.current.rotation.x += delta * 0.2;
        }
        if (lidRef.current) {
            const targetLidRot = isZoomed ? -Math.PI * 0.65 : 0; 
            easing.damp(lidRef.current.rotation, 'x', targetLidRot, 0.4, delta);
        }
    });

    useEffect(() => {
        return () => { if (groupRef.current) disposeObject(groupRef.current); };
    }, []);

    const boxWidth = 1.5, boxDepth = 1.5, bodyHeight = 1.0, lidHeight = 0.3, ribbonW = 0.25;

    return (
        <group 
            ref={groupRef} 
            onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
            onPointerOver={() => { document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = 'default' }}
        >
            <group position={[0, 0.2, 0]} visible={isZoomed}>
                <Text 
                    font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff" 
                    fontSize={0.8} color="#FFD700" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#8A0303"
                    renderOrder={1001}
                    // @ts-ignore
                    depthTest={false}
                    // @ts-ignore
                    depthWrite={false}
                >
                    {data.content || "🎁"}
                </Text>
            </group>
            <group position={[0, -0.2, 0]}>
                <mesh><boxGeometry args={[boxWidth, bodyHeight, boxDepth]} /><meshStandardMaterial color={data.color} roughness={0.3} metalness={0.1} /></mesh>
                <mesh><boxGeometry args={[boxWidth + 0.02, bodyHeight + 0.01, ribbonW]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.2} metalness={0.8} /></mesh>
                <mesh><boxGeometry args={[ribbonW, bodyHeight + 0.01, boxDepth + 0.02]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.2} metalness={0.8} /></mesh>
            </group>
            <group ref={lidRef} position={[0, 0.3, -0.75]}>
                <group position={[0, 0.15, 0.75]}>
                    <mesh><boxGeometry args={[boxWidth + 0.1, lidHeight, boxDepth + 0.1]} /><meshStandardMaterial color={data.color} roughness={0.3} metalness={0.1} /></mesh>
                    <mesh><boxGeometry args={[boxWidth + 0.12, lidHeight + 0.01, ribbonW]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.2} metalness={0.8} /></mesh>
                    <mesh><boxGeometry args={[ribbonW, lidHeight + 0.01, boxDepth + 0.12]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.2} metalness={0.8} /></mesh>
                    <group position={[0, lidHeight/2, 0]}>
                        <mesh position={[0,0.05,0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} metalness={0.9} /></mesh>
                        <mesh position={[-0.25, 0.15, 0]} rotation={[0.4, 0, Math.PI/6]}><torusGeometry args={[0.2, 0.05, 12, 24]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} metalness={0.9} /></mesh>
                        <mesh position={[0.25, 0.15, 0]} rotation={[0.4, 0, -Math.PI/6]}><torusGeometry args={[0.2, 0.05, 12, 24]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} metalness={0.9} /></mesh>
                        <mesh position={[-0.15, -0.05, 0.25]} rotation={[0.6, 0, 0.3]}><planeGeometry args={[0.12, 0.6]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} metalness={0.9} side={THREE.DoubleSide} /></mesh>
                        <mesh position={[0.15, -0.05, 0.25]} rotation={[0.6, 0, -0.3]}><planeGeometry args={[0.12, 0.6]} /><meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} metalness={0.9} side={THREE.DoubleSide} /></mesh>
                    </group>
                </group>
            </group>
        </group>
    );
};

const SpiralRibbon: React.FC<{ points: THREE.Vector3[], appState: AppState }> = ({ points, appState }) => {
    const curve = useMemo(() => {
        if (points.length < 2) return null;
        return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
    }, [points]);
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const targetScale = appState === AppState.TREE ? 1 : 0;
        easing.damp3(groupRef.current.scale, new THREE.Vector3(targetScale, targetScale, targetScale), 0.5, delta);
    });
    useEffect(() => {
        return () => { if (groupRef.current) disposeObject(groupRef.current); };
    }, []);
    if (!curve) return null;
    return (
        <group ref={groupRef}>
            <mesh>
                <tubeGeometry args={[curve, 128, 0.01, 8, false]} />
                <meshStandardMaterial color="#FFF8E7" emissive="#FFD700" emissiveIntensity={5} toneMapped={false} transparent opacity={0.8} />
            </mesh>
        </group>
    );
};

const MagicParticles: React.FC<Props> = ({ appState, photos, gesture, setAppState }) => {
  const { particles, spiralPoints } = useMemo(() => generateTreeParticles(photos), [photos]);
  const treeGroupRef = useRef<THREE.Group>(null);
  const photoGroupRef = useRef<THREE.Group>(null);
  const focusRigRef = useRef<THREE.Group>(null); 
  const [zoomedId, setZoomedId] = useState<string | null>(null);
  const { camera, controls } = useThree(); 

  const ornaments = useMemo(() => particles.filter(p => p.type === 'ornament'), [particles]);
  const gifts = useMemo(() => particles.filter(p => p.type === 'gift'), [particles]);
  const candies = useMemo(() => particles.filter(p => p.type === 'candy'), [particles]);
  const photoParticles = useMemo(() => particles.filter(p => p.type === 'photo'), [particles]);

  const candyTexture = useMemo(() => getCandyCaneTexture(), []);
  const wasPinchingLastFrame = useRef<boolean>(false);

  const candyGeometry = useMemo(() => {
     class CustomSinCurve extends THREE.Curve<THREE.Vector3> {
        constructor() { super(); }
        getPoint(t: number, optionalTarget?: THREE.Vector3) {
            const tx = t;
            const point = optionalTarget || new THREE.Vector3();
            if (tx < 0.7) { point.set(0, tx * 2, 0); } else {
                const angle = (tx - 0.7) / 0.3 * Math.PI;
                point.set(-0.3 * (1 - Math.cos(angle)), 1.4 + 0.3 * Math.sin(angle), 0);
            }
            return point;
        }
     }
     return new THREE.TubeGeometry(new CustomSinCurve(), 20, 0.08, 8, false);
  }, []);

  const selectNearestToCenter = () => {
    const interactives = [...photoParticles, ...gifts];
    let nearestId = null;
    let minDistSq = 0.15 * 0.15; 
    const pos = new THREE.Vector3();
    interactives.forEach(item => {
        pos.copy(appState === AppState.TREE ? item.treePosition : item.scatterPosition);
        pos.project(camera);
        const distSq = pos.x * pos.x + pos.y * pos.y;
        if (distSq < minDistSq) { minDistSq = distSq; nearestId = item.id; }
    });
    return nearestId;
  };

  useFrame((state, delta) => {
    if (appState === AppState.ZOOM && zoomedId) {
        const ctrl = controls as any;
        if (ctrl && ctrl.target) { easing.damp3(ctrl.target, [0, 0, 0], 0.8, delta); ctrl.update(); }
    } else {
         const ctrl = controls as any;
         if (ctrl && ctrl.target) { easing.damp3(ctrl.target, [0, 0, 0], 1.2, delta); ctrl.update(); }
    }
    if (treeGroupRef.current) {
        if (appState === AppState.TREE) { treeGroupRef.current.rotation.y += delta * 0.15; } 
        else if (appState === AppState.SCATTER && !gesture.isPinching) {
            easing.dampE(treeGroupRef.current.rotation, [gesture.handPosition.y * 1.5, gesture.handPosition.x * 2.5, 0], 0.5, delta);
        }
    }
    if (photoGroupRef.current) {
        if (appState === AppState.TREE) { photoGroupRef.current.rotation.y -= delta * 0.15; } 
        else if (appState === AppState.SCATTER && !gesture.isPinching) {
            easing.dampE(photoGroupRef.current.rotation, [gesture.handPosition.y * 1.5, gesture.handPosition.x * 2.5, 0], 0.5, delta);
        }
    }
  });

  useFrame(() => {
    const pinchConfirmed = gesture.pinchConfirmed;
    if (appState !== AppState.ZOOM && pinchConfirmed && !wasPinchingLastFrame.current) {
        const nearestId = selectNearestToCenter();
        if (nearestId) handleItemClick(nearestId);
    }
    if (appState === AppState.ZOOM && (gesture.isFist || gesture.isOpenPalm)) {
        setZoomedId(null);
        setAppState(gesture.isFist ? AppState.TREE : AppState.SCATTER);
    }
    wasPinchingLastFrame.current = pinchConfirmed;
  });

  const handleItemClick = (id: string) => {
      if (zoomedId === id && appState === AppState.ZOOM) {
          setZoomedId(null);
          setAppState(AppState.SCATTER); 
      } else {
          const clickedItem = particles.find(p => p.id === id);
          if (clickedItem && clickedItem.type === 'gift') {
              window.dispatchEvent(new CustomEvent('gift-open'));
          }
          setZoomedId(id);
          setAppState(AppState.ZOOM);
      }
  };

  return (
    <>
      <group ref={focusRigRef} name="focusRig" />
      <Snowfall />
      <group ref={treeGroupRef}>
        <Star />
        <GoldenGlints appState={appState} />
        <Instances range={ornaments.length}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial roughness={0.2} metalness={0.8} />
            {ornaments.map((data) => (
            <ParticleInstance key={data.id} data={data} appState={appState} isZoomed={false} />
            ))}
        </Instances>
        {gifts.map(data => (
            <GiftMesh key={data.id} data={data} appState={appState} isZoomed={zoomedId === data.id} onClick={() => handleItemClick(data.id)} focusRig={focusRigRef.current} />
        ))}
        <Instances range={candies.length} geometry={candyGeometry}>
            <meshStandardMaterial map={candyTexture} roughness={0.4} metalness={0.1} />
            {candies.map((data) => (
            <ParticleInstance key={data.id} data={data} appState={appState} isZoomed={false} />
            ))}
        </Instances>
      </group>
      <group ref={photoGroupRef}>
          <SpiralRibbon points={spiralPoints} appState={appState} />
          {photoParticles.map((data) => (
             <PhotoMesh key={data.id} data={data} appState={appState} isZoomed={zoomedId === data.id} onClick={() => handleItemClick(data.id)} focusRig={focusRigRef.current} />
          ))}
      </group>
    </>
  );
};

const ParticleInstance: React.FC<ParticleProps> = ({ data, appState }) => {
    const ref = useRef<any>(null);
    useFrame((state, delta) => {
        if (!ref.current) return;
        easing.damp3(ref.current.position, appState === AppState.TREE ? data.treePosition : data.scatterPosition, 1.2, delta);
        easing.damp(ref.current.scale, "x", data.scale, 0.5, delta);
        easing.damp(ref.current.scale, "y", data.scale, 0.5, delta);
        easing.damp(ref.current.scale, "z", data.scale, 0.5, delta);
        if (data.color) ref.current.color.set(data.color);
        if (appState === AppState.SCATTER) { ref.current.rotation.x += delta * 0.2; ref.current.rotation.y += delta * 0.1; } 
        else { ref.current.rotation.x = data.rotation.x; ref.current.rotation.z = data.rotation.z; }
    });
    return <Instance ref={ref} />;
};

const PhotoMesh: React.FC<ParticleProps> = ({ data, appState, isZoomed, onClick, focusRig }) => {
    const meshRef = useRef<THREE.Group>(null);
    const photoPlaneRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();
    const originalParent = useRef<THREE.Object3D | null>(null);
    const savedTransform = useRef({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3() });
    
    // Robust manual texture loader with error handling
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!data.imageUrl) return;
        const loader = new THREE.TextureLoader();
        loader.load(
            data.imageUrl,
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                setTexture(tex);
                setHasError(false);
            },
            undefined,
            () => {
                console.warn(`Could not load photo: ${data.imageUrl}. Displaying fallback.`);
                setHasError(true);
            }
        );
    }, [data.imageUrl]);

    const setDepth = (test: boolean) => {
        if (!meshRef.current) return;
        meshRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.Material;
                if (mat) { mat.depthTest = test; mat.depthWrite = test; mat.needsUpdate = true; }
            }
        });
    };

    useEffect(() => {
        if (isZoomed && meshRef.current && focusRig) {
            originalParent.current = meshRef.current.parent;
            savedTransform.current.pos.copy(meshRef.current.position);
            savedTransform.current.quat.copy(meshRef.current.quaternion);
            savedTransform.current.scale.copy(meshRef.current.scale);
            focusRig.attach(meshRef.current);
            meshRef.current.renderOrder = 1000;
            setDepth(false);
        } else if (!isZoomed && meshRef.current && originalParent.current) {
            originalParent.current.attach(meshRef.current);
            meshRef.current.position.copy(savedTransform.current.pos);
            meshRef.current.quaternion.copy(savedTransform.current.quat);
            meshRef.current.scale.copy(savedTransform.current.scale);
            meshRef.current.renderOrder = 1;
            setDepth(true);
        }
    }, [isZoomed, focusRig]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const k = 1 - Math.pow(0.001, delta);
        if (isZoomed && appState === AppState.ZOOM && focusRig) {
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            const focusPoint = camera.position.clone().add(camDir.multiplyScalar(8));
            meshRef.current.position.lerp(focusRig.worldToLocal(focusPoint.clone()), k);
            meshRef.current.lookAt(camera.position);
            meshRef.current.scale.lerp(new THREE.Vector3(4.2, 4.2, 4.2), k);
        } else {
            easing.damp3(meshRef.current.position, appState === AppState.TREE ? data.treePosition : data.scatterPosition, 1.5, delta);
            if (appState === AppState.SCATTER) { meshRef.current.rotation.x += delta * 0.1; meshRef.current.rotation.y += delta * 0.1; } 
            else { easing.dampE(meshRef.current.rotation, [data.rotation.x, data.rotation.y, data.rotation.z], 1.0, delta); }
            meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, data.scale, delta * 4));
        }
    });

    useEffect(() => {
        return () => { if (meshRef.current) disposeObject(meshRef.current); };
    }, []);

    return (
        <Float speed={appState === AppState.TREE || isZoomed ? 0 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
                <group position={[0, -0.15, 0]}>
                    <mesh>
                        <boxGeometry args={[1.2, 1.5, 0.01]} />
                        <meshStandardMaterial 
                            color="#FAD02C" 
                            metalness={0.7} 
                            roughness={0.3} 
                            emissive="#FAD02C" 
                            emissiveIntensity={2} 
                        />
                    </mesh>
                </group>
                <mesh ref={photoPlaneRef} position={[0, 0.1, 0.01]}>
                     <planeGeometry args={[1, 1]} />
                     <meshBasicMaterial 
                        map={texture || null} 
                        color={hasError || !texture ? "#1a2a1a" : "white"}
                        side={THREE.DoubleSide} 
                        toneMapped={false} 
                        transparent={false} 
                        depthWrite={true}
                     />
                </mesh>
            </group>
        </Float>
    );
};

export default MagicParticles;
