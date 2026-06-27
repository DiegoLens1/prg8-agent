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
  const isAi = role === "ai";

  const row = document.createElement("div");
  row.className = `chat ${isAi ? "chat-start" : "chat-end"}`;

  if (isAi) {
    const avatar = document.createElement("div");
    avatar.className = "chat-image avatar";
    avatar.innerHTML = `<div class="w-10 rounded-full bg-base-200 p-1"><img src="./loremaster.svg" alt="The Loremaster" /></div>`;
    row.appendChild(avatar);
  }

  const header = document.createElement("div");
  header.className = "chat-header text-xs opacity-60 mb-1";
  header.textContent = isAi ? "The Loremaster" : "Jij";

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${isAi ? "chat-bubble-secondary" : "chat-bubble-primary"} prose prose-sm max-w-none`;
  if (isAi) {
    bubble.innerHTML = micromark(text);
  } else {
    bubble.textContent = text;
  }

  row.appendChild(header);
  row.appendChild(bubble);
  chatContainer.appendChild(row);
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

    loadingIndicator.closest(".chat").remove();
    const bubble = appendMessage("ai", data.response.message);
    if (data.response.sources && data.response.sources.length > 0) {
      const sourceSmall = document.createElement("small");
      sourceSmall.className = "block mt-2 pt-2 border-t border-base-content/10 opacity-70 text-xs";
      sourceSmall.textContent = `Source: ${data.response.sources.join(", ")}`;
      bubble.appendChild(sourceSmall);
    }

    if (data.response.toolsUsed && data.response.toolsUsed.length > 0) {
      const toolSmall = document.createElement("small");
      toolSmall.className = "block mt-1 opacity-70 text-xs";
      toolSmall.textContent = `Tools: ${data.response.toolsUsed.join(", ")}`;
      bubble.appendChild(toolSmall);
    }
  } catch (error) {
    loadingIndicator.closest(".chat").remove();
    appendMessage("ai", "Er ging iets mis. Probeer het opnieuw.");
    console.error(error);
  }

  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
}
