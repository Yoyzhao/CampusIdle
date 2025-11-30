
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import sharp from 'sharp';
import rateLimit from 'express-rate-limit';
import cache from 'memory-cache';
import path from 'path';
const app = express();
const port = process.env.PORT || 3002;
const sqlite3Verbose = sqlite3.verbose();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase payload limit to 10MB

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API Response Caching Middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = cache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};

// Database Initialization
const db = new sqlite3Verbose.Database('./campus.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    // Users Table
    // cart and likes are stored as JSON strings
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      avatar TEXT,
      cart TEXT,
      likes TEXT,
      purchaseHistory TEXT
    )`);

    // Items Table
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      price REAL,
      type TEXT,
      category TEXT,
      imageUrls TEXT,
      sellerId TEXT,
      sellerName TEXT,
      createdAt INTEGER,
      likes INTEGER,
      status TEXT DEFAULT '在售'
    )`);

    // Transactions Table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      itemId TEXT,
      sellerId TEXT,
      buyerId TEXT,
      buyerName TEXT,
      status TEXT DEFAULT 'pending',
      transactionCode TEXT,
      createdAt INTEGER,
      confirmedAt INTEGER,
      completedAt INTEGER,
      buyerDeleted BOOLEAN DEFAULT 0,
      sellerDeleted BOOLEAN DEFAULT 0
    )`);

    // Seed Data if Items empty
    db.get("SELECT count(*) as count FROM items", (err, row) => {
      if (row.count === 0) {
        console.log("Seeding initial data...");
        const seedItems = [
          {
            id: '1',
            title: '考研英语红宝书（9成新）',
            category: '书籍资料',
            type: '出售',
            price: 15,
            description: '刚考完研，书保护得很好，只有前两章有少量笔记。希望能帮到下一届学弟学妹！',
            imageUrls: JSON.stringify(['https://picsum.photos/seed/book1/400/300']),
            sellerId: 'user_xueba',
            sellerName: '学霸小张',
            createdAt: Date.now(),
            likes: 5,
            status: '在售'
          },
          {
            id: '2',
            title: 'iPad Air 5 64G 紫色',
            category: '数码电子',
            type: '出售',
            price: 2800,
            description: '换Pro了所以出。无划痕，电池健康98%。送保护壳和类纸膜。',
            imageUrls: JSON.stringify(['https://picsum.photos/seed/ipad/400/300', 'https://picsum.photos/seed/ipad2/400/300']),
            sellerId: 'user_digital',
            sellerName: '数码控',
            createdAt: Date.now(),
            likes: 42,
            status: '在售'
          },
          {
            id: '3',
            title: '吉他一把，求换滑板',
            category: '生活用品',
            type: '以物易物',
            price: 0,
            description: '雅马哈F310，音色很暖。想学滑板了，有没有同学愿意交换？长板优先。',
            imageUrls: JSON.stringify(['https://picsum.photos/seed/guitar/400/300', 'https://picsum.photos/seed/guitar2/400/300', 'https://picsum.photos/seed/guitar3/400/300']),
            sellerId: 'user_art',
            sellerName: '文艺青年',
            createdAt: Date.now(),
            likes: 12,
            status: '在售'
          }
        ];

        const stmt = db.prepare(`INSERT INTO items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        seedItems.forEach(item => {
          stmt.run(
            item.id, item.title, item.description, item.price, item.type, 
            item.category, item.imageUrls, item.sellerId, item.sellerName, 
            item.createdAt, item.likes, item.status
          );
        });
        stmt.finalize();
      }
    });
  });
}

// --- API Routes ---

// Image Compression Helper
const compressImage = async (base64String) => {
  try {
    // Remove base64 prefix
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Compress image
    const compressedBuffer = await sharp(buffer)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Convert back to base64
    return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error compressing image:', error);
    return base64String; // Return original if compression fails
  }
};

