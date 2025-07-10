import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Playlist, Song, RepeatMode } from './types';
import { ICONS } from './constants';
import { Player } from './components/Player';
import { PlaylistGenerator } from './components/PlaylistGenerator';
import { AddSongModal } from './components/AddSongModal';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyInstructionsModal } from './components/ApiKeyInstructionsModal';
import { generatePlaylistIdeas, generateAlbumArt } from './services/geminiService';
import { findYouTubeVideo } from './services/youtubeService';
import { getPlaylists, savePlaylist, deletePlaylist as dbDeletePlaylist } from './db';
import { setApiKey } from './services/storageService';

const AlbumArtGradient: React.FC<{ colors: string[]; className: string }> = ({ colors, className }) => {
  const displayColors = (colors && colors.length > 0) ? colors : ['#555', '#222'];
  const gradientStyle = {
    backgroundImage: `linear-gradient(to bottom right, ${displayColors.join(', ')})`,
  };
  return <div style={gradientStyle} className={className}></div>;
};

const Sidebar: React.FC<{
  playlists: Playlist[];
  activePlaylistId: string | null;
  onSelectPlaylist: (id: string) => void;
  onShowGenerator: () => void;
  onShowSettings: () => void;
  onDeletePlaylist: (id: string) => void;
  isOpen: boolean;
}> = ({ playlists, activePlaylistId, onSelectPlaylist, onShowGenerator, onShowSettings, onDeletePlaylist, isOpen }) => (
  <aside className={`absolute md:relative w-72 md:w-80 bg-secondary p-2 flex-col h-full z-50 md:flex transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
    <div className="bg-secondary p-2 space-y-2">
      <h2 className="text-xl font-bold text-primary px-2">My Library</h2>
      <button 
        onClick={onShowGenerator}
        className="w-full flex items-center space-x-3 text-primary transition-all-fast bg-tertiary hover:bg-hover p-3 rounded-lg active:scale-95"
      >
        <div className="w-6 h-6 p-1 bg-accent rounded-md text-primary-inverted">{ICONS.PLUS}</div>
        <span className="font-semibold">New AI Playlist</span>
      </button>
       <button 
        onClick={onShowSettings}
        className="w-full flex items-center space-x-3 text-primary transition-all-fast bg-tertiary hover:bg-hover p-3 rounded-lg active:scale-95"
      >
        <div className="w-6 h-6 p-1 bg-tertiary rounded-md text-secondary">{ICONS.SETTINGS}</div>
        <span className="font-semibold">Settings</span>
      </button>
    </div>
    <div className="bg-secondary rounded-lg mt-2 flex-grow overflow-y-auto">
      <ul className="p-2 space-y-1">
        {playlists.map((p, index) => (
          <li
            key={p.id}
            onClick={() => onSelectPlaylist(p.id)}
            className={`group flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all-fast relative animate-list-item ${
              activePlaylistId === p.id ? 'bg-selected' : 'hover:bg-hover'
            }`}
            style={{ animationDelay: `${index * 50}ms`}}
          >
            <AlbumArtGradient colors={p.albumArtColors} className="w-12 h-12 rounded-md object-cover flex-shrink-0 shadow-md" />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold whitespace-normal break-words ${activePlaylistId === p.id ? 'text-accent' : 'text-primary'}`}>{p.playlistName}</p>
              <p className="text-sm text-tertiary">{p.songs.length} songs</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDeletePlaylist(p.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-red-500 transition-all-fast opacity-0 group-hover:opacity-100 p-1 rounded-full bg-tertiary/50 hover:bg-hover active:scale-95">
                <div className="w-4 h-4">{ICONS.TRASH}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

const MainView: React.FC<{
  playlist: Playlist | null;
  onPlaySong: (songIndex: number) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onToggleSidebar: () => void;
  onDeleteSong: (playlistId: string, songIndex: number) => void;
  onAddSong: (playlistId: string) => void;
  loadingSongIndex: number | null;
}> = ({ playlist, onPlaySong, currentSong, isPlaying, onToggleSidebar, onDeleteSong, onAddSong, loadingSongIndex }) => {
  if (!playlist) {
    return (
      <main className="flex-1 bg-secondary p-8 flex flex-col items-center justify-center text-center">
         <button onClick={onToggleSidebar} className="md:hidden absolute top-4 left-4 z-30 p-2 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
        <div className="animate-slide-up-fade">
          <h1 className="text-4xl font-bold">Welcome to Ytosko's Groove</h1>
          <p className="text-secondary mt-4">Select a playlist or create a new one with AI to get started.</p>
        </div>
      </main>
    );
  }
  
  const mainViewBg = {
      background: `linear-gradient(to bottom, ${playlist.albumArtColors[0] || '#444'}50, var(--color-bg-secondary) 500px)`
  }

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '-:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <main className="flex-1 overflow-y-auto" style={mainViewBg}>
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-6 mb-8 animate-slide-up-fade">
            <button onClick={onToggleSidebar} className="md:hidden absolute top-4 left-4 z-30 p-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
          <AlbumArtGradient colors={playlist.albumArtColors} className="w-32 h-32 md:w-48 md:h-48 rounded-lg shadow-xl object-cover mx-auto md:mx-0 flex-shrink-0" />
          <div className="mt-4 md:mt-0 text-center md:text-left">
            <p className="text-sm font-bold text-primary opacity-80">PLAYLIST</p>
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tighter text-primary">{playlist.playlistName}</h1>
            <p className="text-primary/80 mt-2 text-base">{playlist.playlistDescription}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <button onClick={() => onAddSong(playlist.id)} className="flex items-center gap-3 bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-full transition-all-medium mb-4 active:scale-95 animate-slide-up-fade" style={{animationDelay: '100ms'}}>
            <div className="w-5 h-5">{ICONS.PLUS_CIRCLE}</div>
            Add Songs
          </button>
        
            <div className="hidden md:block animate-slide-up-fade" style={{animationDelay: '200ms'}}>
                <div className="grid grid-cols-[3rem_1fr_1fr_5rem_3rem] gap-x-4 text-tertiary border-b border-primary px-3 pb-2 font-semibold text-sm">
                    <span>#</span>
                    <span>Title</span>
                    <span>Album</span>
                    <span>Duration</span>
                    <span></span>
                </div>
                <div className="mt-2 space-y-1">
                    {playlist.songs.map((song, index) => {
                        const isCurrent = currentSong?.youtubeId != null && currentSong.youtubeId === song.youtubeId;
                        const isLoading = loadingSongIndex === index;
                        return (
                          <div
                            key={`${song.title}-${song.artist}-${index}`}
                            onClick={() => onPlaySong(index)}
                            className="group grid grid-cols-[3rem_1fr_1fr_5rem_3rem] gap-x-4 items-center p-2 rounded-lg transition-all-fast hover:bg-selected cursor-pointer animate-list-item"
                            style={{animationDelay: `${index * 30}ms`}}
                          >
                            <span className={`text-center font-semibold ${isCurrent ? 'text-accent' : 'text-tertiary group-hover:text-secondary'}`}>
                                {isLoading ? <div className="w-4 h-4 mx-auto text-primary">{ICONS.SPINNER}</div> : (isCurrent && isPlaying ? <div className="w-4 h-4 text-accent mx-auto">{ICONS.SOUND_WAVE}</div> : index + 1)}
                            </span>
                            <div className="flex items-center gap-4 min-w-0">
                                {song.albumArtUrl ? (
                                    <img src={song.albumArtUrl} className="w-10 h-10 rounded-md object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-md bg-tertiary flex items-center justify-center flex-shrink-0 text-secondary">
                                        <div className="w-5 h-5">{ICONS.MUSIC_NOTE}</div>
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className={`font-semibold truncate ${isCurrent ? 'text-accent' : 'text-primary'}`}>{song.title}</p>
                                    <p className="text-secondary text-sm truncate">{song.artist}</p>
                                </div>
                            </div>
                            <p className="text-secondary truncate">{song.album}</p>
                            <p className="text-secondary">{formatDuration(song.durationSeconds || 0)}</p>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteSong(playlist.id, index); }} className="text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all-fast active:scale-95">
                                <div className="w-5 h-5">{ICONS.TRASH}</div>
                            </button>
                          </div>
                        )
                    })}
                </div>
            </div>
            
             <div className="md:hidden space-y-2 animate-slide-up-fade" style={{animationDelay: '200ms'}}>
                {playlist.songs.map((song, index) => {
                     const isCurrent = currentSong?.youtubeId != null && currentSong.youtubeId === song.youtubeId;
                     const isLoading = loadingSongIndex === index;
                     return (
                        <div
                            key={`${song.title}-${song.artist}-${index}-mobile`}
                            onClick={() => onPlaySong(index)}
                            className={`p-3 rounded-lg flex items-center space-x-4 transition-all-fast ${isCurrent ? 'bg-selected' : 'hover:bg-hover'}`}
                        >
                            <div className={`w-8 text-center font-semibold ${isCurrent ? 'text-accent' : 'text-tertiary'}`}>
                               {isLoading ? <div className="w-4 h-4 mx-auto text-primary">{ICONS.SPINNER}</div> : (isCurrent && isPlaying ? <div className="w-4 h-4 text-accent mx-auto">{ICONS.SOUND_WAVE}</div> : index + 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                                 <p className={`font-semibold truncate ${isCurrent ? 'text-accent' : 'text-primary'}`}>{song.title}</p>
                                 <p className="text-secondary text-sm truncate">{song.artist}</p>
                            </div>
                             <button onClick={(e) => { e.stopPropagation(); onDeleteSong(playlist.id, index); }} className="text-tertiary hover:text-red-500 transition-opacity p-2 active:scale-95">
                                <div className="w-5 h-5">{ICONS.TRASH}</div>
                            </button>
                        </div>
                     )
                })}
            </div>
        </div>

      </div>
    </main>
  );
};


export const App: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [instructionsModal, setInstructionsModal] = useState<{isOpen: boolean, type: 'gemini' | 'rapidapi' | null}>({isOpen: false, type: null});
  const [addSongModal, setAddSongModal] = useState<{isOpen: boolean, playlistId: string | null}>({isOpen: false, playlistId: null});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [loadingSongIndex, setLoadingSongIndex] = useState<number | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
        try {
            const storedPlaylists = await getPlaylists();
            const sortedPlaylists = storedPlaylists.sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
            setPlaylists(sortedPlaylists);
            if (sortedPlaylists.length > 0) {
              setActivePlaylistId(sortedPlaylists[0].id);
            }
        } catch(e) {
            console.error("Failed to load playlists from storage", e);
        } finally {
            setIsAppLoading(false);
        }
    };
    loadData();
  }, []);

  const activePlaylist = useMemo(() => {
    return playlists.find(p => p.id === activePlaylistId) ?? null;
  }, [playlists, activePlaylistId]);

  const currentSong = useMemo(() => {
    if (activePlaylist && currentSongIndex !== null) {
      return activePlaylist.songs[currentSongIndex];
    }
    return null;
  }, [activePlaylist, currentSongIndex]);

  const handlePlayPause = useCallback(() => {
      if (currentSong) {
          setIsPlaying(prev => !prev);
      }
  }, [currentSong]);

  const handleNext = useCallback(() => {
    if (activePlaylist && currentSongIndex !== null) {
      const isLastSong = currentSongIndex === activePlaylist.songs.length - 1;
      if (isLastSong && repeatMode === 'none') {
        setIsPlaying(false);
        return;
      }
      const nextIndex = (currentSongIndex + 1) % activePlaylist.songs.length;
      handlePlaySong(nextIndex, { forcePlay: true });
    }
  }, [activePlaylist, currentSongIndex, repeatMode]);

  const handlePrevious = () => {
       if (activePlaylist && currentSongIndex !== null) {
          const prevIndex = (currentSongIndex - 1 + activePlaylist.songs.length) % activePlaylist.songs.length;
          handlePlaySong(prevIndex, { forcePlay: true });
      }
  };
  
  const handlePlaySong = useCallback(async (songIndex: number, options?: { forcePlay?: boolean }) => {
    if (!activePlaylist) return;
    
    // If clicking the current song, just toggle play/pause unless forced
    if (currentSongIndex === songIndex && !options?.forcePlay) {
        handlePlayPause();
        return;
    }

    const song = activePlaylist.songs[songIndex];

    // If song details are already fetched, just play
    if (song.youtubeId) {
        setCurrentSongIndex(songIndex);
        setIsPlaying(true);
        return;
    }

    // --- Fetch song details on demand ---
    setLoadingSongIndex(songIndex);
    try {
        const fullSongDetails = await findYouTubeVideo(song.title, song.artist);

        if (fullSongDetails) {
            const updatedSong = { 
                ...song, // Keep original Gemini data (title, artist, album)
                // Only update with data from YouTube
                youtubeId: fullSongDetails.youtubeId,
                durationSeconds: fullSongDetails.durationSeconds,
                albumArtUrl: fullSongDetails.albumArtUrl,
            };
            
            const updatedPlaylists = playlists.map(p => {
                if (p.id === activePlaylistId) {
                    const updatedSongs = [...p.songs];
                    updatedSongs[songIndex] = updatedSong;
                    const updatedPlaylist = { ...p, songs: updatedSongs };
                    savePlaylist(updatedPlaylist); // Persist the fetched details
                    return updatedPlaylist;
                }
                return p;
            });
            
            setPlaylists(updatedPlaylists);
            setCurrentSongIndex(songIndex);
            setIsPlaying(true);
        } else {
            alert(`Could not find a playable version for "${song.title}".`);
            // Optionally remove the unplayable song
            const updatedSongs = activePlaylist.songs.filter((_, i) => i !== songIndex);
            const updatedPlaylist = { ...activePlaylist, songs: updatedSongs };
            setPlaylists(prev => prev.map(p => p.id === activePlaylistId ? updatedPlaylist : p));
            await savePlaylist(updatedPlaylist);
        }
    } catch (error) {
        console.error("Error fetching song details:", error);
        alert("There was an error fetching song details. Please try again.");
    } finally {
        setLoadingSongIndex(null);
    }
  }, [activePlaylist, playlists, currentSongIndex, activePlaylistId, handlePlayPause]);
  
  const handleSelectPlaylist = (id: string) => {
      if (id !== activePlaylistId) {
        setActivePlaylistId(id);
      }
      setIsSidebarOpen(false); // Close sidebar on selection
  };
  
  const handleDeletePlaylist = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this playlist?")) return;

      if (activePlaylistId === id) {
          // If deleting the active playlist, stop music and select next/first
          setCurrentSongIndex(null);
          setIsPlaying(false);
          const currentIndex = playlists.findIndex(p => p.id === id);
          const nextIndex = (currentIndex + 1) % playlists.length;
          if(playlists.length > 1) {
              setActivePlaylistId(playlists[nextIndex === currentIndex ? 0 : nextIndex].id);
          } else {
              setActivePlaylistId(null);
          }
      }
      setPlaylists(prev => prev.filter(p => p.id !== id));
      await dbDeletePlaylist(id);
  }
  
  const handleDeleteSong = async (playlistId: string, songIndex: number) => {
      const playlistToUpdate = playlists.find(p => p.id === playlistId);
      if(!playlistToUpdate) return;
      
      const songToDelete = playlistToUpdate.songs[songIndex];
      const updatedSongs = playlistToUpdate.songs.filter((_, i) => i !== songIndex);
      const updatedPlaylist = { ...playlistToUpdate, songs: updatedSongs };

      // Stop music if the deleted song was playing
      if (currentSong?.youtubeId != null && currentSong.youtubeId === songToDelete.youtubeId) {
          setIsPlaying(false);
          setCurrentSongIndex(null);
      } else if (currentSongIndex != null && songIndex < currentSongIndex) {
          // Adjust index if a song before the current one was deleted
          setCurrentSongIndex(prev => prev ? prev - 1 : null);
      }
      
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
      await savePlaylist(updatedPlaylist);
  }
  
  const handleAddSongsToPlaylist = async (playlistId: string, songsToAdd: Song[]) => {
      const playlistToUpdate = playlists.find(p => p.id === playlistId);
      if(!playlistToUpdate) return;
      
      const newSongs = songsToAdd.filter(newSong => !playlistToUpdate.songs.some(existing => existing.youtubeId === newSong.youtubeId));
      if (newSongs.length === 0) return;

      const updatedPlaylist = { ...playlistToUpdate, songs: [...playlistToUpdate.songs, ...newSongs] };
      
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
      await savePlaylist(updatedPlaylist);
  }

  const handleGeneratePlaylist = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const playlistIdeas = await generatePlaylistIdeas(prompt);

      if (playlistIdeas.songs.length === 0) {
        throw new Error("The AI didn't generate any songs. Please try a different prompt.");
      }
      
      const artColors = await generateAlbumArt(playlistIdeas.playlistName, playlistIdeas.playlistDescription);
      
      const newPlaylist: Playlist = {
        ...playlistIdeas,
        songs: playlistIdeas.songs, // These are partial songs
        id: `playlist-${Date.now()}`,
        albumArtColors: artColors,
      };
      
      await savePlaylist(newPlaylist);
      setPlaylists(prev => [newPlaylist, ...prev]);
      setActivePlaylistId(newPlaylist.id);
      setCurrentSongIndex(null); // Don't autoplay
      setIsPlaying(false);
      setShowGenerator(false);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      alert(`Playlist Generation Failed:\n${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKeys = (geminiKey: string, rapidApiKey: string) => {
    setApiKey('gemini', geminiKey);
    setApiKey('rapidapi', rapidApiKey);
    alert('API keys have been saved. The application will now reload to apply the changes.');
    window.location.reload();
  };

  const handleExportPlaylists = () => {
    if (playlists.length === 0) {
        alert("No playlists to export.");
        return;
    }
    try {
        const jsonString = JSON.stringify(playlists, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ytoskos-groove-playlists-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch(error) {
        console.error("Failed to export playlists:", error);
        alert("An error occurred while trying to export playlists.");
    }
  };
  
  const handleImportPlaylists = async (importedPlaylists: Playlist[]) => {
      const existingPlaylistIds = new Set(playlists.map(p => p.id));
      const newPlaylists = importedPlaylists.filter(p => !existingPlaylistIds.has(p.id));

      if (newPlaylists.length === 0) {
          alert("No new playlists to import. All playlists in the file already exist.");
          return;
      }

      for (const playlist of newPlaylists) {
          await savePlaylist(playlist);
      }
      
      const updatedPlaylists = [...newPlaylists, ...playlists].sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
      setPlaylists(updatedPlaylists);
      
      alert(`Successfully imported ${newPlaylists.length} new playlist(s).`);
  };
  
  const handleEnded = useCallback(() => {
    // Player handles 'repeat one' internally.
    // For 'all' or 'none', we just advance to the next song.
    handleNext();
  }, [handleNext]);
  
  const handleToggleRepeat = () => {
    const modes: RepeatMode[] = ['all', 'one', 'none'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  if (isAppLoading) {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-primary">
            <div className="w-12 h-12 text-primary">{ICONS.SPINNER}</div>
        </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-primary">
      <div className="flex flex-1 overflow-hidden md:pb-[92px] pb-[76px]">
        <Sidebar 
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onSelectPlaylist={handleSelectPlaylist}
            onShowGenerator={() => setShowGenerator(true)}
            onShowSettings={() => setShowSettingsModal(true)}
            onDeletePlaylist={handleDeletePlaylist}
            isOpen={isSidebarOpen}
        />
        <div className="flex-1 flex flex-col relative">
           {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-backdrop z-40" />}
           <MainView 
                playlist={activePlaylist}
                onPlaySong={handlePlaySong}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onToggleSidebar={() => setIsSidebarOpen(p => !p)}
                onDeleteSong={handleDeleteSong}
                onAddSong={(playlistId) => setAddSongModal({isOpen: true, playlistId})}
                loadingSongIndex={loadingSongIndex}
            />
        </div>
      </div>
      <Player 
        song={currentSong} 
        isPlaying={isPlaying}
        repeatMode={repeatMode}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onEnded={handleEnded}
        onPlaybackError={handleNext}
        onToggleRepeat={handleToggleRepeat}
      />
      {showGenerator && (
        <PlaylistGenerator 
          onClose={() => setShowGenerator(false)} 
          onGenerate={handleGeneratePlaylist} 
          isLoading={isGenerating}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
            onClose={() => setShowSettingsModal(false)}
            onSaveApiKeys={handleSaveApiKeys}
            onExportPlaylists={handleExportPlaylists}
            onImportPlaylists={handleImportPlaylists}
            onShowInstructions={(type) => setInstructionsModal({ isOpen: true, type })}
        />
      )}
      {addSongModal.isOpen && addSongModal.playlistId && (
        <AddSongModal
            playlistId={addSongModal.playlistId}
            onAddSongs={handleAddSongsToPlaylist}
            onClose={() => setAddSongModal({isOpen: false, playlistId: null})}
        />
      )}
      {instructionsModal.isOpen && (
        <ApiKeyInstructionsModal
            type={instructionsModal.type!}
            onClose={() => setInstructionsModal({ isOpen: false, type: null })}
        />
      )}
    </div>
  );
};