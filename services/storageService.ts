export const getApiKey = (keyName: 'gemini' | 'rapidapi'): string | null => {
    try {
        return localStorage.getItem(`user_${keyName}_api_key`);
    } catch (error) {
        console.error(`Failed to read '${keyName}' key from localStorage`, error);
        return null;
    }
};

export const setApiKey = (keyName: 'gemini' | 'rapidapi', key: string): void => {
    try {
        if (key && key.trim()) {
            localStorage.setItem(`user_${keyName}_api_key`, key.trim());
        } else {
            localStorage.removeItem(`user_${keyName}_api_key`);
        }
    } catch (error) {
        console.error(`Failed to write '${keyName}' key to localStorage`, error);
        alert('Could not save API key. Your browser might be blocking localStorage.');
    }
};
