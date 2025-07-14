# 数据库集成计划

## SQLite 本地存储方案

### 1. 数据库表设计
```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 对话会话表
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    actor_id TEXT NOT NULL,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 消息表
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions (id)
);
```

### 2. 需要的依赖
- `sqlite3` - SQLite数据库驱动
- `express-session` - 会话管理
- `uuid` - 生成唯一ID

### 3. 新增API端点
- `GET /api/sessions` - 获取用户的对话历史
- `POST /api/sessions` - 创建新的对话会话
- `DELETE /api/sessions/:id` - 删除对话会话
- `GET /api/sessions/:id/messages` - 获取会话消息
- `POST /api/export/:sessionId` - 导出对话记录

### 4. 前端新增功能
- 对话历史侧边栏
- 会话管理界面
- 导出功能
- 搜索对话功能
