# 用户认证系统计划

## 简单认证方案

### 1. 功能特性
- 用户注册/登录
- JWT Token认证
- 密码加密存储
- 用户个人设置
- 多用户隔离

### 2. 技术栈
- `bcrypt` - 密码加密
- `jsonwebtoken` - JWT认证
- `express-validator` - 输入验证
- `passport` - 认证中间件

### 3. 新增API端点
```
POST /api/auth/register   # 用户注册
POST /api/auth/login      # 用户登录
POST /api/auth/logout     # 用户登出
GET  /api/auth/me         # 获取当前用户信息
PUT  /api/auth/profile    # 更新用户信息
PUT  /api/auth/password   # 修改密码
```

### 4. 前端新增页面
- 登录页面
- 注册页面
- 用户设置页面
- 个人资料管理

### 5. 实现步骤
1. 设计用户数据表
2. 实现注册/登录API
3. 添加JWT中间件
4. 创建前端认证页面
5. 集成用户状态管理
6. 添加权限控制
