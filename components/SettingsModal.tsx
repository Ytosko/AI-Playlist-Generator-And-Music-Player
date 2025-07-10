import React, { useState, useEffect, useRef } from 'react';
import type { Playlist } from '../types';
import { getApiKey } from '../services/storageService';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../themes';
import { ICONS } from '../constants';


interface SettingsModalProps {
  onClose: () => void;
  onSaveApiKeys: (geminiKey: string, rapidApiKey: string) => void;
  onExportPlaylists: () => void;
  onImportPlaylists: (playlists: Playlist[]) => void;
  onShowInstructions: (type: 'gemini' | 'rapidapi') => void;
}

const isValidPlaylistArray = (data: any): data is Playlist[] => {
    if (!Array.isArray(data)) return false;
    return data.every(p => 
        typeof p.id === 'string' &&
        typeof p.playlistName === 'string' &&
        Array.isArray(p.songs) &&
        Array.isArray(p.albumArtColors) &&
        p.songs.every((s: any) => typeof s.title === 'string' && typeof s.artist === 'string')
    );
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSaveApiKeys, onExportPlaylists, onImportPlaylists, onShowInstructions }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Load existing keys from storage when the modal opens
    setGeminiKey(getApiKey('gemini') || '');
    setRapidApiKey(getApiKey('rapidapi') || '');
  }, []);

  const handleSave = () => {
    onSaveApiKeys(geminiKey, rapidApiKey);
    onClose();
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                throw new Error("File content is not readable text.");
            }
            const data = JSON.parse(text);

            if (isValidPlaylistArray(data)) {
                onImportPlaylists(data);
                onClose();
            } else {
                throw new Error("Invalid playlist file format. Please export a new file from the app.");
            }
        } catch (error) {
            console.error("Failed to import playlists:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            alert(`Import failed: ${message}`);
        }
    };
    reader.onerror = () => {
        alert("Failed to read the selected file.");
    };
    reader.readAsText(file);

    // Reset the input value to allow re-uploading the same file
    if(event.target) {
        event.target.value = '';
    }
  }

  return (
    <div 
        className="fixed inset-0 bg-backdrop backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" 
        onClick={onClose}
    >
      <div 
        className="bg-secondary rounded-lg p-8 w-full max-w-lg shadow-xl relative border border-primary flex flex-col gap-8 animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-primary transition-all-fast active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-primary">Settings</h2>

         {/* Appearance Settings */}
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary border-b border-primary pb-2">Appearance</h3>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Theme</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {themes.map(t => (
                  <button 
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className="flex flex-col items-center gap-2 p-2 rounded-lg transition-all-fast border-2"
                    style={{
                        borderColor: t.name === theme ? t.colors.preview : 'var(--color-border-primary)',
                        backgroundColor: t.name === theme ? 'var(--color-bg-tertiary)' : 'transparent',
                        transform: t.name === theme ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <div className="w-full h-5 rounded-md" style={{backgroundColor: t.colors.preview}}></div>
                    <span className="text-sm font-semibold text-primary">{t.displayName}</span>
                  </button>
                ))}
              </div>
            </div>
        </div>

        {/* API Key Management */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-primary pb-2">API Keys</h3>
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <label htmlFor="gemini-key" className="block text-sm font-medium text-secondary">Gemini API Key</label>
                    <button onClick={() => onShowInstructions('gemini')} className="text-xs text-accent hover:underline">How to get a key?</button>
                </div>
                <input
                    type="password"
                    id="gemini-key"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Enter your Gemini key to override default"
                    className="w-full bg-tertiary border border-primary rounded-md p-2 text-primary placeholder-secondary focus:outline-none focus:ring-2 ring-offset-2 ring-offset-secondary focus:ring-accent"
                />
            </div>
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <label htmlFor="rapidapi-key" className="block text-sm font-medium text-secondary">RapidAPI Key (for YouTube)</label>
                    <button onClick={() => onShowInstructions('rapidapi')} className="text-xs text-accent hover:underline">How to get a key?</button>
                </div>
                <input
                    type="password"
                    id="rapidapi-key"
                    value={rapidApiKey}
                    onChange={(e) => setRapidApiKey(e.target.value)}
                    placeholder="Enter your RapidAPI key to override default"
                    className="w-full bg-tertiary border border-primary rounded-md p-2 text-primary placeholder-secondary focus:outline-none focus:ring-2 ring-offset-2 ring-offset-secondary focus:ring-accent"
                />
            </div>
             <button
              onClick={handleSave}
              className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-md transition-all-fast active:scale-95"
            >
              Save Keys & Reload
            </button>
        </div>

        {/* Playlist Management */}
        <div className="space-y-4">
             <h3 className="text-lg font-semibold text-primary border-b border-primary pb-2">Playlist Data</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={onExportPlaylists}
                  className="bg-tertiary hover:bg-hover text-primary font-bold py-2 px-4 rounded-md transition-all-fast active:scale-95"
                >
                  Export All Playlists
                </button>
                <button
                  onClick={handleImportClick}
                  className="bg-tertiary hover:bg-hover text-primary font-bold py-2 px-4 rounded-md transition-all-fast active:scale-95"
                >
                  Import Playlists
                </button>
                <input type="file" ref={importFileRef} onChange={handleFileImport} accept=".json" className="hidden"/>
             </div>
        </div>
      </div>
    </div>
  );
};