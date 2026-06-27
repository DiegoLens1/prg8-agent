import { micromark } from 'https://esm.sh/micromark@3?bundle';

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let userid = localStorage.getItem('userid');
if (!userid) {
  userid = `loremaster-${crypto.randomUUID()}`;
  localStorage.setItem('userid', userid);
}

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

sendBtn.addEventListener('click', handleSend);

// Voeg een chatbericht toe
function appendMessage(role, text) {
  const bubble = document.createElement("div");
  if (role === "ai") {
    bubble.innerHTML = micromark("The Loremaster: " + text);
  } else {
    bubble.textContent = "Jij: " + text;
  }
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return bubble;
}

function handleSend() {
  const message = userInput.value.trim();
  if (!message) return;
  userInput.value = "";
  sendMessage(message);
}

async function sendMessage(message) {
  appendMessage("user", message);

  sendBtn.disabled = true;
  sendBtn.textContent = "...";

  const loadingIndicator = appendMessage("ai", "Even nadenken...");

  try {
    const response = await fetch('api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userid }),
    });

    const data = await response.json();
    
    loadingIndicator.remove();
    const bubble = appendMessage("ai", data.response.message);
    if (data.response.sources && data.response.sources.length > 0) {
      const sourceSmall = document.createElement("small");
      sourceSmall.textContent = `Source: ${data.response.sources.join(", ")}`;
      bubble.appendChild(sourceSmall);
    }

    if (data.response.toolsUsed && data.response.toolsUsed.length > 0) {
      const toolSmall = document.createElement("small");
      toolSmall.textContent = `Tools: ${data.response.toolsUsed.join(", ")}`;
      bubble.appendChild(toolSmall);
    }
  } catch (error) {
    loadingIndicator.remove();
    appendMessage("ai", "Er ging iets mis. Probeer het opnieuw.");
    console.error(error);
  }

  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
}
