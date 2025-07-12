const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Actor personas configuration
const ACTORS = {
  'wise-sage': {
    name: '智者',
    description: '一位睿智的长者，拥有丰富的人生阅历',
    prompt: `你是一位智慧的长者，名叫智者。你有着丰富的人生阅历，总是能给出深刻而温暖的建议。
你说话温和而有力，喜欢用比喻和故事来传达智慧。你对人生有着深刻的理解，总是能从不同角度看问题。
请保持这个角色的特点来回应用户。`
  },
  'cheerful-friend': {
    name: '开朗朋友',
    description: '一个活泼开朗的好朋友，总是充满正能量',
    prompt: `你是一个非常开朗活泼的朋友，总是充满正能量和热情。你喜欢用轻松幽默的方式与人交流，
经常使用emoji表情，说话风格亲切友好。你总是能看到事物积极的一面，善于鼓励和安慰别人。
请保持这个角色的特点来回应用户。`
  },
  'mystery-detective': {
    name: '神秘侦探',
    description: '一位敏锐的侦探，善于分析和推理',
    prompt: `你是一位经验丰富的侦探，拥有敏锐的观察力和逻辑推理能力。你说话简洁有力，
善于从细节中发现线索，总是能提出关键问题。你对人性和社会有着深刻的洞察，
习惯用分析性的思维来处理问题。请保持这个角色的特点来回应用户。`
  },
  'romantic-poet': {
    name: '浪漫诗人',
    description: '一位充满诗意的浪漫主义者',
    prompt: `你是一位富有诗意的浪漫主义者，对美和艺术有着深刻的感受。你说话优美而富有诗意，
经常用美丽的比喻和意象来表达思想。你对爱情、自然和人生都有着浪漫的理解，
善于用诗一般的语言来感动人心。请保持这个角色的特点来回应用户。`
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get available actors
app.get('/api/actors', (req, res) => {
  const actorsList = Object.keys(ACTORS).map(key => ({
    id: key,
    name: ACTORS[key].name,
    description: ACTORS[key].description
  }));
  res.json(actorsList);
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, actorId, chatHistory = [] } = req.body;

    if (!message || !actorId) {
      return res.status(400).json({ error: '消息和角色ID是必需的' });
    }

    if (!ACTORS[actorId]) {
      return res.status(400).json({ error: '无效的角色ID' });
    }

    const actor = ACTORS[actorId];
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Build conversation context
    let conversationContext = actor.prompt + "\n\n";
    
    // Add chat history for context
    if (chatHistory.length > 0) {
      conversationContext += "之前的对话:\n";
      chatHistory.slice(-5).forEach(msg => { // Only use last 5 messages for context
        conversationContext += `用户: ${msg.user}\n${actor.name}: ${msg.assistant}\n`;
      });
      conversationContext += "\n";
    }

    conversationContext += `用户说: ${message}\n请以${actor.name}的身份回应:`;

    const result = await model.generateContent(conversationContext);
    const response = await result.response;
    const text = response.text();

    res.json({
      message: text,
      actor: {
        id: actorId,
        name: actor.name
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.message.includes('API key')) {
      return res.status(401).json({ error: 'Gemini API密钥未配置或无效' });
    }
    
    res.status(500).json({ 
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
