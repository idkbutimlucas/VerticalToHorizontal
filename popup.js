// Popup script

const orientationBtn = document.getElementById('orientationBtn');
const pipBtn = document.getElementById('pipBtn');
const statusText = document.getElementById('statusText');
const statusDiv = document.getElementById('status');
const settingsLink = document.getElementById('settingsLink');
const pipShortcutDisplay = document.getElementById('pipShortcutDisplay');
const rotationShortcutDisplay = document.getElementById('rotationShortcutDisplay');

let currentTab = null;
let isHorizontal = false;
let pipActive = false;
let isVerticalVideo = false;
let shortcuts = null;

// Update UI
function updateUI() {
  // Show rotation button only for vertical videos
  if (isVerticalVideo) {
    orientationBtn.style.display = 'block';

    // Update rotation button
    if (isHorizontal) {
      orientationBtn.textContent = '↔️ Rotation Enabled';
      orientationBtn.style.background = '#722F37';
      orientationBtn.style.color = '#EFDFBB';
    } else {
      orientationBtn.textContent = '🔄 Enable Rotation';
      orientationBtn.style.background = 'white';
      orientationBtn.style.color = '#722F37';
    }
  } else {
    // Hide button for horizontal videos
    orientationBtn.style.display = 'none';
  }

  // Update PiP button and status
  if (pipActive) {
    pipBtn.textContent = 'Disable PiP';
    if (isVerticalVideo && isHorizontal) {
      statusText.textContent = '✅ PiP active (Rotation Mode)';
    } else {
      statusText.textContent = '✅ PiP active';
    }
    statusDiv.className = 'status active';
  } else {
    pipBtn.textContent = 'Enable PiP';

    if (isVerticalVideo) {
      if (isHorizontal) {
        statusText.textContent = '📱 Vertical video • Rotation ready';
      } else {
        statusText.textContent = '📱 Vertical video detected';
      }
    } else {
      statusText.textContent = '🎬 Universal PiP ready';
    }
    statusDiv.className = 'status';
  }
}

// Check status
async function checkStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // Check if URL is valid (not chrome://, about:, etc.)
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      statusText.textContent = '⚠️ System page not supported';
      orientationBtn.disabled = true;
      pipBtn.disabled = true;
      return;
    }

    // Enable all buttons by default
    orientationBtn.disabled = false;
    pipBtn.disabled = false;

    // Get status from content script
    chrome.tabs.sendMessage(tab.id, { action: 'getPiPStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        statusText.textContent = '⚠️ Reload page (F5)';
        orientationBtn.disabled = true;
        pipBtn.disabled = true;
        return;
      }

      if (response) {
        isHorizontal = response.isHorizontal || false;
        pipActive = response.active || false;
        isVerticalVideo = response.isVerticalVideo || false;
        updateUI();
      }
    });

  } catch (error) {
    // Silently handle error
  }
}

// Rotation button
orientationBtn.addEventListener('click', async () => {
  if (!currentTab) return;

  orientationBtn.disabled = true;

  chrome.tabs.sendMessage(currentTab.id, { action: 'toggleOrientation' }, (response) => {
    if (response && response.success) {
      isHorizontal = response.isHorizontal;
      updateUI();
    }
    orientationBtn.disabled = false;
  });
});

// PiP button
pipBtn.addEventListener('click', async () => {
  if (!currentTab) return;

  pipBtn.disabled = true;

  chrome.tabs.sendMessage(currentTab.id, { action: 'togglePiP' }, (response) => {
    if (response && response.success) {
      pipActive = response.active;
      updateUI();
    }
    pipBtn.disabled = false;
  });
});

// Load and display shortcuts
async function loadShortcuts() {
  try {
    const result = await chrome.storage.sync.get(['shortcuts']);
    shortcuts = result.shortcuts || {
      pip: { ctrl: true, shift: true, alt: false, key: 'p' },
      rotation: { ctrl: true, shift: true, alt: false, key: 'e' }
    };
    updateShortcutDisplay();
  } catch (error) {
    // Silently handle error
  }
}

// Display shortcuts in interface
function updateShortcutDisplay() {
  if (!shortcuts) return;

  const isMac = navigator.userAgentData?.platform === 'macOS' || navigator.platform.toUpperCase().includes('MAC');

  // PiP shortcut
  const pipParts = [];
  if (shortcuts.pip.ctrl) pipParts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcuts.pip.shift) pipParts.push(isMac ? '⇧' : 'Shift');
  if (shortcuts.pip.alt) pipParts.push(isMac ? '⌥' : 'Alt');
  pipParts.push(shortcuts.pip.key.toUpperCase());
  pipShortcutDisplay.textContent = pipParts.join(isMac ? '' : '+');

  // Rotation shortcut
  const rotationParts = [];
  if (shortcuts.rotation.ctrl) rotationParts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcuts.rotation.shift) rotationParts.push(isMac ? '⇧' : 'Shift');
  if (shortcuts.rotation.alt) rotationParts.push(isMac ? '⌥' : 'Alt');
  rotationParts.push(shortcuts.rotation.key.toUpperCase());
  rotationShortcutDisplay.textContent = rotationParts.join(isMac ? '' : '+');
}

// Open settings page
settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Open privacy page
const privacyLink = document.getElementById('privacyLink');
privacyLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
});

// Check on load
loadShortcuts();
checkStatus();
setInterval(checkStatus, 2000);