// Generate different sizes of images
const generateImageSizes = async (base64String) => {
  try {
    // Remove base64 prefix
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate different sizes
    const sizes = {
      original: base64String,
      large: await sharp(buffer).resize(800, 600, { fit: 'inside' }).jpeg({ quality: 80 }).toBuffer(),
      medium: await sharp(buffer).resize(400, 300, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer(),
      small: await sharp(buffer).resize(200, 150, { fit: 'inside' }).jpeg({ quality: 60 }).toBuffer()
    };
    
    // Convert buffers to base64
    return {
      original: sizes.original,
      large: `data:image/jpeg;base64,${sizes.large.toString('base64')}`,
      medium: `data:image/jpeg;base64,${sizes.medium.toString('base64')}`,
      small: `data:image/jpeg;base64,${sizes.small.toString('base64')}`
    };
  } catch (error) {
    console.error('Error generating image sizes:', error);
    // Fallback to original image if generation fails
    return {
      original: base64String,
      large: base64String,
      medium: base64String,
      small: base64String
    };
  }
};

// Get All Items with Caching
app.get('/api/items', cacheMiddleware(300), (req, res) => {
  // Only return items that are not deleted
  db.all("SELECT * FROM items WHERE status != '已删除' ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    // Parse imageUrls from JSON string to array, handle undefined case
    const items = rows.map(row => ({
      ...row,
      imageUrls: row.imageUrls ? JSON.parse(row.imageUrls) : []
    }));
    res.json(items);
  });
});

// Get Items by Seller
app.get('/api/items/seller/:sellerId', (req, res) => {
  const sellerId = req.params.sellerId;
  // Only return items that are not deleted
  db.all("SELECT * FROM items WHERE sellerId = ? AND status != '已删除' ORDER BY createdAt DESC", [sellerId], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    // Parse imageUrls from JSON string to array, handle undefined case
    const items = rows.map(row => ({
      ...row,
      imageUrls: row.imageUrls ? JSON.parse(row.imageUrls) : []
    }));
    res.json(items);
  });
});

