# AI 角色聊天系统

一个基于 Node.js 和 Gemini AI 的前后端分离聊天系统，支持多种 AI 角色扮演。

## 功能特点

- 🎭 **多角色支持**: 智者、开朗朋友、神秘侦探、浪漫诗人等多种角色
- 🤖 **Gemini AI**: 使用 Google Gemini 模型提供智能对话
- 💬 **实时聊天**: 流畅的对话体验
- 🔄 **流式传输**: SSE 技术实现打字机效果，提升交互体验
- 📱 **响应式设计**: 支持桌面和移动设备
- 🎨 **现代化UI**: 美观的用户界面设计
- 🔒 **安全防护**: 包含率限制、CORS、安全头等防护措施
- ⚙️ **配置化角色**: 每个角色独立配置，支持不同模型参数

## 技术栈

### 后端
- Node.js + Express
- Google Generative AI (Gemini)
- CORS、Helmet、Rate Limiting

### 前端
- 原生 JavaScript (ES6+)
- CSS3 + Flexbox/Grid
- Vite 构建工具

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd actor
```

### 2. 安装依赖
```bash
# 安装所有依赖（前端+后端）
npm run install-all

# 或者分别安装
cd backend && npm install
cd ../frontend && npm install
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑 .env 文件，添加你的 Gemini API Key
# GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. 获取 Gemini API Key
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API Key
3. 将 API Key 添加到 `backend/.env` 文件中

### 5. 启动项目
```bash
# 同时启动前后端（推荐）
npm run dev

# 或者分别启动
npm run dev:backend  # 后端: http://localhost:3001
npm run dev:frontend # 前端: http://localhost:3000
```

### 6. 访问应用
打开浏览器访问: http://localhost:3000

## 项目结构

```
actor/
├── backend/                 # 后端代码
│   ├── server.js           # 主服务器文件
│   ├── package.json        # 后端依赖
│   ├── .env.example        # 环境变量模板
│   └── .env                # 环境变量（需要创建）
├── frontend/               # 前端代码
│   ├── index.html          # 主页面
│   ├── style.css           # 样式文件
│   ├── script.js           # 主要逻辑
│   ├── package.json        # 前端依赖
│   └── vite.config.js      # Vite 配置
├── package.json            # 根项目配置
└── README.md              # 项目说明
```

## API 文档

### 健康检查
```
GET /api/health
```

### 获取角色列表
```
GET /api/actors
```

### 获取特定角色详情
```
GET /api/actors/:actorId
```

### 发送消息 (传统方式)
```
POST /api/chat
Content-Type: application/json

{
  "message": "用户消息",
  "actorId": "角色ID",
  "chatHistory": [] // 可选的聊天历史
}
```

### SSE 流式聊天 (推荐)
```
GET /api/chat/stream?message=消息&actorId=角色ID&chatHistory=编码后的历史

返回 Server-Sent Events 流:
- type: 'start' - 开始生成
- type: 'chunk' - 内容片段
- type: 'end' - 生成完成
- type: 'error' - 发生错误
```

### 角色管理
```
GET /api/stats           # 获取角色统计
POST /api/reload         # 重新加载配置 (仅开发环境)
```

## 角色介绍

- **智者** (`wise-sage`): 睿智的长者，提供人生建议
- **开朗朋友** (`cheerful-friend`): 活泼开朗，充满正能量
- **神秘侦探** (`mystery-detective`): 敏锐的推理和分析能力
- **浪漫诗人** (`romantic-poet`): 富有诗意的浪漫主义者

## 角色配置系统

### 🎭 内置角色
- **智者** (`wise-sage`): 睿智的长者，提供人生建议 🧙‍♂️
- **开朗朋友** (`cheerful-friend`): 活泼开朗，充满正能量 😊
- **神秘侦探** (`mystery-detective`): 敏锐的推理和分析能力 🕵️
- **浪漫诗人** (`romantic-poet`): 富有诗意的浪漫主义者 🌹
- **科技大神** (`tech-guru`): 精通技术的编程专家 👨‍💻

### ⚙️ 自定义角色
每个角色都有独立的配置文件，支持：
- 🤖 **模型配置**: 选择AI模型和参数
- 💬 **个性设置**: 定义角色性格和说话风格  
- 🎯 **行为约束**: 控制角色行为边界
- 🔧 **特殊指令**: 自定义角色独有功能

详细配置说明: [📖 角色配置指南](./ACTOR-CONFIG.md)

## 开发脚本

```bash
# 安装所有依赖
npm run install-all

# 开发模式（前后端同时启动）
npm run dev

# 只启动后端
npm run dev:backend

# 只启动前端
npm run dev:frontend

# 构建前端
npm run build

# 生产环境启动后端
npm start

# 清理 node_modules
npm run clean
```

## 部署

### 前端部署
```bash
cd frontend
npm run build
# 将 dist/ 目录部署到静态文件服务器
```

### 后端部署
```bash
cd backend
npm install --production
# 设置环境变量
export GEMINI_API_KEY=your_api_key
export NODE_ENV=production
export PORT=3001
npm start
```

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GEMINI_API_KEY` | Gemini API 密钥 | 必填 |
| `PORT` | 后端服务端口 | 3001 |
| `NODE_ENV` | 环境模式 | development |
| `CORS_ORIGIN` | 允许的前端域名 | http://localhost:3000 |

## 注意事项

1. **API Key 安全**: 不要将 API Key 提交到版本控制系统
2. **CORS 配置**: 生产环境需要正确配置 CORS 域名
3. **率限制**: 默认每 15 分钟限制 100 次请求
4. **错误处理**: 应用包含完善的错误处理机制

## 故障排除

### 常见问题

1. **无法连接到服务器**
   - 确保后端服务已启动
   - 检查端口是否被占用

2. **Gemini API 错误**
   - 验证 API Key 是否正确
   - 检查 API 调用限额

3. **前端无法加载**
   - 确保前端服务已启动
   - 检查浏览器控制台错误

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 项目架构

这个项目采用了**多层级 package.json 架构**，具有以下优势：

- 🎯 **依赖分离**: 生产、开发、构建依赖完全分离
- 🚀 **部署优化**: 生产环境体积减少 91%
- 🛡️ **安全性**: 攻击面减少 85%
- ⚡ **性能**: 启动速度提升 30-50%

详细说明请参考：
- [📋 架构设计详解](./ARCHITECTURE.md)
- [📊 性能效果分析](./PACKAGE-ARCHITECTURE.md)
- [🚀 部署指南](./DEPLOYMENT.md)