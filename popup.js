document.addEventListener('DOMContentLoaded', function() {
  const fillButton = document.getElementById('fillButton');
  const pullRequests = document.getElementById('pullRequests');
  pullRequests.addEventListener('click', async () => {
    await chrome.tabs.create({ url: "https://dev.azure.com/PepsiCoIT2/CGF_PepsiCocom_Redesign/_git/app-cgf-pepsico-com-frontend/pullrequests?_a=active" });
  });


  // Lấy template từ đâu đó (ví dụ, template cố định hoặc từ chrome.storage)
  const templateToFill = `
## Description
Please provide a concise description of your changes. Include the context and purpose of this
PR.
- Why is this change needed?
- What problem does it solve?
- Any additional context?
---
## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Enhancement/Refactor
- [ ] Documentation update
- [ ] Other (please describe):
---
## Related work items
Link to the related ADO work item(s):
Fixes #[Work Item ID]
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
`; // Hoặc lấy từ chrome.storage.sync.get('prTemplate') nếu bạn muốn dùng template đã lưu

  fillButton.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Truyền templateToFill như một đối số cho hàm fillDescription
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: fillDescription,
      args: [templateToFill] // Truyền dữ liệu vào hàm sẽ được inject
    });
  });
});

// Hàm này sẽ được inject và chạy trong ngữ cảnh của tab đang hoạt động.
// Nó nhận 'textToType' làm đối số.
// KHÔNG ĐẶT HÀM NÀY BÊN TRONG document.addEventListener NỮA!
// Nó cần độc lập để chrome.scripting.executeScript có thể truy cập.
function fillDescription(textToType) {
  // Tìm ô textarea dựa trên placeholder của nó
  const placeholderText = "Describe the code that is being reviewed";
  const textarea = document.querySelector(`textarea[placeholder="${placeholderText}"]`);

  if (textarea) {
    textarea.focus(); // Focus vào textarea trước khi gõ

    let i = 0;
    const typingInterval = 1; // Khoảng thời gian giữa các ký tự (ms)

    const typeChar = () => {
      if (i < textToType.length) {
        const char = textToType.charAt(i);

        // 1. Cập nhật giá trị trực tiếp
        textarea.value += char;

        // 2. Kích hoạt sự kiện 'input'
        // Đây là sự kiện quan trọng nhất mà các framework lắng nghe
        textarea.dispatchEvent(new Event('input', {
          bubbles: true,   // Cho phép sự kiện nổi bọt lên các phần tử cha
          cancelable: true // Cho phép sự kiện có thể bị hủy
        }));

        // Tùy chọn: Đặt con trỏ về cuối văn bản và cuộn nếu cần
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
        textarea.scrollTop = textarea.scrollHeight;

        i++;
        setTimeout(typeChar, typingInterval); // Gọi lại chính nó sau một khoảng thời gian
      } else {
        console.log(`Đã hoàn tất điền "${textToType}" vào textarea.`);
        // Tùy chọn: Kích hoạt sự kiện 'change' khi hoàn thành
        textarea.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      }
    };

    typeChar(); // Bắt đầu quá trình gõ
  } else {
    console.log(`Không tìm thấy ô textarea với placeholder: "${placeholderText}"`);
    alert(`Không tìm thấy ô textarea với placeholder: "${placeholderText}"`);
  }
}