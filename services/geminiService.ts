import { GoogleGenAI, Type } from "@google/genai";
import type { Playlist } from "../types";
import { getApiKey } from './storageService';

const getAiClient = () => {
    const userApiKey = getApiKey('gemini');
    const apiKey = userApiKey || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please add it in the settings or set the API_KEY environment variable.");
    }
    return new GoogleGenAI({ apiKey });
}

const playlistSchema = {
  type: Type.OBJECT,
  properties: {
    playlistName: {
      type: Type.STRING,
      description: "A creative and fitting name for the generated playlist."
    },
    playlistDescription: {
      type: Type.STRING,
      description: "A short, engaging description of the playlist's theme or mood."
    },
    playlistGenre: {
      type: Type.STRING,
      description: "The single, dominant genre for this playlist. Example: 'Pop', '80s Synth-Pop', 'Indie Folk'."
    },
    songs: {
      type: Type.ARRAY,
      description: "A list of 10-15 songs that fit the user's prompt.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The full title of the song." },
          artist: { type: Type.STRING, description: "The name of the primary artist." },
          album: { type: Type.STRING, description: "The album the song belongs to." },
        },
        required: ["title", "artist", "album"],
      },
    },
  },
  required: ["playlistName", "playlistDescription", "playlistGenre", "songs"],
};

export const generatePlaylistIdeas = async (prompt: string): Promise<Omit<Playlist, 'id' | 'albumArtColors' | 'songs'> & { songs: Omit<Playlist['songs'][0], 'youtubeId' | 'durationSeconds'>[] }> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert DJ. Your task is to generate a creative playlist based on a user's prompt. Provide a fitting name, a short description, the overall genre, and a list of 10-15 songs with their title, artist, and album. Do NOT include YouTube links, IDs, or durations.

User's request: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: playlistSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    if (!parsedData.songs || !Array.isArray(parsedData.songs)) {
        throw new Error("The AI model returned a malformed song list.");
    }

    return parsedData;

  } catch (error) {
    console.error("Error generating playlist ideas:", error);
    if (error instanceof Error) {
        if (error.message.includes("JSON")) {
            throw new Error("Failed to generate playlist. The AI returned an invalid format.");
        }
        if (error.message.includes("API key")) {
             throw new Error(error.message);
        }
    }
    throw new Error("Failed to generate playlist ideas. The model may be unavailable or the request was invalid.");
  }
};

const artSchema = {
  type: Type.OBJECT,
  properties: {
    colors: {
      type: Type.ARRAY,
      description: "An array of 2 to 4 CSS-compatible hex color codes.",
      items: {
        type: Type.STRING,
        description: "A hex color code, e.g., '#FF5733'",
      }
    }
  },
  required: ["colors"]
};

export const generateAlbumArt = async (playlistName: string, playlistDescription: string): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const prompt = `Generate a vibrant, visually appealing color palette that represents the mood of this playlist. The palette should consist of 2 to 4 complementary CSS hex color codes. Playlist Name: "${playlistName}". Vibe: "${playlistDescription}".`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: artSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (parsedData.colors && Array.isArray(parsedData.colors) && parsedData.colors.length > 0) {
            return parsedData.colors;
        } else {
            // Fallback in case of unexpected response
            return ['#555555', '#222222'];
        }
    } catch (error) {
        console.error("Error generating album art colors:", error);
        // Provide a default gradient on error to prevent app crash
        return ['#888888', '#333333'];
    }
};