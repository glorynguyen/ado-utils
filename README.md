# PR Template Paster

![Extension Icon](./icons/icon48.png)

A simple but powerful Chrome extension that automates the process of filling out Pull Request descriptions on GitHub. With one click, it pastes a predefined template directly into the PR description box, ensuring consistency and saving developers valuable time.

It also includes a quick-access button to a team's specific Pull Requests page on Azure DevOps.

## ✨ Features

- **One-Click Template Filling**: Instantly populates the GitHub PR description with a standardized markdown template.
- **Realistic Typing Simulation**: The extension "types" the template into the textarea, ensuring compatibility with modern web frameworks like React, which GitHub uses.
- **Quick Link**: A dedicated button to quickly navigate to a predefined Azure DevOps Pull Requests page.
- **Clean & Simple UI**: A minimalist popup interface that is easy to use.
- **Manifest V3**: Built with the latest Chrome extension platform for better security and performance.

## 📸 Demo

*(Here you would place a GIF or screenshot showing the extension in action)*

*How it works: Navigate to the "Create Pull Request" page, click the extension icon, and press "Fill PR description".*

## 🚀 Installation

### Option 1: From the Chrome Web Store (Recommended)

TBD

### Option 2: Manual Installation (for Developers)

If you want to customize the extension or install it from the source code:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/glorynguyen/ado-utils.git
    ```
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** by toggling the switch in the top-right corner.
4.  Click the **"Load unpacked"** button.
5.  Select the directory where you cloned the repository.
6.  The extension icon should now appear in your Chrome toolbar!

## 🔧 How to Use

1.  Navigate to a GitHub page for creating a new pull request (the URL will look like `https://github.com/org/repo/compare/branch...`).
2.  Click the **PR Template Paster** icon in your browser's toolbar.
3.  In the popup, click the **"Fill PR description"** button.
4.  Watch as the template is automatically typed into the description box.
5.  To visit your team's pull requests page, click the **"View Pull Requests"** button.

## 🛠️ Customization

This extension is designed to be easily adapted for your own team's workflow. The PR template and the quick link URL are hardcoded in `popup.js`.

### 1. Customizing the PR Template

Open `popup.js` and find the `templateToFill` constant. You can change the string to match your team's markdown template.

```javascript
// in popup.js

// ...

const templateToFill = `
## My Team's Custom Description
- What does this PR do?

---
## Ticket
- JIRA-123

---
## Checklist
- [ ] I have tested this on staging.
`;

// ...