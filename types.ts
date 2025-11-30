export enum ItemType {
  SELL = '出售',
  TRADE = '以物易物',
  FREE = '赠送'
}

export enum ItemStatus {
  ACTIVE = '在售',
  SOLD = '已售出',
  OFFLINE = '已下架',
  DELETED = '已删除'
}

export enum Category {
  BOOKS = '书籍资料',
  ELECTRONICS = '数码电子',
  LIFESTYLE = '生活用品',
  CLOTHING = '衣物服饰',
  OTHER = '其他'
}

export interface User {
  id: string;
  username: string;
  password: string; // 添加密码字段
  avatar: string; // URL
  cart: CartItem[];
  likes: string[]; // Item IDs
  purchaseHistory: CartItem[]; // 添加购买历史
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  type: ItemType;
  category: Category;
  imageUrls: string[]; // Changed: Support multiple images
  sellerId: string; // Changed: Link to User ID
  sellerName: string; // Display name cache
  createdAt: number;
  likes: number; // Total count
  status: ItemStatus; // Added: Item status
}

export interface CartItem extends Item {
  cartId: string;
}

export interface MarketStat {
  category: string;
  count: number;
  avgPrice: number;
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Transaction {
  id: string;
  itemId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  status: TransactionStatus;
  transactionCode?: string;
  createdAt: number;
  confirmedAt?: number;
  completedAt?: number;
}