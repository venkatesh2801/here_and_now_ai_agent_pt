const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");
const typingIndicator = document.getElementById("typing-indicator");

// Initialize particles.js background with error handling
function initParticles() {
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: { value: 40, density: { enable: true, value_area: 800 } },
        color: { value: "#8a63d2" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#6441a5",
          opacity: 0.4,
          width: 1
        },
        move: {
          enable: true,
          speed: 1,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          bounce: false
        }
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: true, mode: "push" },
          resize: true
        }
      },
      retina_detect: true
    });
  } else {
    console.warn("Particles.js not loaded - using fallback background");
    document.getElementById('particles-js').style.background = "radial-gradient(circle, #0a0a18 0%, #1a0933 100%)";
  }
}

// Add message with animation
function addMessage(content, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.textContent = content;
  
  // Add timestamp
  const timestamp = document.createElement("div");
  timestamp.classList.add("timestamp");
  timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  msgDiv.appendChild(timestamp);
  
  chatMessages.appendChild(msgDiv);
  
  // Animate message entry
  setTimeout(() => {
    msgDiv.style.opacity = "1";
    msgDiv.style.transform = "translateY(0)";
  }, 10);
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show/hide typing indicator
function setTypingIndicator(visible) {
  if (visible) {
    typingIndicator.classList.add('active');
  } else {
    typingIndicator.classList.remove('active');
  }
}

// Send message
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  chatInput.value = "";
  
  // Add slight delay before showing typing indicator
  setTimeout(() => {
    setTypingIndicator(true);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 300);

  try {
    const res = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    setTypingIndicator(false);
    addMessage(data.reply, "bot");
  } catch (err) {
    setTypingIndicator(false);
    addMessage("Sorry, I'm having trouble connecting right now. Please try again.", "bot");
    console.error(err);
  }
}

// Input animation
chatInput.addEventListener('focus', () => {
  document.getElementById('chat-input-container').classList.add('active');
});

chatInput.addEventListener('blur', () => {
  document.getElementById('chat-input-container').classList.remove('active');
});

// Event listeners
sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initParticles();
  
  // Initial greeting after a short delay
  setTimeout(() => {
    addMessage("Hello! I'm NeuraBot, your AI assistant. How can I help you today?", "bot");
  }, 1000);
});