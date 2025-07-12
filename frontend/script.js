// Configuration
const API_BASE_URL = 'http://localhost:3001/api';

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
    errorMessage: document.getElementById('errorMessage')
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

// UI functions
function renderActors(actors) {
    elements.actorsGrid.innerHTML = '';
    
    actors.forEach(actor => {
        const actorCard = document.createElement('div');
        actorCard.className = 'actor-card';
        actorCard.innerHTML = `
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
            const userMessage = document.createElement('div');
            userMessage.className = 'message user';
            userMessage.innerHTML = `
                <div>${escapeHtml(chat.user)}</div>
                <div class="message-time">${chat.timestamp ? formatTime(new Date(chat.timestamp)) : ''}</div>
            `;
            elements.chatMessages.appendChild(userMessage);
            
            // Assistant message
            const assistantMessage = document.createElement('div');
            assistantMessage.className = 'message assistant';
            assistantMessage.innerHTML = `
                <div>${escapeHtml(chat.assistant)}</div>
                <div class="message-time">${chat.timestamp ? formatTime(new Date(chat.timestamp)) : ''}</div>
            `;
            elements.chatMessages.appendChild(assistantMessage);
        });
    }
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addMessage(userMessage, assistantMessage, timestamp) {
    chatHistory.push({
        user: userMessage,
        assistant: assistantMessage,
        timestamp: timestamp
    });
    renderMessages();
}

function updateCharCount() {
    const count = elements.messageInput.value.length;
    const charCountElement = document.querySelector('.char-count');
    charCountElement.textContent = `${count}/1000`;
    
    // Update send button state
    elements.sendButton.disabled = count === 0 || count > 1000;
}

async function handleSendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message || !currentActor) return;
    
    // Clear input and disable send button
    elements.messageInput.value = '';
    elements.sendButton.disabled = true;
    updateCharCount();
    
    try {
        showLoading();
        
        const response = await sendMessage(message, currentActor.id, chatHistory);
        
        addMessage(message, response.message, response.timestamp);
        
    } catch (error) {
        showError(error.message || '发送消息失败，请重试');
        
        // Restore user message in input
        elements.messageInput.value = message;
        updateCharCount();
    } finally {
        hideLoading();
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
    checkServerHealth();
    initApp();
    updateCharCount();
});
