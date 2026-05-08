// This script runs inside the Gmail tab

window.addEventListener('load', () => {
  // Check if we have pending data to send in this tab
  chrome.storage.local.get(['pendingEmailData'], (result) => {
    const data = result.pendingEmailData;
    if (!data) return; // Not an Auto Scout tab
    
    // Clear it so if they refresh it doesn't run again
    chrome.storage.local.remove(['pendingEmailData']);
    
    automateGmailCompose(data);
  });
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to find an element with retries since Gmail is a dynamic SPA
async function waitForElement(selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await sleep(200);
  }
  throw new Error(`Timeout waiting for ${selector}`);
}

async function automateGmailCompose(data) {
  try {
    console.log("Auto Scout: Starting composition process...");
    
    // 1. Wait for the Compose window to fully load
    // Gmail classes change often, these are common current selectors:
    // To field: input[aria-label="To" i] or input[name="to"]
    // Subject: input[name="subjectbox"]
    // Body: div[aria-label="Message Body" i]
    
    const toField = await waitForElement('input[aria-label="To" i], input[aria-expanded="true"]');
    const subjectField = await waitForElement('input[name="subjectbox"]');
    const bodyField = await waitForElement('div[aria-label="Message Body" i]');
    
    console.log("Auto Scout: Fields found, filling data...");

    // Fill To
    toField.value = data.to;
    toField.dispatchEvent(new Event('input', { bubbles: true }));
    // Press Enter to confirm the chip
    toField.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13 }));
    
    await sleep(500);

    // Fill Subject
    subjectField.value = data.subject;
    subjectField.dispatchEvent(new Event('input', { bubbles: true }));
    
    await sleep(500);

    // Fill Body (HTML)
    bodyField.innerHTML = data.body;
    bodyField.dispatchEvent(new Event('input', { bubbles: true }));
    
    await sleep(1000);

    // Find and click Send
    // Usually a button with text "Send" or a specific class. E.g. .dC > div
    const sendBtn = document.querySelector('.dC > div, div[aria-label^="Send"]');
    if (!sendBtn) throw new Error("Send button not found");
    
    console.log("Auto Scout: Clicking Send...");
    sendBtn.click();
    
    // Wait for the "Message sent" toast to ensure it went through
    console.log("Auto Scout: Waiting for confirmation...");
    await waitForElement('span:contains("Message sent")', 15000).catch(() => {
      // Sometimes the toast selector changes, or language differs.
      // We will fallback to a static wait if we can't find it reliably.
      console.log("Auto Scout: Could not detect toast, assuming sent after delay.");
    });
    
    await sleep(2000); // Wait a bit to ensure request finishes

    // Report success back to background script
    chrome.runtime.sendMessage({
      type: 'CONTENT_SCRIPT_FINISHED',
      success: true,
      contactId: data.contactId
    });

    // Close the tab
    window.close();

  } catch (error) {
    console.error("Auto Scout Error:", error);
    chrome.runtime.sendMessage({
      type: 'CONTENT_SCRIPT_FINISHED',
      success: false,
      error: error.message
    });
  }
}

// Custom pseudo-selector for finding text
jQueryLikeContains();
function jQueryLikeContains() {
  const originalQuerySelector = document.querySelector;
  document.querySelector = function(selector) {
    if (selector.includes(':contains("')) {
      const parts = selector.split(':contains("');
      const elementTag = parts[0] || '*';
      const text = parts[1].split('")')[0];
      
      const elements = document.querySelectorAll(elementTag);
      for (const el of elements) {
        if (el.textContent.includes(text)) return el;
      }
      return null;
    }
    return originalQuerySelector.call(this, selector);
  };
}
