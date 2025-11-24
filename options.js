// options.js - Gestion des paramètres de raccourcis clavier

// Raccourcis par défaut
const DEFAULT_SHORTCUTS = {
  pip: {
    ctrl: true,
    shift: true,
    alt: false,
    key: 'p'
  },
  rotation: {
    ctrl: true,
    shift: true,
    alt: false,
    key: 'e'
  }
};

// Éléments du DOM
const pipCtrl = document.getElementById('pip-ctrl');
const pipShift = document.getElementById('pip-shift');
const pipAlt = document.getElementById('pip-alt');
const pipKey = document.getElementById('pip-key');

const rotationCtrl = document.getElementById('rotation-ctrl');
const rotationShift = document.getElementById('rotation-shift');
const rotationAlt = document.getElementById('rotation-alt');
const rotationKey = document.getElementById('rotation-key');

const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');

// Charger les paramètres sauvegardés
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['shortcuts']);
    const shortcuts = result.shortcuts || DEFAULT_SHORTCUTS;

    // Charger les raccourcis PiP
    pipCtrl.checked = shortcuts.pip.ctrl;
    pipShift.checked = shortcuts.pip.shift;
    pipAlt.checked = shortcuts.pip.alt;
    pipKey.value = shortcuts.pip.key.toUpperCase();

    // Charger les raccourcis Rotation
    rotationCtrl.checked = shortcuts.rotation.ctrl;
    rotationShift.checked = shortcuts.rotation.shift;
    rotationAlt.checked = shortcuts.rotation.alt;
    rotationKey.value = shortcuts.rotation.key.toUpperCase();
  } catch (error) {
    showMessage('Error loading settings', 'error');
  }
}

// Save settings
async function saveSettings() {
  try {
    // Validation
    if (!pipKey.value || !rotationKey.value) {
      showMessage('Please fill in all keys', 'error');
      return;
    }

    if (!pipCtrl.checked && !pipShift.checked && !pipAlt.checked) {
      showMessage('PiP shortcut must have at least one modifier', 'error');
      return;
    }

    if (!rotationCtrl.checked && !rotationShift.checked && !rotationAlt.checked) {
      showMessage('Rotation shortcut must have at least one modifier', 'error');
      return;
    }

    const shortcuts = {
      pip: {
        ctrl: pipCtrl.checked,
        shift: pipShift.checked,
        alt: pipAlt.checked,
        key: pipKey.value.toLowerCase()
      },
      rotation: {
        ctrl: rotationCtrl.checked,
        shift: rotationShift.checked,
        alt: rotationAlt.checked,
        key: rotationKey.value.toLowerCase()
      }
    };

    await chrome.storage.sync.set({ shortcuts });
    showMessage('✅ Settings saved successfully!', 'success');

    // Notify all tabs of the change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'shortcutsUpdated' });
      } catch (e) {
        // Ignore errors (tabs without content script)
      }
    }
  } catch (error) {
    showMessage('❌ Error saving settings', 'error');
  }
}

// Reset to default values
async function resetSettings() {
  try {
    await chrome.storage.sync.set({ shortcuts: DEFAULT_SHORTCUTS });
    await loadSettings();
    showMessage('🔄 Settings reset to defaults', 'success');

    // Notify all tabs of the change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'shortcutsUpdated' });
      } catch (e) {
        // Ignore errors
      }
    }
  } catch (error) {
    showMessage('❌ Error resetting settings', 'error');
  }
}

// Show status message
function showMessage(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;

  if (type === 'success') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
}

// Normalize key inputs
function normalizeKeyInput(input) {
  input.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    if (value && /^[a-z]$/.test(value)) {
      e.target.value = value.toUpperCase();
    } else if (value && !/^[a-z]$/.test(value)) {
      e.target.value = '';
      showMessage('Please enter a single letter (a-z)', 'error');
    }
  });

  input.addEventListener('keydown', (e) => {
    // Prevent special keys
    if (e.key.length > 1 && e.key !== 'Backspace') {
      e.preventDefault();
    }
  });
}

// Event listeners
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);

// Normalize inputs
normalizeKeyInput(pipKey);
normalizeKeyInput(rotationKey);

// Load settings on startup
loadSettings();
