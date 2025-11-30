
import { Item, User } from '../types';

// 动态确定API基础URL，确保局域网其他设备也能正常访问
const getBaseUrl = () => {
  // 获取当前页面的协议和主机名
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  // 使用相同的主机名，但端口固定为3002
  return `${protocol}//${host}:3002/api`;
};

const API_BASE_URL = getBaseUrl();

// The API service now acts as a wrapper around the backend API
export const api = {
  // Always online when using backend API
  isOffline: () => false,

  async getItems(): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/items`);
    if (!response.ok) {
      throw new Error('Failed to fetch items');
    }
    return await response.json();
  },

  async addItem(item: Item): Promise<Item> {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    if (!response.ok) {
      throw new Error('Failed to add item');
    }
    return await response.json();
  },

  async updateItemLikes(id: string, likes: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/items/${id}/likes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ likes })
    });
    if (!response.ok) {
      throw new Error('Failed to update item likes');
    }
  },

  async getItemsBySeller(sellerId: string): Promise<Item[]> {
    const response = await fetch(`${API_BASE_URL}/items/seller/${sellerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch seller items');
    }
    return await response.json();
  },

  async updateItem(item: Item): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/items/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
    if (!response.ok) {
      throw new Error('Failed to update item');
    }
  },

  async updateItemStatus(id: string, status: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/items/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      throw new Error('Failed to update item status');
    }
  },

  async deleteItem(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete item');
    }
  },

  async register(username: string, password: string): Promise<User> {
    const id = Math.random().toString(36).substr(2, 9);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, username, password, avatar })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '注册失败');
    }
    
    return await response.json();
  },

  async login(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '登录失败');
    }
    
    return await response.json();
  },

  async getUser(id: string): Promise<User | null> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to get user');
    }
    return await response.json();
  },

  async updateUser(user: User): Promise<void> {
    const { cart, likes } = user;
    const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cart, likes })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
  },

  // Transaction-related endpoints
  async createTransaction(transaction: {
    itemId: string;
    sellerId: string;
    buyerId: string;
    buyerName: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transaction)
    });
    if (!response.ok) {
      throw new Error('Failed to create transaction');
    }
    return await response.json();
  },

  async getSellerTransactions(sellerId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/transactions/seller/${sellerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch seller transactions');
    }
    return await response.json();
  },

  async getBuyerTransactions(buyerId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/transactions/buyer/${buyerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch buyer transactions');
    }
    return await response.json();
  },

  async confirmTransaction(transactionId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to confirm transaction');
    }
    return await response.json();
  },

  async completeTransaction(transactionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to complete transaction');
    }
  },

  async cancelTransaction(transactionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to cancel transaction');
    }
  },

  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      throw new Error('Failed to delete transaction');
    }
  }
};
