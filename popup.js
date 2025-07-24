document.addEventListener('DOMContentLoaded', function () {
    const fillButton = document.getElementById('fillButton');

    fillButton.addEventListener('click', async () => {
        // 1. Lấy thông tin về tab đang hoạt động
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // 2. Thực thi một hàm trên tab đó
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: fillDescription,
        });
    });
});

// 3. Đây là hàm sẽ được "tiêm" và chạy trên trang web
function fillDescription() {
    // Tìm ô textarea dựa trên placeholder của nó
    const placeholderText = "Describe the code that is being reviewed";
    const textarea = document.querySelector(`textarea[placeholder="${placeholderText}"]`);

    // Nếu tìm thấy, điền text vào
    if (textarea) {
        textarea.value = "Hello word";
        console.log("Đã điền 'Hello word' vào textarea.");
    } else {
        console.log("Không tìm thấy textarea với placeholder phù hợp.");
        // Bạn có thể alert để thông báo cho người dùng
        alert(`Không tìm thấy ô textarea với placeholder: "${placeholderText}"`);
    }
}