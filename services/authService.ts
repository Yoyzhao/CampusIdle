
import { api } from './api';
import { User } from '../types';
import { db } from '../db';

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    const user = await api.login(username, password);
    // Create a session in IndexedDB
    await db.sessions.clear(); // Clear any existing sessions
    await db.sessions.add({
      id: `session_${Date.now()}`,
      userId: user.id,
      createdAt: Date.now()
    });
    return user;
  },

  register: async (username: string, password: string): Promise<User> => {
    const user = await api.register(username, password);
    // Create a session in IndexedDB
    await db.sessions.clear(); // Clear any existing sessions
    await db.sessions.add({
      id: `session_${Date.now()}`,
      userId: user.id,
      createdAt: Date.now()
    });
    return user;
  },

  logout: async () => {
    // Remove session from IndexedDB
    await db.sessions.clear();
  },

  getCurrentUser: async (): Promise<User | null> => {
    // Get session from IndexedDB
    const session = await db.sessions.orderBy('createdAt').reverse().first();
    if (!session) return null;
    try {
      return await api.getUser(session.userId);
    } catch (e) {
      console.error("Failed to restore session", e);
      return null;
    }
  },

  updateUser: async (user: User): Promise<void> => {
    await api.updateUser(user);
  }
};
