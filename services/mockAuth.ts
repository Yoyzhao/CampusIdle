import { User } from '../types';

const USERS_KEY = 'campus_idle_users';
const CURRENT_USER_KEY = 'campus_idle_current_user';

// Helper to get users from storage
const getUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// Helper to save users
const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
  login: (username: string, password: string = ''): User | null => {
    const users = getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (username: string, password: string = ''): User => {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
      throw new Error('用户名已存在');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      password: password || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      cart: [],
      likes: [],
      purchaseHistory: []
    };

    users.push(newUser);
    saveUsers(users);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  updateUser: (updatedUser: User) => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      saveUsers(users);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
  }
};