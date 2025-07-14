# 角色配置指南

## 📋 配置文件结构

每个角色都有一个独立的 JSON 配置文件，位于 `backend/actors/` 目录下。

### 基本结构
```json
{
  "id": "角色唯一标识符",
  "name": "角色显示名称", 
  "description": "角色简短描述",
  "avatar": "角色头像emoji",
  "model": {
    "name": "使用的AI模型",
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 0.8
  },
  "prompt": {
    "system": "系统角色定义",
    "personality": ["性格特点列表"],
    "style": "说话风格描述",
    "constraints": ["约束条件列表"]
  },
  "responseSettings": {
    "contextLength": 5,
    "includeEmoji": true,
    "responseStyle": "回复风格",
    "typicalLength": "回复长度"
  },
  "specialInstructions": ["特殊指令列表"]
}
```

## 🎯 字段详解

### 基本信息
- **id**: 角色的唯一标识符，用于API调用
- **name**: 用户界面显示的角色名称
- **description**: 角色选择页面显示的简短描述
- **avatar**: 角色头像，建议使用emoji

### 模型配置 (model)
- **name**: AI模型名称 (目前支持 "gemini-pro")
- **temperature**: 创造性程度 (0.0-1.0)
  - 0.0-0.3: 非常理性，适合分析型角色
  - 0.4-0.7: 平衡，适合大多数角色
  - 0.8-1.0: 非常创造性，适合艺术型角色
- **maxTokens**: 最大回复长度 (建议 800-1200)
- **topP**: 核心采样 (0.0-1.0，建议 0.7-0.9)

### 提示词配置 (prompt)
- **system**: 核心角色定义，告诉AI它是谁
- **personality**: 性格特点数组，描述角色行为方式
- **style**: 说话风格的简洁描述
- **constraints**: 约束条件，告诉AI什么不能做

### 回复设置 (responseSettings)
- **contextLength**: 记住多少轮对话历史 (建议 3-6)
- **includeEmoji**: 是否在回复中使用emoji
- **responseStyle**: 回复风格标签
- **typicalLength**: 期望的回复长度

### 特殊指令 (specialInstructions)
角色独有的行为指令，会在每次对话时提醒AI。

## 🎨 创建新角色

### 步骤 1: 创建配置文件
在 `backend/actors/` 目录下创建新的 JSON 文件：

```bash
touch backend/actors/new-character.json
```

### 步骤 2: 填写配置
```json
{
  "id": "new-character",
  "name": "新角色",
  "description": "角色描述",
  "avatar": "🎭",
  "model": {
    "name": "gemini-pro",
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 0.8
  },
  "prompt": {
    "system": "你是...",
    "personality": [
      "性格特点1",
      "性格特点2"
    ],
    "style": "说话风格",
    "constraints": [
      "约束1",
      "约束2" 
    ]
  },
  "responseSettings": {
    "contextLength": 5,
    "includeEmoji": true,
    "responseStyle": "风格",
    "typicalLength": "medium"
  },
  "specialInstructions": [
    "特殊指令1",
    "特殊指令2"
  ]
}
```

### 步骤 3: 重启服务器
```bash
npm run dev:backend
```

或在开发环境中调用重载API：
```bash
curl -X POST http://localhost:3001/api/reload
```

## 🎭 现有角色示例

### 智者 (wise-sage)
- **特点**: 温和睿智，善用比喻
- **temperature**: 0.7 (平衡理性与创造性)
- **风格**: 深度思考，启发式对话

### 开朗朋友 (cheerful-friend) 
- **特点**: 活泼积极，充满正能量
- **temperature**: 0.9 (高创造性)
- **风格**: 轻松幽默，鼓励式对话

### 神秘侦探 (mystery-detective)
- **特点**: 理性分析，逻辑严密
- **temperature**: 0.3 (低创造性，高理性)
- **风格**: 分析性，提问式对话

### 浪漫诗人 (romantic-poet)
- **特点**: 富有诗意，充满想象
- **temperature**: 0.8 (高创造性)
- **风格**: 优美诗意，比喻式对话

## ⚙️ 高级配置

### 条件性指令
可以在 `specialInstructions` 中添加条件性行为：

```json
"specialInstructions": [
  "如果用户看起来沮丧，给予更多鼓励",
  "遇到技术问题时，提供实用建议",
  "在深夜时段，使用更温柔的语调"
]
```

### 动态模型选择
将来可以支持根据对话内容动态选择模型：

```json
"model": {
  "name": "gemini-pro",
  "fallback": "gemini-pro-vision",
  "conditions": {
    "image": "gemini-pro-vision",
    "code": "code-model"
  }
}
```

## 🔧 调试和优化

### 查看角色统计
```bash
curl http://localhost:3001/api/stats
```

### 获取特定角色配置
```bash
curl http://localhost:3001/api/actors/wise-sage
```

### 测试角色回复
使用 API 测试工具或前端界面测试角色回复质量。

## 🎯 最佳实践

### 1. 角色一致性
- 确保 `personality`、`style` 和 `specialInstructions` 相互一致
- 避免矛盾的性格特点

### 2. 提示词优化
- 使用具体的描述而非抽象概念
- 提供正面和负面的行为示例
- 定期测试和调整

### 3. 模型参数调优
- 理性角色使用低 temperature (0.1-0.4)
- 创造性角色使用高 temperature (0.7-0.9)
- 根据角色调整 maxTokens

### 4. 用户体验
- 选择合适的 emoji 头像
- 编写清晰的角色描述
- 设置合适的上下文长度

## 🚀 部署注意事项

### 生产环境
- 配置文件会在服务器启动时加载
- 修改配置需要重启服务器
- 建议使用版本控制管理配置文件

### 开发环境
- 可以使用 `/api/reload` 端点热重载
- 配置错误会在控制台显示详细信息
- 支持实时调试和测试

通过这种配置化的方式，您可以轻松创建和管理各种不同的AI角色，为用户提供丰富多样的聊天体验。
