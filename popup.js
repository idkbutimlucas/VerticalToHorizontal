// Popup script

const orientationBtn = document.getElementById('orientationBtn');
const pipBtn = document.getElementById('pipBtn');
const statusText = document.getElementById('statusText');
const statusDiv = document.getElementById('status');

let currentTab = null;
let isHorizontal = false;
let pipActive = false;

// Mettre à jour l'interface
function updateUI() {
  if (isHorizontal) {
    orientationBtn.textContent = 'Désactiver Rotation';
    orientationBtn.style.background = '#722F37';
    orientationBtn.style.color = '#EFDFBB';
  } else {
    orientationBtn.textContent = 'Activer Rotation';
    orientationBtn.style.background = 'white';
    orientationBtn.style.color = '#722F37';
  }

  if (pipActive) {
    pipBtn.textContent = 'Désactiver PiP';
    statusText.textContent = '✅ PiP actif';
    statusDiv.className = 'status active';
  } else {
    pipBtn.textContent = 'Activer PiP';
    statusText.textContent = isHorizontal ? 'Mode: Horizontal' : 'Mode: Vertical';
    statusDiv.className = 'status';
  }
}

// Vérifier le statut
async function checkStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    if (!tab.url || (!tab.url.includes('youtube.com') && !tab.url.includes('tiktok.com'))) {
      statusText.textContent = 'Page non supportée';
      orientationBtn.disabled = true;
      pipBtn.disabled = true;
      return;
    }

    orientationBtn.disabled = false;
    pipBtn.disabled = false;

    chrome.tabs.sendMessage(tab.id, { action: 'getPiPStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        statusText.textContent = '⚠️ Rechargez la page (F5)';
        orientationBtn.disabled = true;
        pipBtn.disabled = true;
        return;
      }

      if (response) {
        isHorizontal = response.isHorizontal || false;
        pipActive = response.active || false;
        updateUI();
      }
    });

  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Bouton rotation
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

// Bouton PiP
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

// Vérifier au chargement
checkStatus();
setInterval(checkStatus, 2000);
