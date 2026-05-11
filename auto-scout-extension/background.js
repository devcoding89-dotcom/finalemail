let isRunning = false;
let apiUrl = '';
let campaignId = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_AUTO_SCOUT') {
    isRunning = true;
    apiUrl = message.apiUrl;
    campaignId = message.campaignId;
    processNextEmail();
  } else if (message.type === 'STOP_AUTO_SCOUT') {
    isRunning = false;
  } else if (message.type === 'CONTENT_SCRIPT_FINISHED') {
    // Content script finished sending the email and closed the tab
    if (message.success) {
      markEmailAsSent(message.contactId).then(() => {
        if (isRunning) {
          setTimeout(processNextEmail, 2000); // Wait 2s before next to be safe
        }
      });
    } else {
      console.error("Failed to send email in Gmail tab");
      stopAndNotify();
    }
  }
});

async function processNextEmail() {
  if (!isRunning) return;

  try {
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', status: 'Fetching next email...' });
    
    // Fetch next email from API
    const response = await fetch(`${apiUrl}/api/campaigns/${campaignId}/next-email`);
    const data = await response.json();

    if (!data.success || !data.hasMore) {
      stopAndNotify();
      return;
    }

    const { contact, personalized } = data.data;
    
    chrome.storage.local.set({ currentEmail: contact.email });
    chrome.runtime.sendMessage({ 
      type: 'STATUS_UPDATE', 
      status: 'Opening Gmail...', 
      email: contact.email 
    });

    // Reuse the existing tab if we have one, otherwise create a new one
    chrome.storage.local.get(['lastTabId'], (result) => {
      const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1`;
      
      const tabData = {
        pendingEmailData: {
          to: contact.email,
          subject: personalized.subject,
          body: personalized.body,
          contactId: contact.id
        }
      };

      if (result.lastTabId) {
        chrome.tabs.update(result.lastTabId, { url: composeUrl, active: true }, (tab) => {
          chrome.storage.local.set(tabData);
        });
      } else {
        chrome.tabs.create({ url: composeUrl, active: true }, (tab) => {
          chrome.storage.local.set({ ...tabData, lastTabId: tab.id });
        });
      }
    });

  } catch (error) {
    console.error("Error fetching next email:", error);
    stopAndNotify();
  }
}

async function markEmailAsSent(contactId) {
  try {
    await fetch(`${apiUrl}/api/campaigns/${campaignId}/mark-sent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, method: 'auto_scout' })
    });
  } catch (error) {
    console.error("Error marking sent:", error);
  }
}

function stopAndNotify() {
  isRunning = false;
  chrome.storage.local.set({ isRunning: false });
  chrome.runtime.sendMessage({ type: 'AUTO_SCOUT_COMPLETE' });
}
