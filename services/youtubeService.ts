import type { Song } from '../types';
import { getApiKey } from './storageService';

// Fallback key. User-provided key from settings will be used if available.
const DEFAULT_RAPIDAPI_KEY = '<RAPIDAPI_KEY>';
const RAPIDAPI_HOST = 'youtube-v3-alternative.p.rapidapi.com';
const API_ENDPOINT = `https://youtube-v3-alternative.p.rapidapi.com/search`;

const getRapidApiKey = (): string => {
    return getApiKey('rapidapi') || DEFAULT_RAPIDAPI_KEY;
}

const parseDurationText = (lengthText: string): number => {
    if (!lengthText) return 0;
    const parts = lengthText.split(':').reverse().map(part => parseInt(part, 10));
    if (parts.some(isNaN)) return 0;
    
    let seconds = 0;
    for (let i = 0; i < parts.length; i++) {
        // accounts for HH:MM:SS, MM:SS, and SS formats
        seconds += parts[i] * Math.pow(60, i);
    }
    return seconds;
};


const executeSearch = async (query: string, maxResults: number): Promise<Song[]> => {
    const url = `${API_ENDPOINT}?query=${encodeURIComponent(query)}&geo=US&lang=en`;
    const rapidApiKey = getRapidApiKey();

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 throw new Error(`YouTube API (RapidAPI) request failed. The key is likely invalid or has been blocked. Please check your key in the settings.`);
            }
            const errorBody = await response.text();
            console.error(`YouTube API (RapidAPI) failed with status ${response.status}`, errorBody);
            throw new Error(`Failed to fetch data from YouTube. Status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            console.warn(`No results found for query: "${query}"`);
            return [];
        }
        
        const songs: Song[] = data.data
            .filter((item: any) => item.type === 'video' && item.videoId && item.lengthText)
            .map((item: any) => ({
                youtubeId: item.videoId,
                title: item.title,
                artist: item.channelTitle || 'Unknown Artist',
                album: item.channelTitle || 'Unknown Album', // Using channel as a stand-in for album
                albumArtUrl: item.thumbnail?.find((t: any) => t.width >= 360)?.url || item.thumbnail?.[0]?.url || '',
                durationSeconds: parseDurationText(item.lengthText),
            }));
            
        return songs.slice(0, maxResults);

    } catch (error) {
        console.error(`Error during YouTube search for query "${query}":`, error);
        if (error instanceof Error) {
            alert(error.message);
        } else {
            alert('Could not search for songs. The API might be down.');
        }
        return [];
    }
};

export const findYouTubeVideo = async (
    title: string, 
    artist: string
): Promise<Song | null> => {
    const searchQuery = `${artist} - ${title} official audio`;
    const results = await executeSearch(searchQuery, 1);
    if (results.length === 0) {
        console.warn(`No embeddable YouTube video found for: "${title}" by ${artist}`);
    }
    return results[0] || null;
};

export const searchYouTube = async (query: string): Promise<Song[]> => {
    // Fetch more results for the manual search modal to give users more options.
    return await executeSearch(query, 15);
};