
import React, { useEffect, useRef, useState } from 'react';
import { HandGesture, AppState } from '../types';

interface Props {
  onGestureUpdate: (gesture: HandGesture) => void;
  setAppState: (state: AppState) => void;
  currentAppState: AppState;
}

const VisionController: React.FC<Props> = ({ onGestureUpdate, setAppState, currentAppState }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  
  // Refs to maintain stable references for callbacks in the singleton init
  const onGestureUpdateRef = useRef(onGestureUpdate);
  const setAppStateRef = useRef(setAppState);
  const currentAppStateRef = useRef(currentAppState);
  
  useEffect(() => {
    onGestureUpdateRef.current = onGestureUpdate;
    setAppStateRef.current = setAppState;
    currentAppStateRef.current = currentAppState;
  }, [onGestureUpdate, setAppState, currentAppState]);

  const lastStateChange = useRef<number>(0);
  const pinchHoldStartTime = useRef<number | null>(null);
  const PINCH_HOLD_THRESHOLD = 400; // ms

  const isInitialized = useRef(false);

  useEffect(() => {
    // PROTECT: Ensure MediaPipe and Camera only initialize once
    if (isInitialized.current) return;
    isInitialized.current = true;

    let camera: any = null;
    let hands: any = null;

    const onResults = (results: any) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        pinchHoldStartTime.current = null;
        onGestureUpdateRef.current({
            isFist: false,
            isOpenPalm: false,
            isPinching: false,
            pinchConfirmed: false,
            handPosition: { x: 0, y: 0 }
        });
        return;
      }

      const landmarks = results.multiHandLandmarks[0];
      const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      const getX = (val: number) => canvas ? (1 - val) * canvas.width : 0;
      const getY = (val: number) => canvas ? val * canvas.height : 0;

      const wrist = landmarks[0];
      const middleTip = landmarks[12];
      const palmOpenness = dist(wrist, middleTip); 
      const isFist = palmOpenness < 0.25; 
      const isOpenPalm = palmOpenness > 0.45;

      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const indexMcp = landmarks[5];
      const pinchDist = dist(thumbTip, indexTip);
      const indexLength = dist(indexMcp, indexTip);
      const PINCH_THRESHOLD = indexLength * 0.35; 
      const isPinching = pinchDist < PINCH_THRESHOLD;
      
      const now = performance.now();
      if (isPinching) {
          if (pinchHoldStartTime.current === null) pinchHoldStartTime.current = now;
      } else {
          pinchHoldStartTime.current = null;
      }
      
      const pinchConfirmed = isPinching && pinchHoldStartTime.current !== null && (now - pinchHoldStartTime.current > PINCH_HOLD_THRESHOLD);

      if (canvas && ctx) {
          const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
          ctx.save();
          ctx.strokeStyle = pinchConfirmed ? 'rgba(0, 255, 128, 0.6)' : 'rgba(212, 175, 55, 0.4)';
          ctx.lineWidth = 2;
          connections.forEach(([i, j]) => {
              ctx.beginPath();
              ctx.moveTo(getX(landmarks[i].x), getY(landmarks[i].y));
              ctx.lineTo(getX(landmarks[j].x), getY(landmarks[j].y));
              ctx.stroke();
          });
          landmarks.forEach((p: any) => {
              ctx.beginPath();
              ctx.arc(getX(p.x), getY(p.y), 3, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fill();
          });
          if (isPinching) {
              ctx.strokeStyle = pinchConfirmed ? '#00FF80' : '#D4AF37';
              ctx.lineWidth = 3;
              if (pinchConfirmed) { ctx.shadowBlur = 10; ctx.shadowColor = '#00FF80'; }
              ctx.beginPath();
              ctx.moveTo(getX(thumbTip.x), getY(thumbTip.y));
              ctx.lineTo(getX(indexTip.x), getY(indexTip.y));
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(getX(thumbTip.x), getY(thumbTip.y), 8, 0, Math.PI * 2);
              ctx.arc(getX(indexTip.x), getY(indexTip.y), 8, 0, Math.PI * 2);
              ctx.stroke();
          }
          ctx.restore();
      }

      const handX = (1 - landmarks[9].x) * 2 - 1; 
      const handY = -(landmarks[9].y * 2 - 1); 

      onGestureUpdateRef.current({
        isFist,
        isOpenPalm,
        isPinching,
        pinchConfirmed,
        handPosition: { x: handX, y: handY }
      });

      const timeSinceLastChange = now - lastStateChange.current;
      if (timeSinceLastChange > 1000) {
        if (isFist && currentAppStateRef.current !== AppState.TREE) {
          setAppStateRef.current(AppState.TREE);
          lastStateChange.current = now;
        } else if (isOpenPalm && currentAppStateRef.current === AppState.TREE) {
          setAppStateRef.current(AppState.SCATTER);
          lastStateChange.current = now;
        }
      }
    };

    const initMP = async () => {
      if (window.Hands && videoRef.current) {
        hands = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        hands.onResults(onResults);

        if (window.Camera) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && hands) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          try {
            await camera.start();
            setCameraPermission(true);
            if (videoRef.current && canvasRef.current) {
                canvasRef.current.width = 640;
                canvasRef.current.height = 480;
            }
          } catch (e) { console.error("Camera failed", e); }
        }
      }
    };

    initMP();
    return () => { 
        if(camera) camera.stop(); 
        // Note: window.Hands usually doesn't need explicit disposal but we null it
        hands = null;
    };
  }, []); // Empty dependency array ensures this runs exactly once

  return (
    <div className="fixed bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-gold/30 z-50 bg-black/50 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80 -scale-x-100 transform" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      {!cameraPermission && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white text-center p-1">
          Camera Loading...
        </div>
      )}
      <div className="absolute top-0 left-0 bg-black/60 text-gold text-[8px] px-1">
        VISION
      </div>
    </div>
  );
};

export default VisionController;
