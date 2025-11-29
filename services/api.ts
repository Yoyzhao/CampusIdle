
import { Item, User } from '../types';
import { db } from '../db';

// The API service now acts as a wrapper around the local IndexedDB
// allowing the rest of the app to function as if it were talking to a service.

export const api = {
  // Always online in local mode
  isOffline: () => false,

  async getItems(): Promise<Item[]> {
    return await db.items.orderBy('createdAt').reverse().toArray();
  },

  async addItem(item: Item): Promise<Item> {
    await db.items.add(item);
    return item;
  },

  async updateItemLikes(id: string, likes: number): Promise<void> {
    await db.items.update(id, { likes });
  },

  async register(username: string): Promise<User> {
    // Check if username exists
    const existing = await db.users.where('username').equals(username).first();
    if (existing) {
      throw new Error('用户名已存在');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      cart: [],
      likes: []
    };

    await db.users.add(newUser);
    return newUser;
  },

  async login(username: string): Promise<User> {
    const user = await db.users.where('username').equals(username).first();
    if (!user) {
      throw new Error('用户不存在，请先注册');
    }
    return user;
  },

  async getUser(id: string): Promise<User | null> {
    const user = await db.users.get(id);
    return user || null;
  },

  async updateUser(user: User): Promise<void> {
    await db.users.put(user);
  }
};
