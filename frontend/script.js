// DOM Elements
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");
const voiceInputBtn = document.getElementById("voice-input-btn");
const menuBtn = document.getElementById("menu-btn");
const closeSidebar = document.getElementById("close-sidebar");
const sidebar = document.getElementById("sidebar");
const themeToggle = document.getElementById("theme-toggle");
const themeButtons = document.querySelectorAll(".theme-btn");
const clearChatBtn = document.getElementById("clear-chat");
const exportChatBtn = document.getElementById("export-chat");
const userProfileBtn = document.getElementById("user-profile");
const profileModal = document.getElementById("profile-modal");
const closeModalBtn = document.querySelector(".close-modal");
const saveProfileBtn = document.getElementById("save-profile");
const quickReplies = document.querySelectorAll(".quick-reply");
const voiceInputToggle = document.getElementById("voice-input-toggle");
const currentAvatar = document.getElementById("current-avatar");
const newChatBtn = document.getElementById("new-chat-btn");
const chatHistoryList = document.getElementById("chat-history-list");
const clearAllChatsBtn = document.getElementById("clear-all-chats");
const chatWrapper = document.getElementById("chat-wrapper");
const fileBtn = document.getElementById("file-btn");
const fileInput = document.getElementById("file-input");
const chatModeSelect = document.getElementById("chat-mode");
let tasks = JSON.parse(localStorage.getItem("neurabot_tasks") || "[]");





// State variables
let isListening = false;
let recognition = null;
let currentTheme = "dark";
let currentChatId = null;
let chatSessions = {};
let userData = {
  name: "User",
  avatarType: "male"
};

// Initialize the application
function initApp() {
  loadUserData();
  loadChatSessions();
  setupEventListeners();
  setupSpeechRecognition();
  applyTheme(currentTheme);
  
  // Show welcome message if no history
  if (Object.keys(chatSessions).length === 0) {
    createNewChat();
  } else {
    // Load the most recent chat
    const chatIds = Object.keys(chatSessions);
    currentChatId = chatIds[chatIds.length - 1];
    loadChat(currentChatId);
  }
}

function loadChatSessions() {
  const savedSessions = localStorage.getItem("neurabot_chat_sessions");
  if (savedSessions) {
    chatSessions = JSON.parse(savedSessions);
    renderChatHistoryList();
  }
}

function saveChatSessions() {
  localStorage.setItem("neurabot_chat_sessions", JSON.stringify(chatSessions));
}

// Create a new chat session
function createNewChat() {
  const chatId = Date.now().toString();
  currentChatId = chatId;
  
  chatSessions[chatId] = {
    id: chatId,
    title: "New Chat",
    messages: [],
    createdAt: new Date().toISOString()
  };
  
  saveChatSessions();
  renderChatHistoryList();
  
  // Clear the chat messages container
  chatMessages.innerHTML = "";
  
  // Show welcome message
  setTimeout(() => {
    addMessage("Hello! I'm NeuraBot, your AI assistant. How can I help you today?", "bot");
  }, 500);
  
  return chatId;
}

function loadChat(chatId) {
  if (!chatSessions[chatId]) return;
  
  currentChatId = chatId;
  
  // Clear the chat messages container
  chatMessages.innerHTML = "";
  
  // Load messages for this chat
  chatSessions[chatId].messages.forEach(msg => {
    addMessage(msg.content, msg.sender, false, msg.timestamp);
  });
  
  // Update active state in history list
  document.querySelectorAll('.chat-history-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.chatId === chatId) {
      item.classList.add('active');
    }
  });
  
  // Close sidebar on mobile
  if (window.innerWidth < 768) {
    toggleSidebar();
  }
}

