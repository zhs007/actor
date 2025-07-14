const fs = require('fs');
const path = require('path');

class ActorManager {
  constructor() {
    this.actors = new Map();
    this.loadActors();
  }

  /**
   * 加载所有角色配置文件
   */
  loadActors() {
    const actorsDir = path.join(__dirname, 'actors');
    
    try {
      const files = fs.readdirSync(actorsDir);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(actorsDir, file);
            const rawData = fs.readFileSync(filePath, 'utf8');
            const actorConfig = JSON.parse(rawData);
            
            // 验证配置文件格式
            if (this.validateActorConfig(actorConfig)) {
              this.actors.set(actorConfig.id, actorConfig);
              console.log(`✅ 成功加载角色: ${actorConfig.name} (${actorConfig.id})`);
            } else {
              console.warn(`⚠️  角色配置文件格式无效: ${file}`);
            }
          } catch (error) {
            console.error(`❌ 加载角色配置失败: ${file}`, error.message);
          }
        }
      });
      
      console.log(`🎭 总共加载了 ${this.actors.size} 个角色`);
    } catch (error) {
      console.error('❌ 读取角色配置目录失败:', error.message);
    }
  }

  /**
   * 验证角色配置文件格式
   */
  validateActorConfig(config) {
    const requiredFields = ['id', 'name', 'description', 'model', 'prompt'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        console.error(`缺少必需字段: ${field}`);
        return false;
      }
    }
    
    // 验证模型配置
    if (!config.model.name) {
      console.error('模型配置缺少name字段');
      return false;
    }
    
    // 验证prompt配置
    if (!config.prompt.system) {
      console.error('prompt配置缺少system字段');
      return false;
    }
    
    return true;
  }

  /**
   * 获取所有角色的基本信息
   */
  getAllActors() {
    return Array.from(this.actors.values()).map(actor => ({
      id: actor.id,
      name: actor.name,
      description: actor.description,
      avatar: actor.avatar || '🎭'
    }));
  }

  /**
   * 根据ID获取角色配置
   */
  getActor(actorId) {
    return this.actors.get(actorId);
  }

  /**
   * 检查角色是否存在
   */
  hasActor(actorId) {
    return this.actors.has(actorId);
  }

  /**
   * 构建完整的提示词
   */
  buildPrompt(actorId, chatHistory = []) {
    const actor = this.getActor(actorId);
    if (!actor) {
      throw new Error(`角色 ${actorId} 不存在`);
    }

    let prompt = actor.prompt.system + "\n\n";

    // 添加性格特点
    if (actor.prompt.personality && actor.prompt.personality.length > 0) {
      prompt += "你的性格特点:\n";
      actor.prompt.personality.forEach(trait => {
        prompt += `- ${trait}\n`;
      });
      prompt += "\n";
    }

    // 添加风格指导
    if (actor.prompt.style) {
      prompt += `你的说话风格: ${actor.prompt.style}\n\n`;
    }

    // 添加约束条件
    if (actor.prompt.constraints && actor.prompt.constraints.length > 0) {
      prompt += "请注意:\n";
      actor.prompt.constraints.forEach(constraint => {
        prompt += `- ${constraint}\n`;
      });
      prompt += "\n";
    }

    // 添加特殊指令
    if (actor.specialInstructions && actor.specialInstructions.length > 0) {
      prompt += "特殊指令:\n";
      actor.specialInstructions.forEach(instruction => {
        prompt += `- ${instruction}\n`;
      });
      prompt += "\n";
    }

    // 添加聊天历史
    const contextLength = actor.responseSettings?.contextLength || 5;
    if (chatHistory.length > 0) {
      prompt += "之前的对话:\n";
      chatHistory.slice(-contextLength).forEach(msg => {
        prompt += `用户: ${msg.user}\n${actor.name}: ${msg.assistant}\n`;
      });
      prompt += "\n";
    }

    return prompt;
  }

  /**
   * 获取角色的模型配置
   */
  getModelConfig(actorId) {
    const actor = this.getActor(actorId);
    if (!actor) {
      throw new Error(`角色 ${actorId} 不存在`);
    }

    return {
      model: actor.model.name,
      generationConfig: {
        temperature: actor.model.temperature || 0.7,
        maxOutputTokens: actor.model.maxTokens || 1000,
        topP: actor.model.topP || 0.8,
      }
    };
  }

  /**
   * 重新加载角色配置（用于热更新）
   */
  reloadActors() {
    this.actors.clear();
    this.loadActors();
    console.log('🔄 角色配置已重新加载');
  }

  /**
   * 获取角色统计信息
   */
  getStats() {
    const stats = {
      totalActors: this.actors.size,
      models: {},
      avgTemperature: 0,
      avgMaxTokens: 0
    };

    let tempSum = 0;
    let tokenSum = 0;

    this.actors.forEach(actor => {
      // 统计模型使用情况
      const modelName = actor.model.name;
      stats.models[modelName] = (stats.models[modelName] || 0) + 1;

      // 计算平均值
      tempSum += actor.model.temperature || 0.7;
      tokenSum += actor.model.maxTokens || 1000;
    });

    if (this.actors.size > 0) {
      stats.avgTemperature = (tempSum / this.actors.size).toFixed(2);
      stats.avgMaxTokens = Math.round(tokenSum / this.actors.size);
    }

    return stats;
  }
}

module.exports = ActorManager;
