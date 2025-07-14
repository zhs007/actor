const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { setGlobalDispatcher, ProxyAgent } = require('undici');
const ActorManager = require('./actorManager');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Actor Manager
const actorManager = new ActorManager();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Configure proxy for Gemini API using undici
if (process.env.HTTPS_PROXY) {
  console.log(`🌐 Using proxy: ${process.env.HTTPS_PROXY}`);
  const proxyAgent = new ProxyAgent(process.env.HTTPS_PROXY);
  setGlobalDispatcher(proxyAgent);
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get available actors
app.get('/api/actors', (req, res) => {
  try {
    const actors = actorManager.getAllActors();
    res.json(actors);
  } catch (error) {
    console.error('Get actors error:', error);
    res.status(500).json({ error: '获取角色列表失败' });
  }
});

// Get specific actor details
app.get('/api/actors/:actorId', (req, res) => {
  try {
    const { actorId } = req.params;
    const actor = actorManager.getActor(actorId);
    
    if (!actor) {
      return res.status(404).json({ error: '角色不存在' });
    }
    
    res.json(actor);
  } catch (error) {
    console.error('Get actor details error:', error);
    res.status(500).json({ error: '获取角色详情失败' });
  }
});

// Get actor statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = actorManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

// Reload actor configurations (for development)
app.post('/api/reload', (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: '生产环境不允许重新加载配置' });
    }
    
    actorManager.reloadActors();
    res.json({ message: '角色配置已重新加载', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Reload actors error:', error);
    res.status(500).json({ error: '重新加载配置失败' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, actorId, chatHistory = [] } = req.body;

    // 记录请求信息
    console.log(`📨 Chat request: actorId=${actorId}, messageLength=${message?.length}, historyLength=${chatHistory?.length}`);

    if (!message || !actorId) {
      return res.status(400).json({ error: '消息和角色ID是必需的' });
    }

    if (!actorManager.hasActor(actorId)) {
      return res.status(400).json({ error: '无效的角色ID' });
    }

    const actor = actorManager.getActor(actorId);
    const modelConfig = actorManager.getModelConfig(actorId);
    
    // 使用配置中的模型设置
    const model = genAI.getGenerativeModel(modelConfig);

    // 构建对话上下文
    const conversationPrompt = actorManager.buildPrompt(actorId, chatHistory);
    const fullPrompt = conversationPrompt + `用户说: ${message}\n请以${actor.name}的身份回应:`;

    console.log(`🤖 Sending request to Gemini API, prompt length: ${fullPrompt.length}`);
    
    const result = await model.generateContent(fullPrompt);
    
    console.log(`✅ Received response from Gemini API`);
    
    const response = await result.response;
    const text = response.text();

    console.log(`📤 Sending response, length: ${text.length}, content preview: ${text.substring(0, 100)}...`);
    
    if (!text || text.trim().length === 0) {
      console.warn(`⚠️ Empty response from Gemini API for message: ${message.substring(0, 100)}...`);
    }

    res.json({
      message: text,
      actor: {
        id: actorId,
        name: actor.name,
        avatar: actor.avatar || '🎭'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', {
      message: error.message,
      stack: error.stack,
      actorId,
      messageLength: message?.length,
      timestamp: new Date().toISOString()
    });
    
    if (error.message.includes('API key')) {
      return res.status(401).json({ error: 'Gemini API密钥未配置或无效' });
    }
    
    if (error.message.includes('quota') || error.message.includes('limit')) {
      return res.status(429).json({ error: 'API调用频率限制，请稍后重试' });
    }
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({ error: '请求超时，请重试' });
    }
    
    res.status(500).json({ 
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// SSE Stream chat endpoint
app.get('/api/chat/stream', async (req, res) => {
  try {
    const { message, actorId, chatHistory } = req.query;
    const parsedHistory = chatHistory ? JSON.parse(decodeURIComponent(chatHistory)) : [];

    // 记录流式请求信息
    console.log(`🔄 Stream request: actorId=${actorId}, messageLength=${message?.length}, historyLength=${parsedHistory?.length}`);

    if (!message || !actorId) {
      return res.status(400).json({ error: '消息和角色ID是必需的' });
    }

    if (!actorManager.hasActor(actorId)) {
      return res.status(400).json({ error: '无效的角色ID' });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:3000',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const actor = actorManager.getActor(actorId);
    const modelConfig = actorManager.getModelConfig(actorId);
    
    // 使用流式模型
    const model = genAI.getGenerativeModel(modelConfig);

    // 构建对话上下文
    const conversationPrompt = actorManager.buildPrompt(actorId, parsedHistory);
    const fullPrompt = conversationPrompt + `用户说: ${message}\n请以${actor.name}的身份回应:`;

    console.log(`🤖 Sending stream request to Gemini API, prompt length: ${fullPrompt.length}`);

    try {
      // 使用流式生成
      const result = await model.generateContentStream(fullPrompt);
      
      console.log(`✅ Stream started from Gemini API`);
      
      // 发送开始事件
      res.write(`data: ${JSON.stringify({
        type: 'start',
        actor: {
          id: actorId,
          name: actor.name,
          avatar: actor.avatar || '🎭'
        },
        timestamp: new Date().toISOString()
      })}\n\n`);

      let fullMessage = '';
      let chunkCount = 0;
      
      // 逐步发送内容
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullMessage += chunkText;
        chunkCount++;
        
        console.log(`📨 Stream chunk ${chunkCount}, length: ${chunkText.length}, total: ${fullMessage.length}`);
        
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content: chunkText,
          fullContent: fullMessage
        })}\n\n`);
      }

      console.log(`🏁 Stream completed, total chunks: ${chunkCount}, final length: ${fullMessage.length}`);

      // 发送结束事件
      res.write(`data: ${JSON.stringify({
        type: 'end',
        message: fullMessage,
        actor: {
          id: actorId,
          name: actor.name,
          avatar: actor.avatar || '🎭'
        },
        timestamp: new Date().toISOString()
      })}\n\n`);

    } catch (streamError) {
      console.error('Stream generation error:', {
        message: streamError.message,
        stack: streamError.stack,
        actorId,
        messageLength: message?.length,
        timestamp: new Date().toISOString()
      });
      
      // 发送错误事件
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: '生成回复时出错',
        details: process.env.NODE_ENV === 'development' ? streamError.message : undefined
      })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('SSE Chat error:', error);
    
    // 发送错误事件
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message.includes('API key') ? 'Gemini API密钥未配置或无效' : '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })}\n\n`);
    
    res.end();
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: '路由未找到' });
});

app.listen(port, () => {
  console.log(`🚀 Actor Backend Server running on port ${port}`);
  console.log(`📝 API Documentation available at http://localhost:${port}/api`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Warning: GEMINI_API_KEY is not set. Please set it in your .env file.');
  }
});

module.exports = app;
