// ===============================
// Configuration
// ===============================
const AUTH_TOKEN = "auth_4070765019154941b288470381956ac5";
const MODEL_ID = "Qwen2-1.5B-Instruct";
const TABBY_URL = "http://localhost:8080/v1/chat/completions";
const PLACEHOLDER_TEXT = "Describe the code that is being reviewed";

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
    const outputDiv = document.getElementById("chatOutput");
    outputDiv.textContent = "Thinking...";

    try {
      const data = await getTabbyResponse(prompt);

      // Parse markdown → HTML
      const htmlContent = marked.parse(data);

      // Inject into chatOutput
      outputDiv.innerHTML = htmlContent;

      // Highlight any code blocks
      outputDiv.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });

    } catch (err) {
      outputDiv.textContent = "Error: " + err.message;
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
  const textarea = document.querySelector(`textarea[placeholder="${PLACEHOLDER_TEXT}"]`);
  const number = document.querySelector('.repos-pr-create-header-first-row')
    ?.nextSibling?.children[0]
    ?.querySelector('.text-ellipsis')?.querySelector('.text-ellipsis')
    ?.innerHTML.match(/\d+/g);

  const ticketId = number ? number[0] : null;
  let textToType = template.replace("{ticketId}", ticketId);

  if (!textarea) {
    console.error(`Textarea with placeholder "${PLACEHOLDER_TEXT}" not found.`);
    alert(`Không tìm thấy ô textarea với placeholder: "${PLACEHOLDER_TEXT}"`);
    return;
  }

  textarea.focus();
  let i = 0;
  const typingInterval = 1;

  const typeChar = () => {
    if (i < textToType.length) {
      textarea.value += textToType.charAt(i);
      textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      textarea.scrollTop = textarea.scrollHeight;
      i++;
      setTimeout(typeChar, typingInterval);
    } else {
      console.log(`Completed typing PR description.`);
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  typeChar();
}

// ===============================
// Initialization
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  setupTabSwitching();
  setupChatSend();
  setupPullRequestsButton();
  setupFillButton();
});
