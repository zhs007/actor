# 项目架构说明

## 多层级 package.json 架构

### 架构概览
```
actor/
├── package.json              # 🎯 根项目管理
│   └── concurrently          # 同时运行前后端
├── backend/
│   ├── package.json          # 🔧 后端服务依赖
│   │   ├── express           # Web 框架
│   │   ├── @google/generative-ai  # Gemini AI
│   │   ├── cors, helmet      # 安全中间件
│   │   └── nodemon           # 开发工具
│   └── server.js
└── frontend/
    ├── package.json          # 🎨 前端构建依赖
    │   └── vite              # 构建工具
    ├── index.html
    ├── script.js
    └── style.css
```

## 依赖分离的优势

### 1. 生产环境部署优化

#### 传统单体架构问题：
```json
// ❌ 所有依赖混在一起
{
  "dependencies": {
    "express": "^4.18.2",
    "vite": "^5.0.0",           // 前端工具
    "@google/generative-ai": "^0.3.1",
    "concurrently": "^8.2.2"    // 开发工具
  }
}
```

**问题**：
- 生产环境安装了不必要的前端构建工具
- 服务器包含开发时依赖
- 安全风险增加
- Docker 镜像臃肿

#### 我们的分离架构：
```bash
# 🚀 后端部署 - 只安装必要依赖
cd backend
npm install --production
# 只安装: express, @google/generative-ai, cors, helmet

# 🏗️ 前端构建 - 在 CI/CD 中构建
cd frontend  
npm install && npm run build
# 构建后只需要静态文件，不需要 node_modules
```

### 2. 开发体验优化

#### 统一的开发命令：
```bash
# 在根目录执行
npm run dev          # 同时启动前后端
npm run dev:backend  # 只启动后端
npm run dev:frontend # 只启动前端
npm run build        # 构建前端
```

#### 独立的开发环境：
```bash
# 后端开发者只需要关心后端
cd backend
npm install
npm run dev

# 前端开发者只需要关心前端  
cd frontend
npm install
npm run dev
```

### 3. 版本管理和更新

#### 独立更新策略：
```bash
# 更新前端构建工具（不影响后端）
cd frontend
npm update vite

# 更新后端框架（不影响前端）
cd backend  
npm update express

# 更新开发工具（不影响生产）
npm update concurrently
```

#### 依赖冲突避免：
- 前端的 TypeScript 版本不会影响后端
- 后端的 Node.js 版本要求不会限制前端工具
- 开发工具更新不会破坏生产环境

## 实际使用场景

### 场景 1: Docker 部署

#### 后端 Dockerfile：
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production    # 只安装生产依赖
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### 前端 Dockerfile：
```dockerfile  
# frontend/Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                 # 安装构建依赖
COPY . .
RUN npm run build          # 构建静态文件

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# 最终镜像不包含 Node.js 和构建工具
```

### 场景 2: 云平台部署

#### Vercel (前端)：
```json
// vercel.json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist"
}
```

#### Railway (后端)：
```json
// railway.json  
{
  "build": {
    "buildCommand": "cd backend && npm install --production"
  }
}
```

### 场景 3: CI/CD 流水线

```yaml
# .github/workflows/deploy.yml
jobs:
  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Install frontend deps
        run: cd frontend && npm ci
      - name: Build frontend  
        run: cd frontend && npm run build
        
  deploy-backend:
    runs-on: ubuntu-latest  
    steps:
      - name: Install backend deps
        run: cd backend && npm ci --production
      - name: Deploy backend
        run: cd backend && npm start
```

## 依赖安全性

### 攻击面减少
```
单体项目: 50+ 依赖包 (前端+后端+开发工具)
分离架构: 
  - 生产后端: 15 个依赖包
  - 前端构建: 20 个依赖包 (不部署到生产)
  - 开发工具: 5 个依赖包 (不部署到生产)
```

### 依赖审计
```bash
# 分别审计不同环境的依赖
cd backend && npm audit      # 生产环境安全审计
cd frontend && npm audit     # 构建环境安全审计
npm audit                    # 开发环境安全审计
```

## 团队协作优势

### 专业化分工
- **全栈开发者**: 使用根目录的统一脚本
- **后端开发者**: 专注 `backend/` 目录
- **前端开发者**: 专注 `frontend/` 目录
- **DevOps**: 独立部署各个服务

### 代码审查优化
```bash
# PR 只涉及后端改动
git diff backend/

# PR 只涉及前端改动  
git diff frontend/

# 依赖变更清晰可见
git diff backend/package.json
git diff frontend/package.json
```

## 性能对比

| 架构类型 | 生产依赖数 | Docker 镜像大小 | 启动时间 | 安全风险 |
|---------|-----------|--------------|---------|---------|
| 单体架构 | 50+ | 500MB+ | 慢 | 高 |
| 分离架构 | 15 | 200MB | 快 | 低 |

## 最佳实践

### 1. 依赖管理
```bash
# 定期清理和更新
npm run clean                    # 清理所有 node_modules
npm run install-all             # 重新安装所有依赖
```

### 2. 版本锁定
```bash
# 使用 package-lock.json 锁定版本
cd backend && npm ci            # 精确安装锁定版本
cd frontend && npm ci           # 精确安装锁定版本
```

### 3. 环境隔离
```bash
# 开发环境
NODE_ENV=development npm run dev

# 生产环境  
NODE_ENV=production cd backend && npm start
```

这种架构设计虽然看起来复杂，但在实际项目中带来了巨大的灵活性和可维护性优势。
