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
const messageSoundsToggle = document.getElementById("message-sounds-toggle");

// State variables
let isListening = false;
let recognition = null;
let currentTheme = "dark";
let userData = {
  name: "User",
  avatar: "👤"
};

// Initialize the application
function initApp() {
  loadUserData();
  loadChatHistory();
  setupEventListeners();
  setupSpeechRecognition();
  applyTheme(currentTheme);
  
  // Show welcome message if no history
  if (chatMessages.children.length === 0) {
    setTimeout(() => {
      addMessage("Hello! I'm NeuraBot, your AI assistant. How can I help you today?", "bot");
    }, 1000);
  }
}

// Load user data from localStorage
function loadUserData() {
  const savedData = localStorage.getItem("neurabot_user");
  if (savedData) {
    userData = JSON.parse(savedData);
    document.getElementById("user-name").value = userData.name;
    
    // Set selected avatar
    document.querySelectorAll(".avatar").forEach(avatar => {
      if (avatar.dataset.avatar === userData.avatar) {
        avatar.classList.add("selected");
      }
    });
  }
}

// Save user data to localStorage
function saveUserData() {
  localStorage.setItem("neurabot_user", JSON.stringify(userData));
  showNotification("Profile saved successfully!");
}

// Load chat history from localStorage
function loadChatHistory() {
  const history = localStorage.getItem("neurabot_chat_history");
  if (history) {
    const messages = JSON.parse(history);
    messages.forEach(msg => {
      addMessage(msg.content, msg.sender, false, msg.timestamp);
    });
  }
}

// Save chat history to localStorage
function saveChatHistory() {
  const messages = [];
  document.querySelectorAll(".message").forEach(msgEl => {
    const sender = msgEl.classList.contains("user") ? "user" : "bot";
    const content = msgEl.querySelector(".message-content").textContent;
    const timestamp = msgEl.querySelector(".timestamp").textContent;
    messages.push({ sender, content, timestamp });
  });
  
  localStorage.setItem("neurabot_chat_history", JSON.stringify(messages));
}

// Clear chat history
function clearChatHistory() {
  if (confirm("Are you sure you want to clear the chat history?")) {
    chatMessages.innerHTML = "";
    localStorage.removeItem("neurabot_chat_history");
    showNotification("Chat history cleared");
    
    // Add new welcome message
    setTimeout(() => {
      addMessage("Hello! I'm NeuraBot, your AI assistant. How can I help you today?", "bot");
    }, 500);
  }
}

// Export chat as text file
function exportChat() {
  let chatText = "NeuraBot Conversation Export\n\n";
  document.querySelectorAll(".message").forEach(msgEl => {
    const sender = msgEl.classList.contains("user") ? "You" : "NeuraBot";
    const content = msgEl.querySelector(".message-content").textContent;
    const timestamp = msgEl.querySelector(".timestamp").textContent;
    chatText += `[${timestamp}] ${sender}: ${content}\n`;
  });
  
  const blob = new Blob([chatText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neurabot-chat-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification("Chat exported successfully!");
}

// Add message to chat
function addMessage(content, sender, saveToHistory = true, timestamp = null) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  
  // Combined message header with sender name, actions, and timestamp
  const messageHeader = document.createElement("div");
  messageHeader.classList.add("message-header");
  
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
  
  messageHeader.appendChild(senderName);
  messageHeader.appendChild(messageActions);
  messageHeader.appendChild(timeStamp);
  
  // Message content with markdown support
  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");
  messageContent.innerHTML = marked.parse(content);
  
  // Apply syntax highlighting to code blocks
  messageContent.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
  
  // Assemble message (removed separate footer)
  msgDiv.appendChild(messageHeader);
  msgDiv.appendChild(messageContent);
  
  chatMessages.appendChild(msgDiv);
  
  // Animate message entry
  setTimeout(() => {
    msgDiv.style.opacity = "1";
    msgDiv.style.transform = "translateY(0)";
  }, 10);
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Play sound if enabled
  if (localStorage.getItem("neurabot_sounds") !== "false") {
    playMessageSound(sender);
  }
  
  // Save to history if needed
  if (saveToHistory) {
    saveChatHistory();
  }
}
function saveChatHistory() {
  const messages = [];
  document.querySelectorAll(".message").forEach(msgEl => {
    const sender = msgEl.classList.contains("user") ? "user" : "bot";
    const content = msgEl.querySelector(".message-content").textContent;
    const timestamp = msgEl.querySelector(".timestamp").textContent;
    messages.push({ sender, content, timestamp });
  });
  
  localStorage.setItem("neurabot_chat_history", JSON.stringify(messages));
}

// Copy message to clipboard
function copyMessage(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification("Message copied to clipboard!");
  }).catch(err => {
    console.error("Failed to copy: ", err);
  });
}

