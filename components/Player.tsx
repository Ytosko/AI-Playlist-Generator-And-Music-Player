import React, { useEffect, useRef, useState } from 'react';
import type { Song, RepeatMode } from '../types';
import { ICONS } from '../constants';

// Augment the window object with the YouTube IFrame API types
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface PlayerProps {
  song: Song | null;
  isPlaying: boolean;
  repeatMode: RepeatMode;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onEnded: () => void;
  onPlaybackError: () => void;
  onToggleRepeat: () => void;
}

export const Player: React.FC<PlayerProps> = ({ 
    song, 
    isPlaying, 
    repeatMode,
    onPlayPause, 
    onNext, 
    onPrevious, 
    onEnded, 
    onPlaybackError,
    onToggleRepeat,
}) => {
  const playerRef = useRef<any | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Use refs for callbacks to avoid stale closures in YT API
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  
  const onPlaybackErrorRef = useRef(onPlaybackError);
  useEffect(() => { onPlaybackErrorRef.current = onPlaybackError; }, [onPlaybackError]);
  
  const repeatModeRef = useRef(repeatMode);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Declarative interval for syncing playback time
  useEffect(() => {
    let intervalId: number | undefined;

    if (isPlaying && isPlayerReady) {
      intervalId = window.setInterval(() => {
        const player = playerRef.current;
        if (
          player &&
          typeof player.getCurrentTime === 'function' &&
          player.getPlayerState() === window.YT.PlayerState.PLAYING
        ) {
          const time = player.getCurrentTime();
          if (typeof time === 'number') {
            setCurrentTime(time);
          }
        }
      }, 500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, isPlayerReady]);


  useEffect(() => {
    const initializePlayer = () => {
      if (window.YT && !playerRef.current) {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '0',
          width: '0',
          playerVars: { controls: 0, playsinline: 1, fs: 0, modestbranding: 1 },
          events: {
            onReady: (event: any) => {
              setIsPlayerReady(true);
            },
            onStateChange: (event: any) => {
              const playerState = event.data;
              const player = playerRef.current;

              // When a new video is cued, play it if the app's intent is to play.
              if (playerState === window.YT.PlayerState.CUED && isPlayingRef.current) {
                  player?.playVideo();
              }

              if (playerState === window.YT.PlayerState.ENDED) {
                if (repeatModeRef.current === 'one' && player) {
                  player.seekTo(0, true);
                  player.playVideo();
                } else {
                  onEndedRef.current();
                }
              }
            },
            onError: (event: any) => {
              const unplayableErrorCodes = [100, 101, 150];
              if (unplayableErrorCodes.includes(event.data)) {
                console.error(`YouTube Player Error: Video is unplayable (Code: ${event.data}). Skipping.`);
                onPlaybackErrorRef.current();
              }
            },
          },
        });
      }
    };
    
    if (!window.YT) {
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }
  }, []);
  
  // Reset timer when song changes
  useEffect(() => {
    setCurrentTime(0);
  }, [song]);

  // Unified playback control effect
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) return;

    if (!song || !song.youtubeId) {
      player.stopVideo();
      return;
    }

    const currentVideoId = player.getVideoData()?.video_id;

    // Primary Action: If the song ID is different, load it.
    // The onStateChange handler will then trigger playVideo if appropriate.
    if (song.youtubeId !== currentVideoId) {
      player.loadVideoById(song.youtubeId);
      return; // IMPORTANT: Exit to prevent race conditions.
    }

    // Secondary Action: If the song is already loaded, control play/pause.
    const playerState = player.getPlayerState();
    if (isPlaying && playerState !== window.YT.PlayerState.PLAYING) {
      player.playVideo();
    } else if (!isPlaying && playerState === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
    }
  }, [song, isPlaying, isPlayerReady]);

  // Effect to manage volume
  useEffect(() => {
    const player = playerRef.current;
    if (player && player.setVolume) {
      player.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted, isPlayerReady]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const player = playerRef.current;
    if (player && isPlayerReady) {
      const newTime = Number(e.target.value);
      setCurrentTime(newTime); // Update UI immediately
      player.seekTo(newTime, true);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setLastVolume(newVolume);
    if(newVolume > 0) setIsMuted(false);
  };
  
  const toggleMute = () => {
    setIsMuted(prev => {
        const isCurrentlyMuted = prev || volume <= 0.01;
        if (isCurrentlyMuted) { // Unmute
            const newVolume = lastVolume > 0.05 ? lastVolume : 0.5;
            setVolume(newVolume);
            return false;
        } else { // Mute
            setLastVolume(volume);
            setVolume(0);
            return true;
        }
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const duration = song?.durationSeconds || 0;

  const renderRepeatIcon = () => {
    switch(repeatMode) {
      case 'one': return ICONS.REPEAT_ONE;
      case 'all': return ICONS.REPEAT;
      default: return ICONS.REPEAT;
    }
  };

  const renderMaximizedPlayer = () => (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 animate-fade-in">
        <div 
          className="absolute inset-0 bg-center bg-cover transition-all-medium"
          style={{ backgroundImage: `url(${song?.albumArtUrl})`, animation: 'slow-pan 40s ease-in-out infinite' }}
        />
        <div className="absolute inset-0 bg-player-maximized backdrop-blur-3xl" />

        <div className="relative w-full h-full flex flex-col items-center justify-center text-center animate-slide-up-fade" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsMaximized(false)} className="absolute top-6 right-6 text-primary/70 hover:text-primary transition-all-fast z-10 active:scale-95">
                <div className="w-8 h-8">{ICONS.MINIMIZE}</div>
            </button>
            
            <div className="relative w-full max-w-sm aspect-square mb-8 shadow-xl">
                {song?.albumArtUrl ? (
                  <img 
                      src={song.albumArtUrl} 
                      alt={song.title} 
                      className={`w-full h-full rounded-2xl object-cover shadow-2xl ${isPlaying ? 'animate-[slow-spin_30s_linear_infinite]' : ''}`}
                  />
                ) : (
                    <div className="w-full h-full bg-tertiary rounded-2xl flex items-center justify-center">
                        <div className="w-24 h-24 text-secondary">{ICONS.MUSIC_NOTE}</div>
                    </div>
                )}
            </div>

            <h2 className="text-4xl font-bold truncate max-w-full text-primary tracking-tight">{song?.title || 'Unknown Song'}</h2>
            <p className="text-xl text-primary/60 mt-2 truncate max-w-full">{song?.artist || 'Unknown Artist'}</p>

            <div className="flex items-center space-x-2 w-full max-w-lg mt-8">
              <span className="text-sm text-primary/60 w-12 text-center">{formatTime(currentTime)}</span>
              <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleProgressChange}
                  disabled={!song || duration === 0}
                  className="w-full h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-color disabled:cursor-not-allowed"
              />
              <span className="text-sm text-primary/60 w-12 text-center">{formatTime(duration || 0)}</span>
            </div>

            <div className="flex items-center space-x-8 mt-6">
                <button onClick={onToggleRepeat} className={`transition-all-fast active:scale-95 ${repeatMode !== 'none' ? 'text-accent' : 'text-primary/60 hover:text-primary'}`}>
                    <div className="w-6 h-6">{renderRepeatIcon()}</div>
                </button>
                <button onClick={onPrevious} disabled={!song} className="text-primary/80 hover:text-primary transition-all-fast disabled:text-primary/30 disabled:cursor-not-allowed active:scale-95">
                    <div className="w-8 h-8">{ICONS.PREVIOUS}</div>
                </button>
                <button 
                    onClick={onPlayPause} 
                    disabled={!song || !isPlayerReady}
                    className="bg-play-button text-play-button rounded-full p-4 w-20 h-20 flex items-center justify-center hover:scale-105 transition-all-fast active:scale-95 disabled:bg-tertiary disabled:cursor-not-allowed disabled:scale-100"
                >
                    <div className="w-8 h-8">{isPlaying ? ICONS.PAUSE : ICONS.PLAY}</div>
                </button>
                <button onClick={onNext} disabled={!song} className="text-primary/80 hover:text-primary transition-all-fast disabled:text-primary/30 disabled:cursor-not-allowed active:scale-95">
                    <div className="w-8 h-8">{ICONS.NEXT}</div>
                </button>
                <button onClick={toggleMute} className="text-primary/60 hover:text-primary transition-all-fast active:scale-95">
                    <div className="w-7 h-7">{volume <= 0.01 || isMuted ? ICONS.VOLUME_MUTED : ICONS.VOLUME_HIGH}</div>
                </button>
            </div>
        </div>
    </div>
  );

  const renderMinimizedPlayer = () => (
    <footer className="bg-secondary/80 backdrop-blur-md border-t border-primary p-3 md:p-4 fixed bottom-0 left-0 right-0 z-40">
      <div className="md:grid md:grid-cols-3 md:items-center flex flex-col items-center">
        {/* Song Info (Left on Desktop, Top on Mobile) */}
        <div className="w-full md:w-auto flex items-center space-x-4 min-w-0 md:mb-0 mb-3">
          {song ? (
            <>
              {song.albumArtUrl ? (
                  <img src={song.albumArtUrl} alt={song.title} className="w-14 h-14 rounded-md object-cover shadow-md" />
              ) : (
                  <div className="w-14 h-14 bg-tertiary rounded-md flex items-center justify-center">
                      <div className="w-8 h-8 text-secondary">{ICONS.MUSIC_NOTE}</div>
                  </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate text-primary">{song.title}</p>
                <p className="text-sm text-tertiary truncate">{song.artist}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-tertiary rounded-md flex-shrink-0"></div>
              <div>
                <p className="font-semibold text-primary">No Song Playing</p>
              </div>
            </div>
          )}
        </div>

        {/* Player Controls (Center on Desktop, Middle on Mobile) */}
        <div className="flex flex-col items-center justify-center space-y-2 w-full max-w-lg">
          <div className="flex items-center space-x-6">
            <button onClick={onToggleRepeat} title={`Repeat: ${repeatMode}`} className={`transition-all-fast active:scale-95 ${repeatMode !== 'none' ? 'text-accent' : 'text-tertiary hover:text-secondary'}`}>
                <div className="w-5 h-5">{renderRepeatIcon()}</div>
            </button>
            <button onClick={onPrevious} disabled={!song} className="text-tertiary hover:text-secondary transition-all-fast disabled:text-tertiary/50 disabled:cursor-not-allowed active:scale-95">
              <div className="w-5 h-5">{ICONS.PREVIOUS}</div>
            </button>
            <button 
              onClick={onPlayPause} 
              disabled={!song || !isPlayerReady}
              className="bg-play-button text-play-button rounded-full p-2 w-10 h-10 flex items-center justify-center hover:scale-105 transition-all-fast active:scale-95 disabled:bg-tertiary disabled:cursor-not-allowed"
            >
              <div className="w-5 h-5">{isPlaying ? ICONS.PAUSE : ICONS.PLAY}</div>
            </button>
            <button onClick={onNext} disabled={!song} className="text-tertiary hover:text-secondary transition-all-fast disabled:text-tertiary/50 disabled:cursor-not-allowed active:scale-95">
              <div className="w-5 h-5">{ICONS.NEXT}</div>
            </button>
             <button onClick={() => setIsMaximized(true)} disabled={!song} className="text-tertiary hover:text-secondary transition-all-fast disabled:text-tertiary/50 disabled:cursor-not-allowed active:scale-95">
                <div className="w-5 h-5">{ICONS.MAXIMIZE}</div>
            </button>
          </div>
          <div className="flex items-center space-x-2 w-full">
              <span className="text-xs text-tertiary w-10 text-center">{formatTime(currentTime)}</span>
              <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleProgressChange}
                  disabled={!song || duration === 0}
                  className="w-full h-1 bg-tertiary rounded-lg appearance-none cursor-pointer accent-color disabled:cursor-not-allowed"
              />
              <span className="text-xs text-tertiary w-10 text-center">{formatTime(duration || 0)}</span>
          </div>
        </div>

        {/* Volume Controls (Right on Desktop, Hidden on Mobile) */}
        <div className="hidden md:flex items-center justify-end space-x-2">
          <button onClick={toggleMute} className="text-tertiary hover:text-secondary transition-all-fast active:scale-95">
              <div className="w-6 h-6">{volume <= 0.01 || isMuted ? ICONS.VOLUME_MUTED : ICONS.VOLUME_HIGH}</div>
          </button>
          <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-tertiary rounded-lg appearance-none cursor-pointer accent-color"
          />
        </div>
      </div>
    </footer>
  );
  
  return (
    <>
      <div id="youtube-player" className="absolute -left-[9999px] top-[-9999px]"></div>
      {isMaximized ? renderMaximizedPlayer() : renderMinimizedPlayer()}
    </>
  );
};