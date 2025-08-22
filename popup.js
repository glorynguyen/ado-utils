// ===============================
// Configuration
// ===============================
const AUTH_TOKEN = "auth_4070765019154941b288470381956ac5";
const MODEL_ID = "Qwen2-1.5B-Instruct";
const TABBY_URL = "http://localhost:8080/v1/chat/completions";
const OLLAMA_URL = "http://localhost:4000/api/generate";
const OLLAMA_MODEL = "qwen2.5-coder:14b-instruct-q4_0";

const PR_TEMPLATE = `
---
## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Enhancement/Refactor
- [ ] Documentation update
- [ ] Other (please describe):
---
## Related work items
#{ticketId}
---
## Checklist for Developer Self-Test
### Code Quality & Functionality
- [x] Code builds successfully without errors or warnings
- [x] Linting passes locally
- [x] No unused code or console logs
### UI/UX (if applicable)
- [x] Verified layout in different screen sizes (desktop, tablet, mobile)
### Functionality & Business Logic
- [x] Main functionality works as expected
- [x] Edge cases handled (e.g., null values, error states)
- [x] Error and loading states are properly handled
### Evidence
`;

// ===============================
// API: Tabby Chat Completion
// ===============================
async function getTabbyResponse(prompt) {
  const headers = { "Content-Type": "application/json" };
  if (AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;
  }

  const payload = {
    model: MODEL_ID,
    stream: true,
    messages: [
      { role: "system", content: "You are a helpful assistant that writes PR descriptions in markdown." },
      { role: "user", content: prompt }
    ]
  };

  let fullResponseContent = "";
  const response = await fetch(TABBY_URL, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6);
      if (jsonStr.trim() === "[DONE]") break;

      try {
        const data = JSON.parse(jsonStr);
        const deltaContent = data?.choices?.[0]?.delta?.content;
        if (deltaContent) fullResponseContent += deltaContent;
      } catch {
        // Ignore invalid JSON
      }
    }
  }

  return fullResponseContent;
}

// ===============================
// API: Ollama Chat Completion (Moved from background.js)
// ===============================
async function getOllamaResponse(prompt) {
  const payload = {
    model: OLLAMA_MODEL,
    prompt: prompt,
    stream: false // NOTE: Set to false for simpler response handling. If you need streaming, the original logic is fine.
  };

  let fullResponseContent = "";

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

  // This handles both streaming and non-streaming responses from Ollama
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // Ollama's response is a series of JSON objects, one per line.
    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);
        // The final response object has a `response` key with the full content
        // while streaming objects have it too. This accumulates the entire response.
        if (data.response) {
           fullResponseContent += data.response;
        }
      } catch (err) {
        console.error("Failed to parse JSON line from Ollama:", line);
        // Ignore invalid JSON
      }
    }
  }
  return fullResponseContent;
}


// ===============================
// UI Handlers
// ===============================
function setupTabSwitching() {
  document.querySelectorAll('.tab-header button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-header button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));

      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.remove('hidden');
    });
  });
}

function setupChatSend() {
  document.getElementById("sendChat").addEventListener("click", async () => {
    const prompt = document.getElementById("chatInput").value;
    const output = document.getElementById("chatOutput");
    const modelChoice = document.getElementById("modelSelector").value;

    if (!prompt) {
        output.textContent = "Please enter a prompt.";
        return;
    }

    output.textContent = "Thinking...";

    try {
      let result = "";
      if (modelChoice === "tabby") {
        result = await getTabbyResponse(prompt);
      } else {
        // Directly call the local Ollama function
        result = await getOllamaResponse(prompt);
      }
      output.textContent = result;
    } catch (err) {
      output.textContent = "Error: " + err.message;
    }
  });
}


function setupGenerateSlackMessage() {
  const generateButton = document.getElementById('generateSlackMessage');
  generateButton.addEventListener('click', async () => {
    // 1. Get the current active tab to retrieve its URL
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url) {
      const prLink = tab.url;

      // 2. Construct the message using Slack's link markdown format: <URL|Link Text>
      const slackMessage = `${prLink}\n@here please help me to review above PR`;

      try {
        // 3. Copy the generated message to the clipboard
        await navigator.clipboard.writeText(slackMessage);

        // 4. Provide user feedback
        const originalText = generateButton.textContent;
        generateButton.textContent = 'Copied!';
        setTimeout(() => {
          generateButton.textContent = originalText;
        }, 2000); // Revert text after 2 seconds
      } catch (err) {
        console.error('Failed to copy text to clipboard: ', err);
        alert('Could not copy text to clipboard.');
      }
    } else {
      console.error('Could not get the active tab URL.');
      alert('Could not find the URL of the current page.');
    }
  });
}

function setupPullRequestsButton() {
  const pullRequests = document.getElementById('pullRequests');
  pullRequests.addEventListener('click', async () => {
    await chrome.tabs.create({
      url: "https://dev.azure.com/PepsiCoIT2/CGF_PepsiCocom_Redesign/_git/app-cgf-pepsico-com-frontend/pullrequests?_a=active"
    });
  });
}

function setupFillButton() {
  const fillButton = document.getElementById('fillButton');
  fillButton.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: fillDescription,
      args: [PR_TEMPLATE]
    });
  });
}

// ===============================
// Content Script: Fill Description
// ===============================
function fillDescription(template) {
  const PLACEHOLDER_TEXT = "Describe the code that is being reviewed";
  const textarea = document.querySelector(`textarea[placeholder="${PLACEHOLDER_TEXT}"]`);
  const number = document.querySelector('.repos-pr-create-header-first-row')
    ?.nextSibling?.children[0]
    ?.querySelector('.text-ellipsis')?.querySelector('.text-ellipsis')
    ?.innerHTML.match(/\d+/g);

  const ticketId = number ? number[0] : 'TICKET-ID'; // Fallback if not found
  let textToType = template.replace("#{ticketId}", ticketId);

  if (!textarea) {
    console.error(`Textarea with placeholder "${PLACEHOLDER_TEXT}" not found.`);
    alert(`Could not find the PR description textarea with placeholder: "${PLACEHOLDER_TEXT}"`);
    return;
  }

  textarea.focus();
  let i = 0;
  const typingInterval = 1; // Faster typing

  // Set value directly for speed and reliability, then dispatch events
  textarea.value = textToType;
  textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  textarea.scrollTop = textarea.scrollHeight;
  console.log(`Filled PR description.`);
}

// ===============================
// Initialization
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  setupTabSwitching();
  setupChatSend();
  setupPullRequestsButton();
  setupGenerateSlackMessage();
  setupFillButton();
});