// Add Item with Image Compression
app.post('/api/items', async (req, res) => {
  const item = req.body;
  
  // Generate item ID automatically if not provided
  const itemId = item.id || Math.random().toString(36).substr(2, 9);
  
  // Set default values if not provided
  const createdAt = item.createdAt || Date.now();
  const likes = item.likes || 0;
  const status = item.status || '在售';
  
  // Compress images
  const compressedImageUrls = await Promise.all(
    (item.imageUrls || []).map(async (url) => {
      return await compressImage(url);
    })
  );
  
  const sql = `INSERT INTO items (id, title, description, price, type, category, imageUrls, sellerId, sellerName, createdAt, likes, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
  const params = [itemId, item.title, item.description, item.price, item.type, item.category, JSON.stringify(compressedImageUrls), item.sellerId, item.sellerName, createdAt, likes, status];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error adding item:', err.message);
      res.status(400).json({ "error": err.message });
      return;
    }
    // Clear cache to reflect new item
    cache.clear();
    
    const newItem = {
      ...item,
      id: itemId,
      imageUrls: compressedImageUrls,
      createdAt: createdAt,
      likes: likes,
      status: status
    };
    
    res.json(newItem);
  });
});

// Update Item with Image Compression
app.put('/api/items/:id', async (req, res) => {
  const item = req.body;
  
  // Compress images
  const compressedImageUrls = await Promise.all(
    (item.imageUrls || []).map(async (url) => {
      return await compressImage(url);
    })
  );
  
  const sql = `UPDATE items SET title = ?, description = ?, price = ?, type = ?, category = ?, imageUrls = ?, status = ? WHERE id = ?`;
  const params = [item.title, item.description, item.price, item.type, item.category, JSON.stringify(compressedImageUrls), item.status, req.params.id];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating item:', err.message);
      return res.status(400).json({ "error": err.message });
    }
    // Clear cache to reflect updated item
    cache.clear();
    res.json({ message: "Item updated" });
  });
});

// Update Item Status
app.put('/api/items/:id/status', (req, res) => {
  const { status } = req.body;
  const sql = `UPDATE items SET status = ? WHERE id = ?`;
  db.run(sql, [status, req.params.id], function(err) {
    if (err) {
      console.error('Error updating item status:', err.message);
      return res.status(400).json({ "error": err.message });
    }
    // Clear cache to reflect updated status
    cache.clear();
    res.json({ message: "Item status updated" });
  });
});

// Delete Item
app.delete('/api/items/:id', (req, res) => {
  const sql = `DELETE FROM items WHERE id = ?`;
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      console.error('Error deleting item:', err.message);
      return res.status(400).json({ "error": err.message });
    }
    // Clear cache to reflect deleted item
    cache.clear();
    res.json({ message: "Item deleted" });
  });
});

// Update Item Likes
app.put('/api/items/:id/likes', (req, res) => {
  const { likes } = req.body;
  const sql = `UPDATE items SET likes = ? WHERE id = ?`;
  db.run(sql, [likes, req.params.id], function(err) {
    if (err) {
      console.error('Error updating item likes:', err.message);
      return res.status(400).json({ "error": err.message });
    }
    // Clear cache to reflect updated likes
    cache.clear();
    res.json({ message: "Item likes updated" });
  });
});

// Image Processing Endpoint
app.post('/api/images/process', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ "error": "Image URL is required" });
  }
  
  try {
    // Generate different sizes
    const imageSizes = await generateImageSizes(imageUrl);
    res.json(imageSizes);
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ "error": "Failed to process image" });
  }
});

// --- Transaction Routes ---

// Create Transaction (Request Trade)
app.post('/api/transactions', (req, res) => {
  const { itemId, sellerId, buyerId, buyerName } = req.body;
  const transaction = {
    id: Math.random().toString(36).substr(2, 9),
    itemId,
    sellerId,
    buyerId,
    buyerName,
    status: 'pending',
    createdAt: Date.now()
  };
  
  const sql = `INSERT INTO transactions (id, itemId, sellerId, buyerId, buyerName, status, createdAt) VALUES (?,?,?,?,?,?,?)`;
  const params = [transaction.id, transaction.itemId, transaction.sellerId, transaction.buyerId, transaction.buyerName, transaction.status, transaction.createdAt];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error creating transaction:', err.message);
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json(transaction);
  });
});

// Get Transactions by Seller
app.get('/api/transactions/seller/:sellerId', (req, res) => {
  const sellerId = req.params.sellerId;
  db.all("SELECT * FROM transactions WHERE sellerId = ? AND sellerDeleted = 0 ORDER BY createdAt DESC", [sellerId], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json(rows);
  });
});

// Get Transactions by Buyer
app.get('/api/transactions/buyer/:buyerId', (req, res) => {
  const buyerId = req.params.buyerId;
  db.all("SELECT * FROM transactions WHERE buyerId = ? AND buyerDeleted = 0 ORDER BY createdAt DESC", [buyerId], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json(rows);
  });
});

// Confirm Transaction (Generate Transaction Code)
app.put('/api/transactions/:id/confirm', (req, res) => {
  const transactionId = req.params.id;
  // Generate 6-digit transaction code
  const transactionCode = Math.floor(100000 + Math.random() * 900000).toString();
  const confirmedAt = Date.now();
  
  const sql = `UPDATE transactions SET status = 'confirmed', transactionCode = ?, confirmedAt = ? WHERE id = ?`;
  db.run(sql, [transactionCode, confirmedAt, transactionId], function(err) {
    if (err) {
      console.error('Error confirming transaction:', err.message);
      return res.status(400).json({ "error": err.message });
    }
    
    // Also update item status to '已售出'
    db.run("UPDATE items SET status = '已售出' WHERE id IN (SELECT itemId FROM transactions WHERE id = ?)", [transactionId], function(err) {
      if (err) {
        console.error('Error updating item status:', err.message);
        return res.status(400).json({ "error": err.message });
      }
      // Clear cache to reflect updated item status
      cache.clear();
      
      // Return the full transaction object
      db.get("SELECT * FROM transactions WHERE id = ?", [transactionId], (err, transaction) => {
        if (err) {
          console.error('Error fetching updated transaction:', err.message);
          return res.status(400).json({ "error": err.message });
        }
        res.json(transaction);
      });
    });
  });
});

// Complete Transaction (Buyer confirms receipt)
app.put('/api/transactions/:id/complete', (req, res) => {
  const transactionId = req.params.id;
  const completedAt = Date.now();
  
  const sql = `UPDATE transactions SET status = 'completed', completedAt = ? WHERE id = ?`;
  db.run(sql, [completedAt, transactionId], function(err) {
    if (err) {
      console.error('Error completing transaction:', err.message);
      return res.status(400).json({ "error": err.message });
    }
    
    // Return the full transaction object
    db.get("SELECT * FROM transactions WHERE id = ?", [transactionId], (err, transaction) => {
      if (err) {
        console.error('Error fetching updated transaction:', err.message);
        return res.status(400).json({ "error": err.message });
      }
      res.json(transaction);
    });
  });
});

// Cancel Transaction
app.put('/api/transactions/:id/cancel', (req, res) => {
  const transactionId = req.params.id;
  
  const sql = `UPDATE transactions SET status = 'cancelled' WHERE id = ?`;
  db.run(sql, [transactionId], function(err) {
    if (err) {
      console.error('Error cancelling transaction:', err.message);
      return res.status(400).json({ "error": err.message });
    }
    
    // Return the full transaction object
    db.get("SELECT * FROM transactions WHERE id = ?", [transactionId], (err, transaction) => {
      if (err) {
        console.error('Error fetching updated transaction:', err.message);
        return res.status(400).json({ "error": err.message });
      }
      res.json(transaction);
    });
  });
});

// Delete Transaction
app.delete('/api/transactions/:id', (req, res) => {
  const transactionId = req.params.id;
  // Support both request body and query parameter for userId for better compatibility
  const userId = (req.body && req.body.userId) || req.query.userId;
  
  console.log('Delete transaction request received:', {
    transactionId,
    userIdFromBody: req.body?.userId,
    userIdFromQuery: req.query.userId,
    finalUserId: userId
  });
  
  if (!userId) {
    return res.status(400).json({ "error": "用户ID不能为空" });
  }
  
  // First, check if the transaction exists and get its sellerId and buyerId
  db.get("SELECT sellerId, buyerId FROM transactions WHERE id = ?", [transactionId], (err, transaction) => {
    if (err) {
      console.error('Error fetching transaction:', err.message);
      return res.status(400).json({ "error": err.message });
    }
    
    if (!transaction) {
      console.warn('No transaction found with id:', transactionId);
      return res.status(404).json({ "error": "交易记录不存在" });
    }
    
    let sql, params;
    
    // Determine if the user is the buyer or seller, and update the corresponding deletion flag
    if (userId === transaction.buyerId) {
      sql = `UPDATE transactions SET buyerDeleted = 1 WHERE id = ?`;
      params = [transactionId];
      console.log('Marking transaction as deleted for buyer, id:', transactionId, 'buyerId:', userId);
    } else if (userId === transaction.sellerId) {
      sql = `UPDATE transactions SET sellerDeleted = 1 WHERE id = ?`;
      params = [transactionId];
      console.log('Marking transaction as deleted for seller, id:', transactionId, 'sellerId:', userId);
    } else {
      return res.status(403).json({ "error": "无权删除此交易记录" });
    }
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error updating transaction deletion status:', err.message);
        return res.status(400).json({ "error": err.message });
      }
      
      // Check if any row was actually updated
      if (this.changes === 0) {
        console.warn('No transaction found with id:', transactionId);
        return res.status(404).json({ "error": "交易记录不存在" });
      }
      
      console.log('Transaction deletion status updated successfully, id:', transactionId, 'changes:', this.changes);
      res.json({ message: "交易记录已删除", changes: this.changes });
    });
  });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, id, avatar } = req.body;
  const sql = `INSERT INTO users (id, username, password, avatar, cart, likes, purchaseHistory) VALUES (?,?,?,?,?,?,?)`;
  const params = [id, username, password, avatar, JSON.stringify([]), JSON.stringify([]), JSON.stringify([])];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(400).json({ "error": "用户名已存在或系统错误" });
      return;
    }
    res.json({ id, username, avatar, cart: [], likes: [], purchaseHistory: [] });
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    if (row) {
      // Check password
      if (row.password !== password) {
        res.status(401).json({ "error": "密码错误" });
        return;
      }
      // Parse JSON fields
      row.cart = JSON.parse(row.cart);
      row.likes = JSON.parse(row.likes);
      row.purchaseHistory = JSON.parse(row.purchaseHistory || '[]');
      // Don't return password to client
      const { password: _, ...userWithoutPassword } = row;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ "error": "用户不存在" });
    }
  });
});

// Get User by ID (Session Resume)
app.get('/api/users/:id', (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(400).json({ "error": err.message });
    if (row) {
      row.cart = JSON.parse(row.cart);
      row.likes = JSON.parse(row.likes);
      row.purchaseHistory = JSON.parse(row.purchaseHistory || '[]');
      res.json(row);
    } else {
      res.status(404).json({ "error": "User not found" });
    }
  });
});

// Update User (Cart/Likes/PurchaseHistory)
app.put('/api/users/:id', (req, res) => {
  const { cart, likes, purchaseHistory } = req.body;
  const sql = `UPDATE users SET cart = ?, likes = ?, purchaseHistory = ? WHERE id = ?`;
  db.run(sql, [JSON.stringify(cart), JSON.stringify(likes), JSON.stringify(purchaseHistory || []), req.params.id], function(err) {
    if (err) return res.status(400).json({ "error": err.message });
    res.json({ message: "User updated" });
  });
});

// 提供静态文件服务
app.use(express.static('dist'));

// 处理所有其他路由，返回index.html（用于SPA应用）
app.use((req, res, next) => {
  // 检查请求的路径是否以/api开头，如果是，则继续处理API请求
  if (req.path.startsWith('/api')) {
    next();
  } else {
    // 否则返回index.html，让前端路由处理
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(port, () => {
  console.log(`CampusIdle Backend running at http://localhost:${port}`);
});
