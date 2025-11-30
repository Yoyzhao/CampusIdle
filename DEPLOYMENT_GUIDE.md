# CampusIdle项目部署指南

## 项目概述

CampusIdle是一个校园闲置物品交易平台，基于React + TypeScript + Express + SQLite开发。该项目包括前端和后端两部分，支持用户注册、登录、发布闲置物品、浏览商品、进行交易等功能。

## 部署环境准备

### 1. 服务器要求

- **操作系统**：Ubuntu 20.04 LTS 或更高版本
- **CPU**：至少 1 核
- **内存**：至少 1 GB
- **存储空间**：至少 10 GB
- **网络**：需要开放 3000 和 3002 端口

### 2. 安装必要的软件包

```bash
# 更新系统软件包
sudo apt update && sudo apt upgrade -y

# 安装Node.js和npm（使用NodeSource仓库）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装构建工具
sudo apt install -y build-essential

# 安装Git
sudo apt install -y git

# 安装PM2（用于管理Node.js进程）
sudo npm install -g pm2
```

## 项目部署步骤

### 1. 克隆项目代码

```bash
# 进入项目目录
cd /var/www

# 克隆项目代码
git clone https://github.com/yourusername/campusidle.git

# 进入项目目录
cd campusidle
```

### 2. 安装依赖

```bash
# 安装前端和后端依赖
npm install
```

### 2. 配置环境变量

创建一个`.env`文件，用于配置环境变量：

```bash
# 创建.env文件
touch .env

# 编辑.env文件
nano .env
```

在`.env`文件中添加以下内容：

```env
# 服务器配置
PORT=3002

# 前端API基础URL
API_BASE_URL=http://your-server-ip:3002/api

# 用于JWT签名的密钥（可选，如果需要添加JWT认证）
# SECRET_KEY=your-secret-key-here
```

### 3. 更新API基础URL

修改前端API配置，确保指向正确的后端地址：

```bash
# 编辑API配置文件
nano services/api.ts
```

将`API_BASE_URL`的值修改为你的服务器IP或域名：

```typescript
const API_BASE_URL = 'http://your-server-ip:3002/api';
```

### 4. 构建前端项目

```bash
# 构建前端项目
npm run build
```

### 启动后端服务

```bash
# 启动后端服务（开发环境）
npm run dev

# 启动后端服务（生产环境）
node server.js

# 或者使用PM2（推荐，用于生产环境）
pm2 start server.js --name campusidle-backend

# 设置PM2开机自启
pm2 startup
pm2 save
```



### 8. 配置Nginx反向代理（可选，但推荐）

为了更好的性能和安全性，建议配置Nginx作为反向代理。

```bash
# 安装Nginx
sudo apt install -y nginx

# 创建Nginx配置文件
sudo nano /etc/nginx/sites-available/campusidle
```

在配置文件中添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 或者你的服务器IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/campusidle /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 数据库管理

### SQLite数据库

项目使用SQLite数据库，数据库文件位于项目根目录下的`campus.db`。

#### 备份数据库

```bash
# 创建数据库备份
cp campus.db campus.db.backup
```

#### 恢复数据库

```bash
# 恢复数据库备份
cp campus.db.backup campus.db
```

## 常见问题排查

### 1. 服务无法启动

- 检查端口是否被占用：
  ```bash
  sudo lsof -i :3002
  ```

- 检查PM2日志：
  ```bash
  pm2 logs campusidle-backend
  ```

### 2. 前端无法访问后端API

- 检查防火墙设置，确保3002端口已开放：
  ```bash
  sudo ufw status
  sudo ufw allow 3002
  ```

- 检查API_BASE_URL配置是否正确

### 3. 数据库连接问题

- 确保SQLite数据库文件有正确的权限：
  ```bash
  chmod 644 campus.db
  ```

## 维护与更新

### 更新项目代码

```bash
# 进入项目目录
cd /var/www/campusidle

# 拉取最新代码
git pull

# 安装新依赖
npm install

# 构建前端项目
npm run build

# 重启服务
pm2 restart campusidle-backend
```

### 监控服务状态

```bash
# 查看PM2进程状态
pm2 status

# 查看详细日志
pm2 logs campusidle-backend
```

## 安全建议

1. 使用HTTPS（可以通过Let's Encrypt获取免费SSL证书）
2. 定期备份数据库
3. 定期更新项目依赖以修复安全漏洞：
   ```bash
   npm audit fix
   ```
4. 考虑添加速率限制以防止DoS攻击（项目已内置基本的速率限制）
5. 避免在代码中硬编码敏感信息

## 联系方式

如果在部署过程中遇到问题，请联系项目维护者。

---

**注意**：本部署指南假设你使用的是Ubuntu服务器，并且具有基本的Linux命令行操作经验。如果使用其他操作系统，可能需要调整部分命令。