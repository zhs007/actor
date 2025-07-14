// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const USE_STREAMING = true; // 设置是否使用流式传输

// Global state
let currentActor = null;
let chatHistory = [];

// DOM elements
const elements = {
    actorSelection: document.getElementById('actorSelection'),
    chatInterface: document.getElementById('chatInterface'),
    actorsGrid: document.getElementById('actorsGrid'),
    currentActorName: document.getElementById('currentActorName'),
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendButton: document.getElementById('sendButton'),
    backButton: document.getElementById('backButton'),
    clearChat: document.getElementById('clearChat'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('errorMessage'),
    streamingToggle: document.getElementById('streamingToggle')
};

// Utility functions
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

function showError(message) {
    const errorText = elements.errorMessage.querySelector('.error-text');
    errorText.textContent = message;
    showElement(elements.errorMessage);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideElement(elements.errorMessage);
    }, 5000);
}

function showLoading() {
    showElement(elements.loading);
}

function hideLoading() {
    hideElement(elements.loading);
}

function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// API functions
async function fetchActors() {
    try {
        const response = await fetch(`${API_BASE_URL}/actors`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch actors:', error);
        throw new Error('无法加载角色列表，请检查网络连接');
    }
}

async function sendMessage(message, actorId, history) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                actorId,
                chatHistory: history
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
    }
}

// 模拟打字机效果的函数
async function simulateTypingEffect(message, messageElement, speed = 30) {
    return new Promise((resolve) => {
        const contentElement = messageElement.querySelector('.message-content');
        let currentText = '';
        let index = 0;
        
        const typeInterval = setInterval(() => {
            if (index < message.length) {
                currentText += message[index];
                contentElement.innerHTML = escapeHtml(currentText) + '<span class="typing-cursor">|</span>';
                index++;
                scrollToBottom();
            } else {
                clearInterval(typeInterval);
                // 移除光标
                contentElement.innerHTML = escapeHtml(message);
                messageElement.classList.remove('streaming');
                resolve();
            }
        }, speed);
    });
}

// 修改后的流式传输函数，包含降级方案
async function sendMessageStream(message, actorId, history) {
    return new Promise((resolve, reject) => {
        const encodedHistory = encodeURIComponent(JSON.stringify(history));
        const url = `${API_BASE_URL}/chat/stream?message=${encodeURIComponent(message)}&actorId=${actorId}&chatHistory=${encodedHistory}`;
        
        const eventSource = new EventSource(url);
        let fullMessage = '';
        let messageElement = null;
        let actor = null;
        let hasStarted = false;

        // 超时处理 - 如果3秒内没有开始，则降级到模拟打字机效果
        const fallbackTimeout = setTimeout(async () => {
            if (!hasStarted) {
                console.log('SSE timeout, falling back to simulated typing effect');
                eventSource.close();
                
                try {
                    // 降级到传统API + 模拟打字机效果
                    const response = await sendMessage(message, actorId, history);
                    
                    // 创建消息元素
                    const actorInfo = { id: actorId, name: response.actor.name, avatar: response.actor.avatar };
                    messageElement = createStreamingMessage(actorInfo);
                    elements.chatMessages.appendChild(messageElement);
                    scrollToBottom();
                    
                    // 模拟打字机效果
                    await simulateTypingEffect(response.message, messageElement);
                    
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            }
        }, 3000);

        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'start':
                        hasStarted = true;
                        clearTimeout(fallbackTimeout);
                        actor = data.actor;
                        
                        // 创建流式消息元素
                        messageElement = createStreamingMessage(actor);
                        elements.chatMessages.appendChild(messageElement);
                        scrollToBottom();
                        break;
                        
                    case 'chunk':
                        if (messageElement) {
                            fullMessage = data.fullContent;
                            updateStreamingMessage(messageElement, fullMessage);
                            scrollToBottom();
                        }
                        break;
                        
                    case 'end':
                        eventSource.close();
                        clearTimeout(fallbackTimeout);
                        
                        if (messageElement) {
                            finalizeStreamingMessage(messageElement, data.message, data.timestamp);
                        }
                        
                        resolve({
                            message: data.message,
                            actor: data.actor,
                            timestamp: data.timestamp
                        });
                        break;
                        
                    case 'error':
                        eventSource.close();
                        clearTimeout(fallbackTimeout);
                        
                        if (messageElement) {
                            showStreamingError(messageElement, data.error);
                        }
                        
                        reject(new Error(data.error));
                        break;
                }
            } catch (error) {
                console.error('Failed to parse SSE data:', error);
                eventSource.close();
                clearTimeout(fallbackTimeout);
                reject(error);
            }
        };

        eventSource.onerror = function(error) {
            console.error('SSE connection error:', error);
            eventSource.close();
            clearTimeout(fallbackTimeout);
            
            if (!hasStarted) {
                // 如果还没开始，尝试降级到模拟打字机效果
                console.log('SSE failed, falling back to simulated typing effect');
                sendMessage(message, actorId, history).then(async response => {
                    // 创建消息元素
                    const actorInfo = { id: actorId, name: response.actor.name, avatar: response.actor.avatar };
                    messageElement = createStreamingMessage(actorInfo);
                    elements.chatMessages.appendChild(messageElement);
                    scrollToBottom();
                    
                    // 模拟打字机效果
                    await simulateTypingEffect(response.message, messageElement);
                    
                    resolve(response);
                }).catch(reject);
            } else {
                if (messageElement) {
                    showStreamingError(messageElement, '连接中断，请重试');
                }
                reject(new Error('SSE connection failed'));
            }
        };
    });
}

