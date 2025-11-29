export enum ItemType {
  SELL = '出售',
  TRADE = '以物易物',
  FREE = '赠送'
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
  avatar: string; // URL
  cart: CartItem[];
  likes: string[]; // Item IDs
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  type: ItemType;
  category: Category;
  imageUrl: string;
  sellerId: string; // Changed: Link to User ID
  sellerName: string; // Display name cache
  createdAt: number;
  likes: number; // Total count
}

export interface CartItem extends Item {
  cartId: string;
}

export interface MarketStat {
  category: string;
  count: number;
  avgPrice: number;
}