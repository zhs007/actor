# 部署指南

## 本地开发

### 1. 快速启动
```bash
# 使用快速启动脚本
./setup.sh

# 或者手动安装和启动
npm run install-all
npm run dev
```

### 2. 配置 Gemini API Key
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API Key
3. 复制 `backend/.env.example` 到 `backend/.env`
4. 在 `.env` 文件中设置 `GEMINI_API_KEY=your_api_key_here`

## 生产环境部署

### 方案一: 传统服务器部署

#### 后端部署
```bash
# 1. 上传代码到服务器
scp -r backend/ user@server:/path/to/app/

# 2. 安装依赖
cd /path/to/app/backend
npm install --production

# 3. 设置环境变量
export NODE_ENV=production
export PORT=3001
export GEMINI_API_KEY=your_api_key
export CORS_ORIGIN=https://yourdomain.com

# 4. 使用 PM2 启动服务
npm install -g pm2
pm2 start server.js --name "actor-backend"
pm2 save
pm2 startup
```

#### 前端部署
```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 部署到 Nginx
sudo cp -r dist/* /var/www/html/

# 3. 配置 Nginx
# /etc/nginx/sites-available/actor-chat
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 方案二: Docker 部署

#### 创建 Dockerfile (后端)
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

#### 创建 Dockerfile (前端)
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - CORS_ORIGIN=http://localhost:3000
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 方案三: Vercel + Railway 部署

#### 后端部署到 Railway
1. 连接 GitHub 仓库到 Railway
2. 设置环境变量:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend-domain.vercel.app`
3. Railway 会自动部署后端服务

#### 前端部署到 Vercel
1. 连接 GitHub 仓库到 Vercel
2. 设置构建配置:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
3. 修改前端 API 地址指向 Railway 后端

## 环境变量配置

### 开发环境 (.env)
```bash
NODE_ENV=development
PORT=3001
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGIN=http://localhost:3000
```

### 生产环境
```bash
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGIN=https://yourdomain.com
```

## 性能优化

### 1. 后端优化
- 启用 gzip 压缩
- 配置缓存策略
- 使用 CDN 分发静态资源
- 配置负载均衡

### 2. 前端优化
- 代码分割和懒加载
- 图片优化和压缩
- 启用浏览器缓存
- 使用 Service Worker

## 监控和日志

### 1. 后端监控
```bash
# 使用 PM2 监控
pm2 monit

# 查看日志
pm2 logs actor-backend
```

### 2. 错误追踪
建议集成错误追踪服务如 Sentry:
```javascript
// 在 server.js 中添加
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "YOUR_SENTRY_DSN" });
```

## 安全配置

### 1. HTTPS 配置
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... 其他配置
}
```

### 2. 防火墙设置
```bash
# 只开放必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## 故障排除

### 常见问题
1. **API Key 无效**: 检查 Gemini API Key 是否正确
2. **CORS 错误**: 确保后端 CORS_ORIGIN 配置正确
3. **端口冲突**: 检查端口是否被其他程序占用
4. **内存不足**: 增加服务器内存或优化代码

## 依赖管理架构详解

### 为什么使用三层 package.json 结构？

这种架构设计有以下几个关键优势：

#### 1. **依赖隔离和安全性**
```
根目录/package.json    → 开发工具 (concurrently)
backend/package.json   → 生产依赖 (express, gemini-ai)
frontend/package.json  → 构建工具 (vite)
```

**好处**:
- 后端服务器不会安装前端构建工具
- 前端构建环境不会包含服务器运行时
- 减少安全攻击面和依赖冲突

#### 2. **独立版本管理**
```bash
# 前端可以使用最新的构建工具
cd frontend && npm update

# 后端保持稳定的生产依赖
cd backend && npm install --production
```

#### 3. **微服务架构准备**
这种结构为将来拆分为微服务做好了准备：
```
actor-chat/
├── user-service/package.json
├── chat-service/package.json  
├── ai-service/package.json
└── web-client/package.json
```

#### 4. **CI/CD 优化**
不同的服务可以有独立的构建和部署流程：
```yaml
# GitHub Actions 示例
- name: Build Frontend
  run: cd frontend && npm ci && npm run build
  
- name: Deploy Backend
  run: cd backend && npm ci --production
```

#### 5. **Bundle Size 优化**
```bash
# 前端打包时只包含必要的依赖
cd frontend && npm run build  # 只打包前端代码

# 后端部署时不包含构建工具
cd backend && npm install --production  # 不安装 vite 等
```