// 创建流式消息元素
function createStreamingMessage(actor) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant streaming';
    messageElement.innerHTML = `
        <div class="message-content">
            <span class="typing-indicator">正在思考...</span>
        </div>
        <div class="message-time">${formatTime(new Date())}</div>
    `;
    return messageElement;
}

// 更新流式消息内容
function updateStreamingMessage(messageElement, content) {
    const contentElement = messageElement.querySelector('.message-content');
    contentElement.innerHTML = `<span class="streaming-text">${escapeHtml(content)}<span class="cursor">|</span></span>`;
}

// 完成流式消息
function finalizeStreamingMessage(messageElement, finalContent, timestamp) {
    messageElement.classList.remove('streaming');
    const contentElement = messageElement.querySelector('.message-content');
    const timeElement = messageElement.querySelector('.message-time');
    
    contentElement.innerHTML = escapeHtml(finalContent);
    timeElement.textContent = formatTime(new Date(timestamp));
}

// 显示流式错误
function showStreamingError(messageElement, errorMsg) {
    messageElement.classList.add('error');
    const contentElement = messageElement.querySelector('.message-content');
    contentElement.innerHTML = `<span class="error-text">❌ ${errorMsg}</span>`;
}

// 滚动到底部
function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// UI functions
function renderActors(actors) {
    elements.actorsGrid.innerHTML = '';
    
    actors.forEach(actor => {
        const actorCard = document.createElement('div');
        actorCard.className = 'actor-card';
        actorCard.innerHTML = `
            <div class="actor-avatar">${actor.avatar || '🎭'}</div>
            <h3>${actor.name}</h3>
            <p>${actor.description}</p>
        `;
        
        actorCard.addEventListener('click', () => selectActor(actor));
        elements.actorsGrid.appendChild(actorCard);
    });
}

function selectActor(actor) {
    currentActor = actor;
    elements.currentActorName.textContent = actor.name;
    
    // Update actor icon in header
    const actorIcon = document.querySelector('.actor-icon');
    if (actorIcon) {
        actorIcon.textContent = actor.avatar || '🎭';
    }
    
    hideElement(elements.actorSelection);
    showElement(elements.chatInterface);
    
    // Clear chat history when switching actors
    chatHistory = [];
    renderMessages();
    
    // Focus on input
    elements.messageInput.focus();
}

