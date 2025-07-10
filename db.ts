import { openDB, DBSchema } from 'idb';
import type { Playlist } from './types';

interface YtoskosGrooveDB extends DBSchema {
  playlists: {
    key: string;
    value: Playlist;
    indexes: { 'by-id': string };
  };
}

const dbPromise = openDB<YtoskosGrooveDB>('ytoskos-groove-db', 1, {
  upgrade(db) {
    const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
    playlistStore.createIndex('by-id', 'id');
  },
});

export const getPlaylists = async (): Promise<Playlist[]> => {
  return (await dbPromise).getAll('playlists');
};

export const savePlaylist = async (playlist: Playlist): Promise<void> => {
  await (await dbPromise).put('playlists', playlist);
};

export const deletePlaylist = async (id: string): Promise<void> => {
  await (await dbPromise).delete('playlists', id);
};