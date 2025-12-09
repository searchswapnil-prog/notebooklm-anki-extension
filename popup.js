document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("sendToAnki");
  const statusEl = document.getElementById("status");

  btn.addEventListener("click", async () => {
    statusEl.textContent = "🤖 Robot initializing...";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true }, 
        files: ["content.js"]
      });
      
    } catch (e) {
      statusEl.textContent = "Error: " + e.message;
    }
  });
});