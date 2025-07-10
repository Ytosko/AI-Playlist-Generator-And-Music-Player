import React from 'react';

interface ApiKeyInstructionsModalProps {
  onClose: () => void;
  type: 'gemini' | 'rapidapi';
}

const GeminiInstructions = () => (
  <div>
    <h3 className="text-xl font-bold text-primary mb-3">How to get a Gemini API Key</h3>
    <p className="text-secondary mb-4">
        Follow these steps to get your own free Gemini API key from Google AI Studio.
    </p>
    <ol className="list-decimal list-inside space-y-3 text-secondary">
        <li>
            Go to Google AI Studio: <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">aistudio.google.com</a>
        </li>
        <li>Sign in with your Google Account.</li>
        <li>
            Click on the <code className="bg-tertiary text-primary px-1.5 py-0.5 rounded-md">Get API key</code> button, usually located in the top left corner.
        </li>
        <li>
            Click <code className="bg-tertiary text-primary px-1.5 py-0.5 rounded-md">Create API key in new project</code>.
        </li>
        <li>Your new key will appear. Copy it and paste it into the settings field. Keep this key safe and private.</li>
    </ol>
  </div>
);

const RapidApiInstructions = () => (
    <div>
        <h3 className="text-xl font-bold text-primary mb-3">How to get a RapidAPI Key</h3>
        <p className="text-secondary mb-4">
            Enjoy 500 free song searches per day by creating a free RapidAPI account. Your data remains completely private.
        </p>
        <ol className="list-decimal list-inside space-y-3 text-secondary">
            <li>
                Go to RapidAPI and sign up: <a href="https://rapidapi.com/auth/sign-up" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">rapidapi.com/auth/sign-up</a>.
            </li>
             <li>
                After signing up, go to the YouTube v3 Alternative API page: <a href="https://rapidapi.com/ytdlfree/api/youtube-v3-alternative" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">API Page Link</a>.
            </li>
            <li>
                Click the <code className="bg-tertiary text-primary px-1.5 py-0.5 rounded-md">Subscribe to Test</code> button (No credit card is required).
            </li>
            <li>
                After subscribing, you will be on the API's endpoint page. Look for the code examples on the right.
            </li>
            <li>
                Your key is the long string of text next to <code className="bg-tertiary text-primary px-1.5 py-0.5 rounded-md">x-rapidapi-key</code> in the code snippet.
            </li>
            <li>Copy the key value and paste it into the settings field in this app.</li>
        </ol>
    </div>
);

export const ApiKeyInstructionsModal: React.FC<ApiKeyInstructionsModalProps> = ({ onClose, type }) => {
  return (
    <div 
        className="fixed inset-0 bg-backdrop backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" 
        onClick={onClose}
    >
      <div 
        className="bg-secondary rounded-lg p-8 w-full max-w-2xl shadow-xl relative border border-primary flex flex-col gap-6 animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary hover:text-primary transition-all-fast active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {type === 'gemini' ? <GeminiInstructions /> : <RapidApiInstructions />}

        <button
            onClick={onClose}
            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-md transition-all-fast mt-4 active:scale-95"
        >
            Got it, thanks!
        </button>
      </div>
    </div>
  );
};