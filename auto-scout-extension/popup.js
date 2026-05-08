document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const apiUrlInput = document.getElementById('apiUrl');
  const campaignIdInput = document.getElementById('campaignId');
  
  const setupPanel = document.getElementById('setup-panel');
  const activePanel = document.getElementById('active-panel');
  const statusText = document.getElementById('statusText');
  const currentEmailText = document.getElementById('currentEmail');

  // Load saved state
  chrome.storage.local.get(['isRunning', 'apiUrl', 'campaignId', 'currentEmail'], (result) => {
    if (result.apiUrl) apiUrlInput.value = result.apiUrl;
    if (result.campaignId) campaignIdInput.value = result.campaignId;
    
    if (result.isRunning) {
      setupPanel.classList.add('hidden');
      activePanel.classList.remove('hidden');
      statusText.innerText = 'Running...';
      currentEmailText.innerText = result.currentEmail || 'Fetching next...';
    }
  });

  // Listen for updates from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATUS_UPDATE') {
      statusText.innerText = message.status;
      if (message.email) {
        currentEmailText.innerText = message.email;
      }
    } else if (message.type === 'AUTO_SCOUT_COMPLETE') {
      setupPanel.classList.remove('hidden');
      activePanel.classList.add('hidden');
      chrome.storage.local.set({ isRunning: false });
      alert('Auto Scout finished or stopped!');
    }
  });

  startBtn.addEventListener('click', () => {
    const apiUrl = apiUrlInput.value.trim();
    const campaignId = campaignIdInput.value.trim();
    
    if (!apiUrl || !campaignId) {
      alert('Please enter both API URL and Campaign ID');
      return;
    }

    chrome.storage.local.set({ apiUrl, campaignId, isRunning: true });
    setupPanel.classList.add('hidden');
    activePanel.classList.remove('hidden');
    statusText.innerText = 'Starting...';

    // Tell background script to start
    chrome.runtime.sendMessage({
      type: 'START_AUTO_SCOUT',
      apiUrl,
      campaignId
    });
  });

  stopBtn.addEventListener('click', () => {
    chrome.storage.local.set({ isRunning: false });
    chrome.runtime.sendMessage({ type: 'STOP_AUTO_SCOUT' });
    setupPanel.classList.remove('hidden');
    activePanel.classList.add('hidden');
  });
});
