
import { api } from './api';
import { User } from '../types';

const SESSION_KEY = 'campus_idle_session_id';

export const authService = {
  login: async (username: string): Promise<User> => {
    const user = await api.login(username);
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },

  register: async (username: string): Promise<User> => {
    const user = await api.register(username);
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const userId = localStorage.getItem(SESSION_KEY);
    if (!userId) return null;
    try {
      return await api.getUser(userId);
    } catch (e) {
      console.error("Failed to restore session", e);
      return null;
    }
  },

  updateUser: async (user: User): Promise<void> => {
    await api.updateUser(user);
  }
};
