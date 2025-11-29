
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Initialization
const db = new sqlite3.Database('./campus.db', (err) => {
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
      avatar TEXT,
      cart TEXT,
      likes TEXT
    )`);

    // Items Table
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      price REAL,
      type TEXT,
      category TEXT,
      imageUrl TEXT,
      sellerId TEXT,
      sellerName TEXT,
      createdAt INTEGER,
      likes INTEGER
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
            imageUrl: 'https://picsum.photos/seed/book1/400/300',
            sellerId: 'user_xueba',
            sellerName: '学霸小张',
            createdAt: Date.now(),
            likes: 5
          },
          {
            id: '2',
            title: 'iPad Air 5 64G 紫色',
            category: '数码电子',
            type: '出售',
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
            category: '生活用品',
            type: '以物易物',
            price: 0,
            description: '雅马哈F310，音色很暖。想学滑板了，有没有同学愿意交换？长板优先。',
            imageUrl: 'https://picsum.photos/seed/guitar/400/300',
            sellerId: 'user_art',
            sellerName: '文艺青年',
            createdAt: Date.now(),
            likes: 12
          }
        ];

        const stmt = db.prepare(`INSERT INTO items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        seedItems.forEach(item => {
          stmt.run(
            item.id, item.title, item.description, item.price, item.type, 
            item.category, item.imageUrl, item.sellerId, item.sellerName, 
            item.createdAt, item.likes
          );
        });
        stmt.finalize();
      }
    });
  });
}

// --- API Routes ---

// Get All Items
app.get('/api/items', (req, res) => {
  db.all("SELECT * FROM items ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json(rows);
  });
});

// Add Item
app.post('/api/items', (req, res) => {
  const item = req.body;
  const sql = `INSERT INTO items (id, title, description, price, type, category, imageUrl, sellerId, sellerName, createdAt, likes) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
  const params = [item.id, item.title, item.description, item.price, item.type, item.category, item.imageUrl, item.sellerId, item.sellerName, item.createdAt, item.likes];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json(item);
  });
});

// Update Item (for Likes)
app.put('/api/items/:id', (req, res) => {
  const item = req.body;
  const sql = `UPDATE items SET likes = ? WHERE id = ?`;
  db.run(sql, [item.likes, req.params.id], function(err) {
    if (err) return res.status(400).json({ "error": err.message });
    res.json({ message: "Item updated" });
  });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, id, avatar } = req.body;
  const sql = `INSERT INTO users (id, username, avatar, cart, likes) VALUES (?,?,?,?,?)`;
  const params = [id, username, avatar, JSON.stringify([]), JSON.stringify([])];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(400).json({ "error": "用户名已存在或系统错误" });
      return;
    }
    res.json({ id, username, avatar, cart: [], likes: [] });
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    if (row) {
      // Parse JSON fields
      row.cart = JSON.parse(row.cart);
      row.likes = JSON.parse(row.likes);
      res.json(row);
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
      res.json(row);
    } else {
      res.status(404).json({ "error": "User not found" });
    }
  });
});

// Update User (Cart/Likes)
app.put('/api/users/:id', (req, res) => {
  const { cart, likes } = req.body;
  const sql = `UPDATE users SET cart = ?, likes = ? WHERE id = ?`;
  db.run(sql, [JSON.stringify(cart), JSON.stringify(likes), req.params.id], function(err) {
    if (err) return res.status(400).json({ "error": err.message });
    res.json({ message: "User updated" });
  });
});

app.listen(port, () => {
  console.log(`CampusIdle Backend running at http://localhost:${port}`);
});
