/**
 * script.js - Chatbot Frontend Handler
 */

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitBtn = chatForm.querySelector('button');

// Maintains the state of the conversation for the backend API
let conversationHistory = [];

/**
 * Helper untuk membersihkan HTML dan mengubah format **teks** menjadi bold
 * @param {string} text 
 * @returns {string}
 */
function formatText(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  return escaped.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Appends a message to the chat box DOM.
 * @param {string} role - 'user' or 'model'
 * @param {string} text - The message content
 * @returns {HTMLElement} The created message element
 */
function appendMessage(role, text) {
  const messageDiv = document.createElement('div');
  // You can style these classes in your CSS
  messageDiv.classList.add('message', role);
  messageDiv.innerHTML = formatText(text);
  
  chatBox.appendChild(messageDiv);
  
  // Keep the chat box scrolled to the bottom
  chatBox.scrollTop = chatBox.scrollHeight;
  
  return messageDiv;
}

/**
 * Handles the chat form submission
 */
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const messageText = userInput.value.trim();
  if (!messageText) return;

  // UX: Disable input during processing
  userInput.disabled = true;
  submitBtn.disabled = true;

  // 1. Add user's message to the UI
  appendMessage('user', messageText);

  // 2. Update the internal history state
  conversationHistory.push({ role: 'user', text: messageText });

  // 3. Clear input and show a temporary "Thinking..." message
  userInput.value = '';
  const thinkingMessage = appendMessage('model', 'Thinking...');

  try {
    // 4. Send request to the backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: conversationHistory
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // 5. Handle the result
    if (data && data.result) {
      // Replace "Thinking..." with the actual response
      thinkingMessage.innerHTML = formatText(data.result);
      
      // Update history with the bot's response for context in the next turn
      conversationHistory.push({ role: 'model', text: data.result });
    } else {
      thinkingMessage.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    console.error('Chat error:', error);
    thinkingMessage.textContent = 'Failed to get response from server.';
    
    // Optional: Remove the last user message from history if the request failed
    // so the context doesn't get out of sync.
    conversationHistory.pop();
  } finally {
    // Mengaktifkan kembali input setelah proses selesai (berhasil maupun gagal)
    userInput.disabled = false;
    submitBtn.disabled = false;
    userInput.focus(); // Fokuskan kembali ke input agar user bisa langsung mengetik
  }
});
