# 主题系统计划

## 深色/浅色模式

### 1. CSS变量设计
```css
:root {
  /* 浅色主题 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --accent-color: #007bff;
}

[data-theme="dark"] {
  /* 深色主题 */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --border-color: #404040;
  --accent-color: #4dabf7;
}
```

### 2. 主题切换组件
- 主题切换按钮
- 系统主题自动检测
- 主题偏好存储
- 平滑过渡动画

### 3. 功能特性
- 自动检测系统偏好
- localStorage持久化
- 实时主题切换
- 支持多个预设主题
- 角色相关主题色

### 4. 实现文件
- `themes.css` - 主题样式定义
- `theme-manager.js` - 主题管理逻辑
- 更新现有CSS文件使用变量

### 5. 扩展主题
- 角色专属配色方案
- 节日主题
- 护眼模式
- 高对比度模式
