// This script is injected into the dashboard (localhost or vercel app).
// It listens for messages from the dashboard page and forwards them to the extension's background script.

window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  const data = event.data;
  
  if (data && data.type === 'START_QUICK_SEND') {
    // Forward the message to the background script
    chrome.runtime.sendMessage(data, (response) => {
      // Optional: handle response back to the webpage if needed
    });
  }
});
