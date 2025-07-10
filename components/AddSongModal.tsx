import React, { useState } from 'react';
import { ICONS } from '../constants';
import { searchYouTube } from '../services/youtubeService';
import type { Song } from '../types';

interface AddSongModalProps {
  playlistId: string;
  onAddSongs: (playlistId: string, songs: Song[]) => void;
  onClose: () => void;
}

export const AddSongModal: React.FC<AddSongModalProps> = ({ playlistId, onAddSongs, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setResults([]);
    try {
      const searchResults = await searchYouTube(query);
      if(searchResults.length === 0) {
        setError("No results found. Try a different search.");
      }
      setResults(searchResults);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSongSelection = (song: Song) => {
    setSelectedSongs(prev => {
        const isSelected = prev.some(s => s.youtubeId === song.youtubeId);
        if (isSelected) {
            return prev.filter(s => s.youtubeId !== song.youtubeId);
        } else {
            return [...prev, song];
        }
    });
  }
  
  const handleAddClick = () => {
    if (selectedSongs.length > 0) {
        onAddSongs(playlistId, selectedSongs);
        onClose();
    }
  }
  
  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div 
        className="fixed inset-0 bg-backdrop backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" 
        onClick={onClose}
    >
      <div 
        className="bg-secondary rounded-lg p-6 w-full max-w-2xl h-[80vh] shadow-xl relative border border-primary flex flex-col animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-primary transition-all-fast active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-4 text-primary">Add Songs</h2>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for songs on YouTube..."
                className="flex-grow bg-tertiary border border-primary rounded-md p-3 text-primary placeholder-secondary focus:outline-none focus:ring-2 ring-offset-2 ring-offset-secondary focus:ring-accent transition-all-fast"
                disabled={isLoading}
            />
            <button type="submit" className="bg-accent hover:bg-accent-hover text-white font-bold p-3 rounded-md flex items-center justify-center transition-all-fast disabled:bg-accent-disabled active:scale-95" disabled={isLoading}>
                <div className="w-6 h-6">{isLoading ? ICONS.SPINNER : ICONS.SEARCH}</div>
            </button>
        </form>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            {results.length > 0 && (
                <ul className="space-y-2">
                    {results.map((song, index) => {
                        const isSelected = selectedSongs.some(s => s.youtubeId === song.youtubeId);
                        return (
                            <li 
                                key={song.youtubeId}
                                onClick={() => toggleSongSelection(song)}
                                className={`flex items-center space-x-4 p-2 rounded-md cursor-pointer transition-all-fast animate-list-item ${isSelected ? 'bg-accent-selected-bg ring-2 ring-accent' : 'hover:bg-hover'}`}
                                style={{ animationDelay: `${index * 20}ms`}}
                            >
                                <img src={song.albumArtUrl} alt={song.title} className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold truncate text-primary">{song.title}</p>
                                    <p className="text-sm text-secondary truncate">{song.artist}</p>
                                </div>
                                <span className="text-secondary text-sm">{formatDuration(song.durationSeconds)}</span>
                                <div className={`w-6 h-6 flex-shrink-0 rounded-full border-2 transition-all-fast ${isSelected ? 'bg-accent border-accent' : 'border-primary group-hover:border-secondary'}`}>
                                    {isSelected && <div className="text-white w-full h-full p-0.5">{ICONS.CHECK}</div>}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>

        <div className="mt-4 pt-4 border-t border-primary">
            <button
              onClick={handleAddClick}
              className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-all-medium disabled:bg-tertiary disabled:text-secondary disabled:cursor-not-allowed active:scale-95"
              disabled={selectedSongs.length === 0}
            >
              Add {selectedSongs.length > 0 ? `${selectedSongs.length} Song${selectedSongs.length > 1 ? 's' : ''}` : 'Songs'}
            </button>
        </div>

      </div>
    </div>
  );
};