export interface Song {
  title: string;
  artist: string;
  album: string;
  durationSeconds?: number;
  youtubeId?: string;
  albumArtUrl?: string;
}

export interface Playlist {
  id: string;
  playlistName: string;
  playlistDescription: string;
  playlistGenre: string;
  songs: Song[];
  albumArtColors: string[];
}

export type RepeatMode = 'none' | 'all' | 'one';