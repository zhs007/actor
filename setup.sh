#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎭 AI 角色聊天系统 - 快速启动脚本${NC}"
echo "================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 已安装: $(node --version)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm 已安装: $(npm --version)${NC}"

# 安装依赖
echo -e "${YELLOW}📦 正在安装依赖...${NC}"
npm run install-all

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 依赖安装成功${NC}"

# 检查环境变量文件
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  环境变量文件不存在，正在创建...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}📝 请编辑 backend/.env 文件，添加你的 Gemini API Key${NC}"
    echo -e "${BLUE}💡 获取 API Key: https://makersuite.google.com/app/apikey${NC}"
    
    read -p "是否现在打开 .env 文件进行编辑? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v code &> /dev/null; then
            code backend/.env
        elif command -v nano &> /dev/null; then
            nano backend/.env
        elif command -v vim &> /dev/null; then
            vim backend/.env
        else
            echo -e "${YELLOW}请手动编辑 backend/.env 文件${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ 环境变量文件已存在${NC}"
fi

# 检查是否配置了 API Key
if ! grep -q "GEMINI_API_KEY=.*[^[:space:]]" backend/.env; then
    echo -e "${YELLOW}⚠️  请确保在 backend/.env 中正确配置了 GEMINI_API_KEY${NC}"
fi

echo ""
echo -e "${GREEN}🚀 设置完成！${NC}"
echo ""
echo -e "${BLUE}启动项目:${NC}"
echo "  npm run dev          # 同时启动前后端"
echo "  npm run dev:backend  # 只启动后端 (端口 3001)"
echo "  npm run dev:frontend # 只启动前端 (端口 3000)"
echo ""
echo -e "${BLUE}访问地址:${NC}"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:3001"
echo ""
echo -e "${YELLOW}注意: 请确保已在 backend/.env 中配置正确的 Gemini API Key${NC}"
