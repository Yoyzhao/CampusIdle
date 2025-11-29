
import Dexie, { Table } from 'dexie';
import { User, Item, ItemType, Category } from './types';

class CampusDatabase extends Dexie {
  users!: Table<User>;
  items!: Table<Item>;

  constructor() {
    super('CampusIdleDB');
    this.version(1).stores({
      users: 'id, username',
      items: 'id, type, category, sellerId, createdAt' 
    });
  }
}

export const db = new CampusDatabase();

// Initialize with seed data if empty
db.on('populate', () => {
  db.items.bulkAdd([
    {
      id: '1',
      title: '考研英语红宝书（9成新）',
      category: Category.BOOKS,
      type: ItemType.SELL,
      price: 15,
      description: '刚考完研，书保护得很好，只有前两章有少量笔记。希望能帮到下一届学弟学妹！',
      imageUrl: 'https://picsum.photos/seed/book1/400/300',
      sellerId: 'user_xueba',
      sellerName: '学霸小张',
      createdAt: Date.now(),
      likes: 5
    },
    {
      id: '2',
      title: 'iPad Air 5 64G 紫色',
      category: Category.ELECTRONICS,
      type: ItemType.SELL,
      price: 2800,
      description: '换Pro了所以出。无划痕，电池健康98%。送保护壳和类纸膜。',
      imageUrl: 'https://picsum.photos/seed/ipad/400/300',
      sellerId: 'user_digital',
      sellerName: '数码控',
      createdAt: Date.now(),
      likes: 42
    },
    {
      id: '3',
      title: '吉他一把，求换滑板',
      category: Category.LIFESTYLE,
      type: ItemType.TRADE,
      price: 0,
      description: '雅马哈F310，音色很暖。想学滑板了，有没有同学愿意交换？长板优先。',
      imageUrl: 'https://picsum.photos/seed/guitar/400/300',
      sellerId: 'user_art',
      sellerName: '文艺青年',
      createdAt: Date.now(),
      likes: 12
    }
  ]);
});
