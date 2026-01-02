
import React, { useEffect, useRef } from 'react';

interface Props {
  isBgmOn: boolean;
}

const AudioController: React.FC<Props> = ({ isBgmOn }) => {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    // Initialize SFX
    const sfxPath = getAssetPath('audio/gift_open.mp3');
    const sfx = new Audio(sfxPath);
    sfx.volume = 0.7;
    sfxRef.current = sfx;

    const handleGiftOpen = () => {
      if (sfxRef.current) {
        sfxRef.current.currentTime = 0;
        sfxRef.current.play().catch(e => console.warn("音效播放失败:", e));
      }
    };

    window.addEventListener('gift-open', handleGiftOpen);

    return () => {
      window.removeEventListener('gift-open', handleGiftOpen);
      if (sfxRef.current) {
        sfxRef.current.pause();
        sfxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isBgmOn) {
      if (!bgmRef.current) {
        const bgmPath = getAssetPath('audio/christmas.mp3');
        const bgm = new Audio(bgmPath);
        bgm.loop = true;
        bgm.volume = 0.5;
        bgmRef.current = bgm;
      }
      bgmRef.current.play().catch(err => {
        console.warn("音频播放被拦截:", err);
      });
    } else {
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    }
  }, [isBgmOn]);

  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  return null;
};

export default AudioController;