function renderMessages() {
    elements.chatMessages.innerHTML = '';
    
    if (chatHistory.length === 0) {
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'message assistant';
        welcomeMessage.innerHTML = `
            <div>你好！我是${currentActor.name}，很高兴与你聊天。有什么我可以帮助你的吗？</div>
            <div class="message-time">${formatTime(new Date())}</div>
        `;
        elements.chatMessages.appendChild(welcomeMessage);
    } else {
        chatHistory.forEach(chat => {
            // User message
            addUserMessage(chat.user);
            
            // Assistant message  
            addAssistantMessage(chat.assistant, chat.timestamp);
        });
    }
    
    // Scroll to bottom
    scrollToBottom();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCharCount() {
    const count = elements.messageInput.value.length;
    const charCountElement = document.querySelector('.char-count');
    charCountElement.textContent = `${count}/1000`;
    
    // Update send button state
    elements.sendButton.disabled = count === 0 || count > 1000;
}

// 添加用户消息到界面
function addUserMessage(message) {
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.innerHTML = `
        <div>${escapeHtml(message)}</div>
        <div class="message-time">${formatTime(new Date())}</div>
    `;
    elements.chatMessages.appendChild(userMessage);
    scrollToBottom();
}

// 添加助手消息到界面（非流式）
function addAssistantMessage(message, timestamp) {
    const assistantMessage = document.createElement('div');
    assistantMessage.className = 'message assistant';
    assistantMessage.innerHTML = `
        <div class="message-content">${escapeHtml(message)}</div>
        <div class="message-time">${formatTime(new Date(timestamp))}</div>
    `;
    elements.chatMessages.appendChild(assistantMessage);
    scrollToBottom();
}

async function handleSendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message || !currentActor) return;
    
    // 添加用户消息到界面
    addUserMessage(message);
    
    // Clear input and disable send button
    elements.messageInput.value = '';
    elements.sendButton.disabled = true;
    updateCharCount();
    
    try {
        let response;
        
        if (elements.streamingToggle.checked) {
            // 使用流式传输 - 不显示loading对话框
            response = await sendMessageStream(message, currentActor.id, chatHistory);
        } else {
            // 使用传统方式 - 显示loading对话框，然后打字机效果
            showLoading();
            response = await sendMessage(message, currentActor.id, chatHistory);
            
            // 创建消息元素并使用打字机效果
            const messageElement = document.createElement('div');
            messageElement.className = 'message assistant streaming';
            messageElement.innerHTML = `
                <div class="message-content">
                    <span class="typing-indicator">正在思考...</span>
                </div>
                <div class="message-time">${formatTime(new Date(response.timestamp))}</div>
            `;
            elements.chatMessages.appendChild(messageElement);
            scrollToBottom();
            
            // 隐藏loading，开始打字机效果
            hideLoading();
            await simulateTypingEffect(response.message, messageElement);
        }
        
        // 更新聊天历史
        chatHistory.push({
            user: message,
            assistant: response.message,
            timestamp: response.timestamp
        });
        
    } catch (error) {
        showError(error.message || '发送消息失败，请重试');
        
        // Restore user message in input
        elements.messageInput.value = message;
        updateCharCount();
    } finally {
        // 只在非流式模式下隐藏loading
        if (!elements.streamingToggle.checked) {
            hideLoading();
        }
        elements.messageInput.focus();
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!elements.sendButton.disabled) {
            handleSendMessage();
        }
    }
}

function goBackToSelection() {
    hideElement(elements.chatInterface);
    showElement(elements.actorSelection);
    currentActor = null;
}

function clearChatHistory() {
    if (confirm('确定要清空对话记录吗？')) {
        chatHistory = [];
        renderMessages();
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 120) + 'px';
}

// Event listeners
elements.sendButton.addEventListener('click', handleSendMessage);
elements.messageInput.addEventListener('keypress', handleKeyPress);
elements.messageInput.addEventListener('input', () => {
    updateCharCount();
    autoResizeTextarea();
});
elements.backButton.addEventListener('click', goBackToSelection);
elements.clearChat.addEventListener('click', clearChatHistory);
elements.streamingToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    console.log(`流式传输: ${isEnabled ? '已启用' : '已禁用'}`);
    
    // 可以在这里添加其他逻辑，比如保存用户偏好
    localStorage.setItem('streamingEnabled', isEnabled);
});

// Error message close button
elements.errorMessage.querySelector('.error-close').addEventListener('click', () => {
    hideElement(elements.errorMessage);
});

// Initialize app
async function initApp() {
    try {
        showLoading();
        const actors = await fetchActors();
        renderActors(actors);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Health check
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error('Server is not responding');
        }
    } catch (error) {
        showError('无法连接到服务器，请确保后端服务正在运行');
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    // 恢复用户偏好
    const streamingEnabled = localStorage.getItem('streamingEnabled');
    if (streamingEnabled !== null) {
        elements.streamingToggle.checked = streamingEnabled === 'true';
    }
    
    checkServerHealth();
    initApp();
    updateCharCount();
});
