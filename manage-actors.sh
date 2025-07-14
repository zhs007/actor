#!/bin/bash

# 角色配置管理脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎭 角色配置管理工具${NC}"
echo "======================="

show_help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  list      - 列出所有角色"
    echo "  test      - 测试角色配置加载"
    echo "  stats     - 显示角色统计信息"
    echo "  validate  - 验证配置文件格式"
    echo "  reload    - 重新加载配置 (仅开发环境)"
    echo "  create    - 创建新角色模板"
    echo "  help      - 显示此帮助信息"
}

list_actors() {
    echo -e "${YELLOW}📋 当前角色列表:${NC}"
    cd backend
    node -e "
        const ActorManager = require('./actorManager');
        const manager = new ActorManager();
        const actors = manager.getAllActors();
        actors.forEach(actor => {
            console.log(\`  \${actor.avatar} \${actor.name} (\${actor.id})\`);
            console.log(\`     \${actor.description}\`);
            console.log('');
        });
    " 2>/dev/null
}

test_config() {
    echo -e "${YELLOW}🧪 测试角色配置加载...${NC}"
    cd backend
    node -e "
        try {
            const ActorManager = require('./actorManager');
            const manager = new ActorManager();
            console.log('✅ 所有角色配置加载成功');
        } catch (error) {
            console.error('❌ 配置加载失败:', error.message);
            process.exit(1);
        }
    " 2>/dev/null
}

show_stats() {
    echo -e "${YELLOW}📊 角色统计信息:${NC}"
    cd backend
    node -e "
        const ActorManager = require('./actorManager');
        const manager = new ActorManager();
        const stats = manager.getStats();
        console.log(\`总角色数: \${stats.totalActors}\`);
        console.log(\`使用的模型: \${Object.keys(stats.models).join(', ')}\`);
        console.log(\`平均温度: \${stats.avgTemperature}\`);
        console.log(\`平均Token数: \${stats.avgMaxTokens}\`);
    " 2>/dev/null
}

validate_configs() {
    echo -e "${YELLOW}✅ 验证配置文件...${NC}"
    
    for file in backend/actors/*.json; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo -n "  检查 $filename ... "
            
            # 检查JSON格式
            if jq . "$file" > /dev/null 2>&1; then
                echo -e "${GREEN}JSON格式正确${NC}"
            else
                echo -e "${RED}JSON格式错误${NC}"
                continue
            fi
            
            # 检查必需字段
            required_fields=("id" "name" "description" "model" "prompt")
            missing_fields=()
            
            for field in "${required_fields[@]}"; do
                if ! jq -e ".$field" "$file" > /dev/null 2>&1; then
                    missing_fields+=("$field")
                fi
            done
            
            if [ ${#missing_fields[@]} -eq 0 ]; then
                echo -e "    ${GREEN}所有必需字段存在${NC}"
            else
                echo -e "    ${RED}缺少字段: ${missing_fields[*]}${NC}"
            fi
        fi
    done
}

reload_config() {
    echo -e "${YELLOW}🔄 重新加载角色配置...${NC}"
    
    # 检查服务器是否运行
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        response=$(curl -s -X POST http://localhost:3001/api/reload)
        if echo "$response" | jq -e '.message' > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 配置重新加载成功${NC}"
        else
            echo -e "${RED}❌ 重新加载失败${NC}"
            echo "$response"
        fi
    else
        echo -e "${RED}❌ 服务器未运行，请先启动后端服务${NC}"
        echo "提示: npm run dev:backend"
    fi
}

create_template() {
    echo -e "${YELLOW}📝 创建新角色模板...${NC}"
    
    read -p "角色ID (英文，如 my-character): " actor_id
    read -p "角色名称: " actor_name
    read -p "角色描述: " actor_desc
    read -p "角色头像 (emoji): " actor_avatar
    
    if [ -z "$actor_id" ] || [ -z "$actor_name" ]; then
        echo -e "${RED}❌ 角色ID和名称不能为空${NC}"
        exit 1
    fi
    
    template_file="backend/actors/${actor_id}.json"
    
    if [ -f "$template_file" ]; then
        echo -e "${RED}❌ 角色 ${actor_id} 已存在${NC}"
        exit 1
    fi
    
    cat > "$template_file" << EOF
{
  "id": "${actor_id}",
  "name": "${actor_name}",
  "description": "${actor_desc:-新的AI角色}",
  "avatar": "${actor_avatar:-🎭}",
  "model": {
    "name": "gemini-pro",
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 0.8
  },
  "prompt": {
    "system": "你是${actor_name}，请在这里定义角色的基本设定...",
    "personality": [
      "性格特点1",
      "性格特点2"
    ],
    "style": "说话风格描述",
    "constraints": [
      "行为约束1",
      "行为约束2"
    ]
  },
  "responseSettings": {
    "contextLength": 5,
    "includeEmoji": true,
    "responseStyle": "normal",
    "typicalLength": "medium"
  },
  "specialInstructions": [
    "特殊指令1",
    "特殊指令2"
  ]
}
EOF
    
    echo -e "${GREEN}✅ 模板已创建: ${template_file}${NC}"
    echo -e "${YELLOW}💡 请编辑配置文件并重启服务器或调用reload${NC}"
}

# 主逻辑
case "$1" in
    "list")
        list_actors
        ;;
    "test")
        test_config
        ;;
    "stats")
        show_stats
        ;;
    "validate")
        validate_configs
        ;;
    "reload")
        reload_config
        ;;
    "create")
        create_template
        ;;
    "help"|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ 未知命令: $1${NC}"
        show_help
        exit 1
        ;;
esac