function renderChatHistoryList() {
  chatHistoryList.innerHTML = '';
  
  if (Object.keys(chatSessions).length === 0) {
    chatHistoryList.innerHTML = '<div class="empty-history">No chat history yet</div>';
    return;
  }
  
  // Sort chats by date (newest first)
  const sortedChats = Object.values(chatSessions).sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  sortedChats.forEach(chat => {
    const historyItem = document.createElement('div');
    historyItem.classList.add('chat-history-item');
    if (chat.id === currentChatId) {
      historyItem.classList.add('active');
    }
    historyItem.dataset.chatId = chat.id;
    
    historyItem.innerHTML = `
      <div class="chat-title" title="${chat.title}">${chat.title}</div>
      <div class="chat-actions">
        <button class="chat-action-btn delete-chat" title="Delete chat">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    historyItem.addEventListener('click', (e) => {
      if (!e.target.closest('.chat-actions')) {
        loadChat(chat.id);
      }
    });
    
    const deleteBtn = historyItem.querySelector('.delete-chat');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });
    
    chatHistoryList.appendChild(historyItem);
  });
}

// Delete a chat session
function deleteChat(chatId) {
  showConfirm("Are you sure you want to delete this chat?", (confirmed) => {
    if (confirmed) {
      delete chatSessions[chatId];
      saveChatSessions();
      
      if (currentChatId === chatId) {
        if (Object.keys(chatSessions).length > 0) {
          const chatIds = Object.keys(chatSessions);
          currentChatId = chatIds[chatIds.length - 1];
          loadChat(currentChatId);
        } else {
          createNewChat();
        }
      }
      
      renderChatHistoryList();
      showNotification("Chat deleted");
    }
  });
}


function clearAllChats() {
  showConfirm("Are you sure you want to clear ALL chat history?", (confirmed) => {
    if (confirmed) {
      chatSessions = {};
      saveChatSessions();
      createNewChat();
      renderChatHistoryList();
      showNotification("All chat history cleared");
    }
  });
}


// Load user data from localStorage
function loadUserData() {
  const savedData = localStorage.getItem("neurabot_user");
  if (savedData) {
    userData = JSON.parse(savedData);
    document.getElementById("user-name").value = userData.name;
    
    // Set selected avatar
    document.querySelectorAll(".avatar").forEach(avatar => {
      if (avatar.dataset.avatar === userData.avatarType) {
        avatar.classList.add("selected");
      }
    });
    
    // Update current avatar in header
    updateCurrentAvatar();
  }
}

// Update the current avatar display
function updateCurrentAvatar() {
  const avatarType = userData.avatarType;
  let svgContent = '';
  
  switch(avatarType) {
    case 'male':
      svgContent = '<circle cx="50" cy="35" r="20" fill="#4a8cff"/><rect x="40" y="55" width="20" height="35" fill="#4a8cff"/><rect x="30" y="65" width="10" height="25" fill="#4a8cff"/><rect x="60" y="65" width="10" height="25" fill="#4a8cff"/>';
      break;
    case 'female':
      svgContent = '<circle cx="50" cy="35" r="20" fill="#ff6b8b"/><path d="M40,55 L60,55 L50,90 Z" fill="#ff6b8b"/><rect x="30" y="65" width="10" height="25" fill="#ff6b8b"/><rect x="60" y="65" width="10" height="25" fill="#ff6b8b"/>';
      break;
    case 'robot':
      svgContent = '<rect x="30" y="25" width="40" height="45" rx="5" fill="#7e57c2"/><circle cx="40" cy="40" r="5" fill="#fff"/><circle cx="60" cy="40" r="5" fill="#fff"/><rect x="40" y="55" width="20" height="10" rx="2" fill="#fff"/><rect x="20" y="70" width="20" height="25" rx="5" fill="#7e57c2"/><rect x="60" y="70" width="20" height="25" rx="5" fill="#7e57c2"/>';
      break;
    case 'ai':
      svgContent = '<circle cx="50" cy="50" r="40" fill="#26c6da"/><path d="M35,40 L45,60 L30,60 Z" fill="#fff"/><path d="M65,40 L75,60 L60,60 Z" fill="#fff"/><path d="M45,70 L55,70 L50,80 Z" fill="#fff"/>';
      break;
    case 'cyber':
      svgContent = '<rect x="25" y="25" width="50" height="50" rx="5" fill="#ff7043"/><circle cx="40" cy="40" r="5" fill="#fff"/><circle cx="60" cy="40" r="5" fill="#fff"/><rect x="40" y="55" width="20" height="10" rx="2" fill="#fff"/><line x1="30" y1="70" x2="70" y2="70" stroke="#fff" stroke-width="3"/>';
      break;
    case 'astro':
      svgContent = '<circle cx="50" cy="40" r="25" fill="#bdbdbd"/><circle cx="50" cy="40" r="15" fill="#fff"/><rect x="40" y="65" width="20" height="25" fill="#bdbdbd"/><rect x="30" y="75" width="10" height="15" fill="#bdbdbd"/><rect x="60" y="75" width="10" height="15" fill="#bdbdbd"/>';
      break;
  }
  
  currentAvatar.innerHTML = svgContent;
}

// Save user data to localStorage
function saveUserData() {
  localStorage.setItem("neurabot_user", JSON.stringify(userData));
  showNotification("Profile saved successfully!");
}

// Add message to chat
function addMessage(content, sender, saveToHistory = true, timestamp = null) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  
  // Combined message header with sender name, actions, and timestamp
  const messageHeader = document.createElement("div");
  messageHeader.classList.add("message-header");
  
  // Add sender avatar
  const senderAvatar = document.createElement("div");
  senderAvatar.classList.add("sender-avatar");
  
  let avatarSvg = '';
  if (sender === "user") {
    // Use the user's selected avatar
    switch(userData.avatarType) {
      case 'male':
        avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="35" r="20" fill="#4a8cff"/><rect x="40" y="55" width="20" height="35" fill="#4a8cff"/><rect x="30" y="65" width="10" height="25" fill="#4a8cff"/><rect x="60" y="65" width="10" height="25" fill="#4a8cff"/></svg>';
        break;
      case 'female':
        avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="35" r="20" fill="#ff6b8b"/><path d="M40,55 L60,55 L50,90 Z" fill="#ff6b8b"/><rect x="30" y="65" width="10" height="25" fill="#ff6b8b"/><rect x="60" y="65" width="10" height="25" fill="#ff6b8b"/></svg>';
        break;
      case 'robot':
        avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><rect x="30" y="25" width="40" height="45" rx="5" fill="#7e57c2"/><circle cx="40" cy="40" r="5" fill="#fff"/><circle cx="60" cy="40" r="5" fill="#fff"/><rect x="40" y="55" width="20" height="10" rx="2" fill="#fff"/><rect x="20" y="70" width="20" height="25" rx="5" fill="#7e57c2"/><rect x="60" y="70" width="20" height="25" rx="5" fill="#7e57c2"/></svg>';
        break;
      case 'ai':
        avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="50" r="40" fill="#26c6da"/><path d="M35,40 L45,60 L30,60 Z" fill="#fff"/><path d="M65,40 L75,60 L60,60 Z" fill="#fff"/><path d="M45,70 L55,70 L50,80 Z" fill="#fff"/></svg>';
        break;
      case 'cyber':
        avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><rect x="25" y="25" width="50" height="50" rx="5" fill="#ff7043"/><circle cx="40" cy="40" r="5" fill="#fff"/><circle cx="60" cy="40" r="5" fill="#fff"/><rect x="40" y="55" width="20" height="10" rx="2" fill="#fff"/><line x1="30" y1="70" x2="70" y2="70" stroke="#fff" stroke-width="3"/></svg>';
        break;
      case 'astro':
        avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="40" r="25" fill="#bdbdbd"/><circle cx="50" cy="40" r="15" fill="#fff"/><rect x="40" y="65" width="20" height="25" fill="#bdbdbd"/><rect x="30" y="75" width="10" height="15" fill="#bdbdbd"/><rect x="60" y="75" width="10" height="15" fill="#bdbdbd"/></svg>';
        break;
    }
  } else {
    // Bot avatar
    avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="50" r="40" fill="#7e57c2"/><circle cx="40" cy="40" r="5" fill="#fff"/><circle cx="60" cy="40" r="5" fill="#fff"/><path d="M35,65 L65,65 L65,70 L35,70 Z" fill="#fff"/></svg>';
  }
  
  senderAvatar.innerHTML = avatarSvg;
  
  const senderName = document.createElement("span");
  senderName.classList.add("sender-name");
  senderName.textContent = sender === "user" ? userData.name : "NeuraBot";
  
  const messageActions = document.createElement("div");
  messageActions.classList.add("message-actions");
  
  const copyBtn = document.createElement("button");
  copyBtn.classList.add("message-action");
  copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
  copyBtn.title = "Copy message";
  copyBtn.addEventListener("click", () => copyMessage(content));
  
  messageActions.appendChild(copyBtn);
  
  // Add timestamp to header
  const timeStamp = document.createElement("span");
  timeStamp.classList.add("timestamp");
  timeStamp.textContent = timestamp || new Date().toLocaleTimeString([], { 
    hour: '2-digit', minute: '2-digit' 
  });
  
  messageHeader.appendChild(senderAvatar);
  messageHeader.appendChild(senderName);
  messageHeader.appendChild(messageActions);
  messageHeader.appendChild(timeStamp);
  if (sender === "bot") {
    const speakBtn = document.createElement("button");
    speakBtn.classList.add("speak-btn");
    speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    speakBtn.title = "Read aloud";

    let isSpeaking = false;
    let utterance = null;

    speakBtn.addEventListener("click", () => {
      if (!('speechSynthesis' in window)) {
        showNotification("Speech synthesis not supported in this browser");
        return;
      }

      if (!isSpeaking) {
        // Start speaking
        utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => {
          isSpeaking = false;
          speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
          speakBtn.title = "Read aloud";
        };

        window.speechSynthesis.speak(utterance);
        isSpeaking = true;
        speakBtn.innerHTML = '<i class="fas fa-stop"></i>';
        speakBtn.title = "Stop audio";
      } else {
        // Stop speaking
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        speakBtn.title = "Read aloud";
      }
    });

    messageHeader.appendChild(speakBtn);
  }

  
  // Message content with markdown support
  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");
  messageContent.innerHTML = marked.parse(content);
  
  // Apply syntax highlighting to code blocks
  messageContent.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
  
  // Assemble message
  msgDiv.appendChild(messageHeader);
  msgDiv.appendChild(messageContent);
  
  chatMessages.appendChild(msgDiv);
  
  // Animate message entry
  setTimeout(() => {
    msgDiv.style.opacity = "1";
    msgDiv.style.transform = "translateY(0)";
  }, 10);
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Save to history if needed
  if (saveToHistory && currentChatId) {
    // Add message to current chat session
    if (!chatSessions[currentChatId].messages) {
      chatSessions[currentChatId].messages = [];
    }
    
    chatSessions[currentChatId].messages.push({
      content,
      sender,
      timestamp: timestamp || new Date().toLocaleTimeString([], { 
        hour: '2-digit', minute: '2-digit' 
      })
    });
    
    // Update chat title if it's the first user message
    if (sender === "user" && chatSessions[currentChatId].title === "New Chat") {
      // Use first user message as title (max 30 chars)
      const title = content.length > 30 ? content.substring(0, 30) + "..." : content;
      chatSessions[currentChatId].title = title;
      renderChatHistoryList();
    }
    

    
    saveChatSessions();
  }
}

// Update avatars in all existing messages
function updateAllMessageAvatars() {
  const userMessages = document.querySelectorAll('.message.user');
  
  userMessages.forEach(message => {
    const avatarContainer = message.querySelector('.sender-avatar');
    if (avatarContainer) {
      let avatarSvg = '';
      switch(userData.avatarType) {
        case 'male':
          avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="35" r="20" fill="#4a8cff"/><rect x="40" y="55" width="20" height="35" fill="#4a8cff"/><rect x="30" y="65" width="10" height="25" fill="#4a8cff"/><rect x="60" y="65" width="10" height="25" fill="#4a8cff"/></svg>';
          break;
        case 'female':
          avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="35" r="20" fill="#ff6b8b"/><path d="M40,55 L60,55 L50,90 Z" fill="#ff6b8b"/><rect x="30" y="65" width="10" height="25" fill="#ff6b8b"/><rect x="60" y="65" width="10" height="25" fill="#ff6b8b"/></svg>';
          break;
        case 'robot':
          avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><rect x="30" y="25" width="40" height="45" rx="5" fill="#7e57c2"/><circle cx="40" cy="40" r="5" fill="#fff"/><circle cx="60" cy="40" r="5" fill="#fff"/><rect x="40" y="55" width="20" height="10" rx="2" fill="#fff"/><rect x="20" y="70" width="20" height="25" rx="5" fill="#7e57c2"/><rect x="60" y="70" width="20" height="25" rx="5" fill="#7e57c2"/></svg>';
          break;
        case 'ai':
          avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="50" r="40" fill="#26c6da"/><path d="M35,40 L45,60 L30,60 Z" fill="#fff"/><path d="M65,40 L75,60 L60,60 Z" fill="#fff"/><path d="M45,70 L55,70 L50,80 Z" fill="#fff"/></svg>';
          break;
        case 'cyber':
          avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><rect x="25" y="25" width="50" height="50" rx="5" fill="#ff7043"/><circle cx="40" cy="40" r="5" fill="#fff"/><circle cx="60" cy="40" r="5" fill="#fff"/><rect x="40" y="55" width="20" height="10" rx="2" fill="#fff"/><line x1="30" y1="70" x2="70" y2="70" stroke="#fff" stroke-width="3"/></svg>';
          break;
        case 'astro':
          avatarSvg = '<svg viewBox="0 0 100 100" width="28" height="28"><circle cx="50" cy="40" r="25" fill="#bdbdbd"/><circle cx="50" cy="40" r="15" fill="#fff"/><rect x="40" y="65" width="20" height="25" fill="#bdbdbd"/><rect x="30" y="75" width="10" height="15" fill="#bdbdbd"/><rect x="60" y="75" width="10" height="15" fill="#bdbdbd"/></svg>';
          break;
      }
      avatarContainer.innerHTML = avatarSvg;
    }
    
    // Also update the sender name if it changed
    const senderName = message.querySelector('.sender-name');
    if (senderName && userData.name) {
      senderName.textContent = userData.name;
    }
  });
}

// Copy message to clipboard
function copyMessage(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification("Message copied to clipboard!");
  }).catch(err => {
    console.error("Failed to copy: ", err);
  });
}

// Show notification
function showNotification(message, duration = 3000) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.classList.add("show");
  
  setTimeout(() => {
    notification.classList.remove("show");
  }, duration);
}

// Setup speech recognition
function setupSpeechRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      stopVoiceInput();
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      stopVoiceInput();
      showNotification("Voice input failed: " + event.error, 5000);
    };
    
    recognition.onend = () => {
      stopVoiceInput();
    };
  } else {
    voiceInputBtn.style.display = "none";
    voiceInputToggle.parentElement.style.display = "none";
    console.warn("Speech recognition not supported in this browser");
  }
}

// Start voice input
function startVoiceInput() {
  if (recognition) {
    recognition.start();
    isListening = true;
    document.body.classList.add("listening");
    voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    showNotification("Listening... Speak now");
  }
}

// Stop voice input
function stopVoiceInput() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
    document.body.classList.remove("listening");
    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
  }
}

// Toggle voice input
function toggleVoiceInput() {
  if (isListening) {
    stopVoiceInput();
  } else {
    startVoiceInput();
  }
}

// Apply theme
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("neurabot_theme", theme);
  
  // Update theme toggle icon
  const isDark = theme === "dark" || theme === "purple";
  themeToggle.innerHTML = isDark ? 
    '<i class="fas fa-moon"></i>' : 
    '<i class="fas fa-sun"></i>';
  
  // Update active theme button
  themeButtons.forEach(btn => {
    if (btn.dataset.theme === theme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Toggle sidebar
function toggleSidebar() {
  sidebar.classList.toggle("show");
  chatWrapper.classList.toggle("sidebar-open");
  
  // On mobile, add overlay when sidebar is open
  if (window.innerWidth < 768) {
    if (sidebar.classList.contains("show")) {
      // Create overlay
      const overlay = document.createElement("div");
      overlay.id = "sidebar-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      overlay.style.zIndex = "999";
      overlay.addEventListener("click", toggleSidebar);
      document.body.appendChild(overlay);
    } else {
      // Remove overlay
      const overlay = document.getElementById("sidebar-overlay");
      if (overlay) {
        document.body.removeChild(overlay);
      }
    }
  }
}

// Toggle profile modal
function toggleProfileModal() {
  profileModal.classList.toggle("show");
}

// Save profile changes
function saveProfile() {
  userData.name = document.getElementById("user-name").value || "User";
  
  // Update current avatar in header
  updateCurrentAvatar();
  
  // Update all existing user messages with new avatar
  updateAllMessageAvatars();
  
  saveUserData();
  toggleProfileModal();
}

// Clear current chat
function clearCurrentChat() {
  showConfirm("Are you sure you want to clear the current chat?", (confirmed) => {
    if (confirmed) {
      chatMessages.innerHTML = "";
      if (currentChatId && chatSessions[currentChatId]) {
        chatSessions[currentChatId].messages = [];
        saveChatSessions();
      }
      showNotification("Chat cleared");
    }
  });
}


// Export chat
function exportChat() {
  if (!currentChatId || !chatSessions[currentChatId]) {
    showNotification("No chat to export");
    return;
  }
  
  const chat = chatSessions[currentChatId];
  let exportText = `NeuraBot Chat Export - ${new Date(chat.createdAt).toLocaleDateString()}\n\n`;
  
  chat.messages.forEach(msg => {
    const sender = msg.sender === "user" ? userData.name : "NeuraBot";
    exportText += `${sender} (${msg.timestamp}):\n${msg.content}\n\n`;
  });
  
  const blob = new Blob([exportText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neurabot-chat-${currentChatId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification("Chat exported successfully");
}
// ------------------------------
// Typing Indicator Helpers
// ------------------------------
let typingIndicator = null;

function addTypingIndicator() {
  if (typingIndicator) return; // already showing

  typingIndicator = document.createElement("div");
  typingIndicator.classList.add("message", "bot-message", "typing-indicator");

  typingIndicator.innerHTML = `
    <div class="message-header">
      <span class="sender">Bot is thinking...</span>
    </div>
    <div class="dots">
      <span></span><span></span><span></span>
    </div>
  `;

  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  if (typingIndicator) {
    typingIndicator.remove();
    typingIndicator = null;
  }
}
function renderTasks() {
  const taskList = document.getElementById("task-list");
  if (!taskList) return;

  taskList.innerHTML = tasks
    .map(
      (t, i) => `
      <li class="task-item">
        <label>
          <input type="checkbox" ${t.done ? "checked" : ""} data-index="${i}" class="task-checkbox">
          <span class="task-text ${t.done ? "done" : ""}">${t.text}</span>
        </label>
        <button class="delete-task" data-index="${i}"><i class="fas fa-trash"></i></button>
      </li>`
    )
    .join("");
}


document.getElementById("task-list").addEventListener("click", (e) => {
  const index = e.target.dataset.index;

  // Checkbox toggle
  if (e.target.classList.contains("task-checkbox")) {
    tasks[index].done = e.target.checked;
    localStorage.setItem("neurabot_tasks", JSON.stringify(tasks));
    renderTasks();
  }

  // Delete task
  if (e.target.classList.contains("delete-task") || e.target.closest(".delete-task")) {
    const idx = e.target.dataset.index || e.target.closest(".delete-task").dataset.index;
    tasks.splice(idx, 1);
    localStorage.setItem("neurabot_tasks", JSON.stringify(tasks));
    renderTasks();
  }
});


function addTask(text) {
  tasks.push({ text, done: false });
  localStorage.setItem("neurabot_tasks", JSON.stringify(tasks));
  renderTasks();
}


// Setup event listeners
function setupEventListeners() {
  // Send message on button click
  sendBtn.addEventListener("click", async () => {
  const message = chatInput.value.trim();
  if (message) {
    addMessage(message, "user");
    chatInput.value = "";
    addTypingIndicator();
    try {
      // Call Flask backend
      const res = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode: chatModeSelect.value })
      });

      const data = await res.json();
      removeTypingIndicator();
      addMessage(data.reply, "bot");
      // If backend returned a task, add it to sidebar
      if (data.task) {
        addTask(data.task);
      }

      // If backend requested showing tasks, list them
      if (data.show_tasks) {
        if (tasks.length === 0) {
          addMessage("✅ You have no pending tasks!", "bot");
        } else {
          const taskList = tasks
            .map((t, i) => `${i + 1}. ${t.text} ${t.done ? "✔️" : "❌"}`)
            .join("\n");
          addMessage("📋 Your tasks:\n" + taskList, "bot");
        }
      }



    } catch (err) {
      console.error("Error talking to backend:", err);
      removeTypingIndicator();
      addMessage("⚠️ Oops! Could not connect to server.", "bot");
    }
  }
});
  renderTasks();

  // Send message on Enter key
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });
  
  // Voice input button
  voiceInputBtn.addEventListener("click", toggleVoiceInput);

  fileBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    addMessage(`📎 Uploaded file: **${file.name}**`, "user");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      addMessage(`✅ File processed: ${data.filename}`, "bot");
    } catch (err) {
      console.error("File upload error:", err);
      addMessage("⚠️ Failed to upload file.", "bot");
    }

    fileInput.value = ""; // reset
  });
  
  // Toggle sidebar
  menuBtn.addEventListener("click", toggleSidebar);
  closeSidebar.addEventListener("click", toggleSidebar);
  
  // Theme toggle
  themeToggle.addEventListener("click", () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });
  
  // Theme buttons
  themeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.theme);
    });
  });
  
  // Clear chat button
  clearChatBtn.addEventListener("click", clearCurrentChat);
  
  // Clear all chats button
  clearAllChatsBtn.addEventListener("click", clearAllChats);
  
  // Export chat button
  exportChatBtn.addEventListener("click", exportChat);
  
  // User profile button
  userProfileBtn.addEventListener("click", toggleProfileModal);
  
  // Close modal button
  closeModalBtn.addEventListener("click", toggleProfileModal);
  
  // Save profile button
  saveProfileBtn.addEventListener("click", saveProfile);
  
  // Avatar selection
  document.querySelectorAll(".avatar").forEach(avatar => {
    avatar.addEventListener("click", () => {
      document.querySelectorAll(".avatar").forEach(a => a.classList.remove("selected"));
      avatar.classList.add("selected");
      userData.avatarType = avatar.dataset.avatar;
    });
  });
  
  // Quick replies
  quickReplies.forEach(btn => {
    btn.addEventListener("click", () => {
      const message = btn.dataset.message;
      chatInput.value = message;
      sendBtn.click();
    });
  });
  
  // Voice input toggle in settings
  voiceInputToggle.addEventListener("change", () => {
    if (voiceInputToggle.checked) {
      voiceInputBtn.style.display = "flex";
    } else {
      voiceInputBtn.style.display = "none";
      if (isListening) stopVoiceInput();
    }
  });
  
  // New chat button
  newChatBtn.addEventListener("click", () => {
    createNewChat();
  });
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth < 768 && 
        sidebar.classList.contains("show") && 
        !sidebar.contains(e.target) && 
        !menuBtn.contains(e.target)) {
      toggleSidebar();
    }
  });
  
  // Load saved theme
  const savedTheme = localStorage.getItem("neurabot_theme");
  if (savedTheme) {
    applyTheme(savedTheme);
  }
  
  // Load voice input preference
  const voiceInputEnabled = localStorage.getItem("neurabot_voice_input") === "true";
  voiceInputToggle.checked = voiceInputEnabled;
  voiceInputBtn.style.display = voiceInputEnabled ? "flex" : "none";
  
  voiceInputToggle.addEventListener("change", () => {
    localStorage.setItem("neurabot_voice_input", voiceInputToggle.checked);
  });
}
function showConfirm(message, callback) {
  const modal = document.getElementById("confirm-modal");
  const msg = document.getElementById("confirm-message");
  const okBtn = document.getElementById("confirm-ok");
  const cancelBtn = document.getElementById("confirm-cancel");

  msg.textContent = message;
  modal.classList.add("show");

  const closeModal = () => {
    modal.classList.remove("show");
    okBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onCancel);
  };

  const onOk = () => { closeModal(); callback(true); };
  const onCancel = () => { closeModal(); callback(false); };

  okBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onCancel);
}
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported in this browser");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";   // you can change to "en-GB", "hi-IN", etc.
  utterance.rate = 1;         // speed (0.5 = slow, 1 = normal, 1.5 = fast)
  utterance.pitch = 1;        // tone (0 = low, 2 = high)

  window.speechSynthesis.cancel(); // stop any ongoing speech
  window.speechSynthesis.speak(utterance);
}
// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);