document.addEventListener('DOMContentLoaded', function() {
  const fillButton = document.getElementById('fillButton');
  const pullRequests = document.getElementById('pullRequests');
  pullRequests.addEventListener('click', async () => {
    await chrome.tabs.create({ url: "https://dev.azure.com/PepsiCoIT2/CGF_PepsiCocom_Redesign/_git/app-cgf-pepsico-com-frontend/pullrequests?_a=active" });
  });


  // Lấy template từ đâu đó (ví dụ, template cố định hoặc từ chrome.storage)
  const templateToFill = `

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

  fillButton.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: fillDescription,
      args: [templateToFill]
    });
  });
});
function fillDescription(textToType) {
  const placeholderText = "Describe the code that is being reviewed";
  const textarea = document.querySelector(`textarea[placeholder="${placeholderText}"]`);
  const number = document.querySelector('.repos-pr-create-header-first-row')?.nextSibling?.children[0]
  ?.querySelector('.text-ellipsis')?.querySelector('.text-ellipsis')?.innerHTML.match(/\d+/g);

  const ticketId = number ? number[0] : null;
  textToType = textToType.replace("{ticketId}", ticketId);

  if (textarea) {
    textarea.focus();

    let i = 0;
    const typingInterval = 1;

    const typeChar = () => {
      if (i < textToType.length) {
        const char = textToType.charAt(i);

        textarea.value += char;

        textarea.dispatchEvent(new Event('input', {
          bubbles: true,
          cancelable: true
        }));

        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
        textarea.scrollTop = textarea.scrollHeight;

        i++;
        setTimeout(typeChar, typingInterval);
      } else {
        console.log(`Đã hoàn tất điền "${textToType}" vào textarea.`);
        textarea.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      }
    };

    typeChar();
  } else {
    console.log(`Không tìm thấy ô textarea với placeholder: "${placeholderText}"`);
    alert(`Không tìm thấy ô textarea với placeholder: "${placeholderText}"`);
  }
}