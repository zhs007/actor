// API 使用示例
// 这个文件展示了如何使用后端 API

const API_BASE_URL = 'http://localhost:3001/api';

// 1. 健康检查
async function healthCheck() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('健康检查:', data);
        return data;
    } catch (error) {
        console.error('健康检查失败:', error);
    }
}

// 2. 获取可用角色
async function getActors() {
    try {
        const response = await fetch(`${API_BASE_URL}/actors`);
        const actors = await response.json();
        console.log('可用角色:', actors);
        return actors;
    } catch (error) {
        console.error('获取角色失败:', error);
    }
}

// 3. 发送聊天消息
async function sendChatMessage(message, actorId, chatHistory = []) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                actorId,
                chatHistory
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('AI 回复:', data);
        return data;
    } catch (error) {
        console.error('发送消息失败:', error);
        throw error;
    }
}

// 使用示例
async function demo() {
    console.log('🎭 AI 角色聊天系统 API 演示');
    console.log('============================');

    // 1. 检查服务状态
    console.log('\n1. 检查服务状态...');
    await healthCheck();

    // 2. 获取角色列表
    console.log('\n2. 获取角色列表...');
    const actors = await getActors();

    if (actors && actors.length > 0) {
        // 3. 选择第一个角色进行对话
        const actor = actors[0];
        console.log(`\n3. 与 ${actor.name} 对话...`);

        // 发送第一条消息
        const message1 = "你好，很高兴认识你！";
        const response1 = await sendChatMessage(message1, actor.id);

        // 构建聊天历史
        const history = [{
            user: message1,
            assistant: response1.message,
            timestamp: response1.timestamp
        }];

        // 发送第二条消息（带历史记录）
        const message2 = "你能告诉我一些人生智慧吗？";
        const response2 = await sendChatMessage(message2, actor.id, history);

        console.log('\n对话历史:');
        console.log(`用户: ${message1}`);
        console.log(`${actor.name}: ${response1.message}`);
        console.log(`用户: ${message2}`);
        console.log(`${actor.name}: ${response2.message}`);
    }
}

// 错误处理示例
async function errorHandlingDemo() {
    console.log('\n🔧 错误处理示例');
    console.log('================');

    try {
        // 尝试使用无效的角色 ID
        await sendChatMessage("测试消息", "invalid-actor-id");
    } catch (error) {
        console.log('预期的错误:', error.message);
    }

    try {
        // 尝试发送空消息
        await sendChatMessage("", "wise-sage");
    } catch (error) {
        console.log('预期的错误:', error.message);
    }
}

// 如果是在浏览器环境中运行
if (typeof window !== 'undefined') {
    // 将函数添加到全局对象，方便在浏览器控制台中测试
    window.actorAPI = {
        healthCheck,
        getActors,
        sendChatMessage,
        demo,
        errorHandlingDemo
    };

    console.log('API 函数已添加到 window.actorAPI');
    console.log('使用方法: window.actorAPI.demo()');
}

// 如果是在 Node.js 环境中运行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        healthCheck,
        getActors,
        sendChatMessage,
        demo,
        errorHandlingDemo
    };
}

/* 
使用说明:

在浏览器中:
1. 打开开发者工具的控制台
2. 运行: window.actorAPI.demo()

在 Node.js 中 (需要安装 node-fetch):
1. npm install node-fetch
2. 在文件开头添加: const fetch = require('node-fetch');
3. 运行: node api-demo.js

API 端点:
- GET /api/health - 健康检查
- GET /api/actors - 获取角色列表  
- POST /api/chat - 发送聊天消息

请求格式:
POST /api/chat
{
  "message": "用户消息",
  "actorId": "角色ID", 
  "chatHistory": [
    {
      "user": "之前的用户消息",
      "assistant": "之前的AI回复",
      "timestamp": "时间戳"
    }
  ]
}

响应格式:
{
  "message": "AI回复消息",
  "actor": {
    "id": "角色ID",
    "name": "角色名称"
  },
  "timestamp": "时间戳"
}
*/
