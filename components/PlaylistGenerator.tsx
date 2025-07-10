import React, { useState } from 'react';
import { ICONS } from '../constants';

interface PlaylistGeneratorProps {
  onGenerate: (prompt: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const PlaylistGenerator: React.FC<PlaylistGeneratorProps> = ({ onGenerate, onClose, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');

  const examples = [
    "80s synth-pop for a night drive",
    "Acoustic coffeehouse vibes",
    "High-energy workout anthems",
    "Rainy day introspective indie folk"
  ];

  const handleGenerateClick = () => {
    if (!prompt.trim()) {
        setError('Please enter a description for your playlist.');
        return;
    }
    setError('');
    onGenerate(prompt);
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <div 
        className="fixed inset-0 bg-backdrop backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" 
        onClick={onClose}
    >
      <div 
        className="bg-secondary rounded-lg p-8 w-full max-w-lg shadow-xl relative border border-primary animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-primary transition-all-fast active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-2 text-primary">Create with AI</h2>
        <p className="text-secondary mb-6">Describe the vibe, genre, or occasion, and let Gemini build the perfect playlist for you.</p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Sad songs for a rainy day..."
          className="w-full bg-tertiary border border-primary rounded-md p-3 text-primary placeholder-secondary focus:outline-none focus:ring-2 ring-offset-2 ring-offset-secondary focus:ring-accent transition-all-fast"
          rows={3}
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        <div className="mt-4 mb-6">
            <p className="text-secondary text-sm mb-2">Or try an example:</p>
            <div className="flex flex-wrap gap-2">
                {examples.map(ex => (
                    <button 
                        key={ex} 
                        onClick={() => handleExampleClick(ex)}
                        className="text-sm bg-tertiary hover:bg-hover text-secondary px-3 py-1 rounded-full transition-all-fast disabled:opacity-50 active:scale-95"
                        disabled={isLoading}
                    >
                        {ex}
                    </button>
                ))}
            </div>
        </div>

        <button
          onClick={handleGenerateClick}
          className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-all-medium disabled:bg-accent-disabled disabled:cursor-not-allowed active:scale-95"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-6 h-6 text-white">{ICONS.SPINNER}</div>
          ) : (
            'Generate Playlist'
          )}
        </button>
      </div>
    </div>
  );
};