// Play message sound
function playMessageSound(sender) {
  const audio = new Audio(
    sender === "user" ? 
    "https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3" :
    "https://assets.mixkit.co/sfx/preview/mixkit-happy-bell-alert-601.mp3"
  );
  audio.volume = 0.3;
  audio.play().catch(e => console.log("Audio play failed:", e));
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
}

// Toggle profile modal
function toggleProfileModal() {
  profileModal.classList.toggle("show");
}

// Setup event listeners
function setupEventListeners() {
  // Send message
  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
  
  // Voice input
  voiceInputBtn.addEventListener("click", toggleVoiceInput);
  
  // Sidebar
  menuBtn.addEventListener("click", toggleSidebar);
  closeSidebar.addEventListener("click", toggleSidebar);
  
  // Theme toggling
  themeToggle.addEventListener("click", () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });
  
  themeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.theme);
    });
  });
  
  // Chat management
  clearChatBtn.addEventListener("click", clearChatHistory);
  exportChatBtn.addEventListener("click", exportChat);
  
  // Profile modal
  userProfileBtn.addEventListener("click", toggleProfileModal);
  closeModalBtn.addEventListener("click", toggleProfileModal);
  saveProfileBtn.addEventListener("click", saveProfile);
  
  // Avatar selection
  document.querySelectorAll(".avatar").forEach(avatar => {
    avatar.addEventListener("click", () => {
      document.querySelectorAll(".avatar").forEach(a => a.classList.remove("selected"));
      avatar.classList.add("selected");
      userData.avatar = avatar.dataset.avatar;
    });
  });
  
  // Quick replies
  quickReplies.forEach(reply => {
    reply.addEventListener("click", () => {
      chatInput.value = reply.dataset.message;
      sendMessage();
    });
  });

  // Voice input toggle
  voiceInputToggle.addEventListener("change", (e) => {
    const enabled = e.target.checked;
    localStorage.setItem("neurabot_voice_input", enabled ? "true" : "false");
    voiceInputBtn.style.display = enabled ? "inline-flex" : "none";
  });

  // Message sounds toggle
  messageSoundsToggle.addEventListener("change", (e) => {
    const enabled = e.target.checked;
    localStorage.setItem("neurabot_sounds", enabled ? "true" : "false");
  });

  // Profile name input
  document.getElementById("user-name").addEventListener("input", (e) => {
    userData.name = e.target.value;
  });
}

// Save profile changes
function saveProfile() {
  userData.name = document.getElementById("user-name").value || "User";
  saveUserData();
  toggleProfileModal();
}

// Send message to backend
function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  chatInput.value = "";
  sendBtn.disabled = true;

  fetch("http://127.0.0.1:5000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
    .then(res => res.json())
    .then(data => {
      addMessage(data.reply, "bot");
    })
    .catch(err => {
      addMessage("Sorry, I couldn't connect to the AI backend.", "bot");
      console.error("Chat error:", err);
    })
    .finally(() => {
      sendBtn.disabled = false;
    });
}

// Load theme from localStorage
function loadTheme() {
  const savedTheme = localStorage.getItem("neurabot_theme");
  if (savedTheme) {
    applyTheme(savedTheme);
  }
}

// Load voice input and sounds settings
function loadSettings() {
  const voiceEnabled = localStorage.getItem("neurabot_voice_input");
  voiceInputToggle.checked = voiceEnabled !== "false";
  voiceInputBtn.style.display = voiceInputToggle.checked ? "inline-flex" : "none";

  const soundsEnabled = localStorage.getItem("neurabot_sounds");
  messageSoundsToggle.checked = soundsEnabled !== "false";
}

// App entry point
window.addEventListener("DOMContentLoaded", () => {
  initApp();
  loadTheme();
  loadSettings();
});
// Add typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.id = "typing-indicator";
    typingDiv.classList.add("message", "bot", "typing");
    typingDiv.innerHTML = `
        <div class="message-header">
            <span class="sender-name">NeuraBot</span>
        </div>
        <div class="typing-animation">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Modify sendMessage function
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    chatInput.value = "";
    sendBtn.disabled = true;
    
    // Show typing indicator
    showTypingIndicator();

    fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
        hideTypingIndicator();
        addMessage(data.reply, "bot");
    })
    .catch(err => {
        hideTypingIndicator();
        addMessage("Sorry, I couldn't connect to the AI backend.", "bot");
        console.error("Chat error:", err);
    })
    .finally(() => {
        sendBtn.disabled = false;
    });
}
