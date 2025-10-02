import { openDB } from 'idb';

const DB_NAME = 'PublishingPlatform';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('articles')) {
        db.createObjectStore('articles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
    }
  });
};

export const cacheArticles = async (articles) => {
  const db = await initDB();
  const tx = db.transaction('articles', 'readwrite');
  await Promise.all(articles.map(article => tx.store.put(article)));
  await tx.done;
};

export const getCachedArticles = async () => {
  const db = await initDB();
  return db.getAll('articles');
};

export const cacheBookmarks = async (bookmarks) => {
  const db = await initDB();
  const tx = db.transaction('bookmarks', 'readwrite');
  await Promise.all(bookmarks.map(bookmark => tx.store.put(bookmark)));
  await tx.done;
};

export const getCachedBookmarks = async () => {
  const db = await initDB();
  return db.getAll('bookmarks');
};

export const cacheProfile = async (profile) => {
  const db = await initDB();
  await db.put('profile', profile);
};

export const getCachedProfile = async () => {
  const db = await initDB();
  const profiles = await db.getAll('profile');
  return profiles[0] || null;
};

export const clearCache = async () => {
  const db = await initDB();
  await db.clear('articles');
  await db.clear('bookmarks');
  await db.clear('profile');
};