import React, { useState, useCallback } from 'react';
import Scene from './components/Scene';
import VisionController from './components/VisionController';
import AudioController from './components/AudioController';
import { AppState, HandGesture } from './types';
import { generateDefaultPhotos } from './services/utils';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [isBgmOn, setIsBgmOn] = useState<boolean>(false);
  const [photos, setPhotos] = useState<string[]>(generateDefaultPhotos());
  const [gesture, setGesture] = useState<HandGesture>({
    isFist: false,
    isOpenPalm: false,
    isPinching: false,
    pinchConfirmed: false,
    handPosition: { x: 0, y: 0 }
  });

  const handleGestureUpdate = useCallback((newGesture: HandGesture) => {
    setGesture(newGesture);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: string[] = [];
      Array.from(e.target.files).forEach((file) => {
        newPhotos.push(URL.createObjectURL(file as Blob));
      });
      setPhotos(prev => [...newPhotos, ...prev].slice(0, 11)); 
    }
  };

  const handleResetPhotos = () => {
      setPhotos(generateDefaultPhotos());
  };

  return (
    <div className="relative w-full h-screen font-serif text-gold selection:bg-gold selection:text-black">
      
      <AudioController isBgmOn={isBgmOn} />

      <div className="absolute inset-0 z-0">
        <Scene 
            appState={appState} 
            setAppState={setAppState}
            photos={photos}
            gesture={gesture}
        />
      </div>

      <VisionController 
        onGestureUpdate={handleGestureUpdate}
        setAppState={setAppState}
        currentAppState={appState}
      />

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12">
        
        <header className="flex justify-between items-start animate-fade-in-down">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-[#D4AF37] to-[#8A6E03] font-bold tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                🐷🐷🎄
              </h1>
              <p className="text-[#D4AF37]/80 text-sm tracking-[0.3em] mt-2 uppercase">
                2025/12/24
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-[#D4AF37]/30 px-4 py-2 rounded-full flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${appState === AppState.TREE ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-[#D4AF37]'}`}></div>
               <span className="text-[#D4AF37] text-xs font-mono uppercase">
                 {appState}
               </span>
            </div>

            <button 
                onClick={() => setIsBgmOn(!isBgmOn)}
                className="pointer-events-auto cursor-pointer bg-black/40 backdrop-blur-md p-2 rounded-full border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-all text-[#D4AF37] group relative flex items-center justify-center w-10 h-10"
                title={isBgmOn ? 'Mute' : 'Play Music'}
            >
               <div className={`music-btn-container ${!isBgmOn ? 'music-slash' : ''}`}>
                  <span className="text-lg leading-none">🎵</span>
               </div>
            </button>

            <button 
                onClick={handleResetPhotos}
                className="pointer-events-auto cursor-pointer bg-black/40 backdrop-blur-md p-2 rounded-full border border-[#D4AF37]/30 hover:bg-red-900/40 hover:text-red-400 transition-all text-[#D4AF37] group relative flex items-center justify-center w-10 h-10" 
                title="Reset Photos"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                 </svg>
            </button>

            <label className="pointer-events-auto cursor-pointer bg-black/40 backdrop-blur-md p-2 rounded-full border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-all text-[#D4AF37] group relative flex items-center justify-center w-10 h-10" title="Upload Photos">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                 </svg>
                 <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </header>

        <div className="text-center md:text-right flex flex-col items-end gap-2">
            <div className="pointer-events-auto inline-block text-left space-y-1 text-[#D4AF37]/60 text-xs font-mono bg-black/40 backdrop-blur-md p-4 rounded-lg border border-[#D4AF37]/10">
                <p className="text-[#D4AF37] border-b border-[#D4AF37]/20 pb-1 mb-1 uppercase tracking-wider">Gestures</p>
                <div className="flex items-center gap-2">
                    <span className="text-lg">✊</span> <span>Fist: Tree</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg">🖐️</span> <span>Open: Scatter</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg">🤌</span> <span>Pinch: Select</span>
                </div>
                <p className="text-[#D4AF37] border-b border-[#D4AF37]/20 pb-1 mb-1 mt-2 uppercase tracking-wider">Mouse</p>
                <div className="flex items-center gap-2">
                    <span>🖱️</span> <span>Orbit | Scroll: Zoom</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>👆</span> <span>Click: View Detail</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span>✌️</span> <span>Double Click: Toggle State</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;