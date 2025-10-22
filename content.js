// Vertical To Horizontal - Version 3.2 Clean

let isHorizontal = false;
let pipActive = false;
let canvas = null;
let ctx = null;
let pipVideo = null;
let sourceVideo = null;
let animating = false;
let originalVideoStyle = null;

console.log('V2H chargée');

// Configurer les contrôles Media Session
function setupMediaControls(video, pipVid = null) {
  if (!('mediaSession' in navigator)) return;

  // Métadonnées
  navigator.mediaSession.metadata = new MediaMetadata({
    title: 'Vertical To Horizontal',
    artist: window.location.hostname.includes('tiktok.com') ? 'TikTok' : 'YouTube Shorts'
  });

  // Play - synchroniser les deux vidéos
  navigator.mediaSession.setActionHandler('play', () => {
    video.play().catch(() => {});
    if (pipVid) pipVid.play().catch(() => {});
  });

  // Pause - synchroniser les deux vidéos
  navigator.mediaSession.setActionHandler('pause', () => {
    video.pause();
    if (pipVid) pipVid.pause();
  });

  // Reculer
  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    video.currentTime = Math.max(video.currentTime - (details.seekOffset || 10), 0);
  });

  // Avancer
  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    video.currentTime = Math.min(video.currentTime + (details.seekOffset || 10), video.duration);
  });
}

// Trouver la vidéo
function getVideo() {
  if (window.location.hostname.includes('youtube.com')) {
    return document.querySelector('ytd-reel-video-renderer[is-active] video') ||
           document.querySelector('video');
  }

  if (window.location.hostname.includes('tiktok.com')) {
    // Stratégie 1: Chercher un container marqué comme actif (comme YouTube avec [is-active])
    // TikTok utilise des attributs data-e2e pour marquer les éléments

    // Essayer plusieurs sélecteurs spécifiques TikTok
    const activeSelectors = [
      // Container de l'item actif (sans aria-hidden)
      '[data-e2e="recommend-list-item-container"]:not([aria-hidden="true"]) video',
      // Container visible (TikTok cache les autres avec opacity)
      '[data-e2e="recommend-list-item-container"]:not([style*="opacity: 0"]) video',
      // Video player container
      '[class*="DivPlayerContainer"] video',
      // Chercher via le parent avec z-index le plus élevé (vidéo au premier plan)
      'div[style*="z-index"] video'
    ];

    for (const selector of activeSelectors) {
      const video = document.querySelector(selector);
      if (video && video.videoWidth > 0) {
        console.log(`[TikTok] ✅ Vidéo trouvée via: ${selector}`);
        return video;
      }
    }

    // Stratégie 2: Chercher la vidéo qui n'est PAS en aria-hidden
    const videos = document.querySelectorAll('video');
    console.log(`[TikTok] ${videos.length} vidéos trouvées`);

    for (const video of videos) {
      if (video.videoWidth === 0) continue;

      // Remonter dans le DOM pour trouver si le container parent a aria-hidden="true"
      let parent = video.parentElement;
      let isHidden = false;

      while (parent && parent !== document.body) {
        if (parent.getAttribute('aria-hidden') === 'true') {
          isHidden = true;
          break;
        }
        parent = parent.parentElement;
      }

      if (!isHidden && !video.paused) {
        console.log('[TikTok] ✅ Vidéo active trouvée (not aria-hidden, playing)');
        return video;
      }
    }

    // Stratégie 3: Ratio de visibilité (fallback)
    let bestVideo = null;
    let bestVisibilityRatio = 0;

    for (const video of videos) {
      if (video.videoWidth === 0) continue;

      const rect = video.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(window.innerHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = visibleHeight / rect.height;

      if (visibilityRatio > bestVisibilityRatio) {
        bestVisibilityRatio = visibilityRatio;
        bestVideo = video;
      }
    }

    if (bestVideo) {
      console.log(`[TikTok] Fallback visibility: ${(bestVisibilityRatio * 100).toFixed(1)}%`);
      return bestVideo;
    }

    // Dernier fallback
    return videos[0];
  }

  return null;
}

// Boucle d'animation
function animate() {
  if (!animating || !ctx || !sourceVideo) return;

  const w = sourceVideo.videoWidth;
  const h = sourceVideo.videoHeight;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(0, canvas.height);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(sourceVideo, 0, 0, w, h);
  ctx.restore();

  requestAnimationFrame(animate);
}

// Masquer la vidéo source
function hideSourceVideo(video) {
  originalVideoStyle = {
    opacity: video.style.opacity || '',
    visibility: video.style.visibility || ''
  };
  video.style.opacity = '0';
  video.style.visibility = 'hidden';
}

// Restaurer la vidéo source
function restoreSourceVideo() {
  if (sourceVideo && originalVideoStyle) {
    sourceVideo.style.opacity = originalVideoStyle.opacity;
    sourceVideo.style.visibility = originalVideoStyle.visibility;
    originalVideoStyle = null;
  }
}

// Nettoyer
function cleanup() {
  animating = false;
  restoreSourceVideo();
  sourceVideo = null;

  if (pipVideo && pipVideo.srcObject) {
    pipVideo.srcObject.getTracks().forEach(t => t.stop());
    pipVideo.srcObject = null;
  }

  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(() => {});
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
  }

  pipActive = false;
}

// Activer PiP
async function startPiP() {
  if (pipActive) return false;

  const video = getVideo();
  if (!video || !video.videoWidth) return false;

  const w = video.videoWidth;
  const h = video.videoHeight;
  const vertical = h > w;

  try {
    // MODE NORMAL
    if (!isHorizontal || !vertical) {
      await video.requestPictureInPicture();
      setupMediaControls(video);
      pipActive = true;
      return true;
    }

    // MODE ROTATION
    sourceVideo = video;

    // Masquer la vidéo source
    hideSourceVideo(video);

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
    }
    canvas.width = h;
    canvas.height = w;
    ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(30);

    if (!pipVideo) {
      pipVideo = document.createElement('video');
      pipVideo.muted = true;
      pipVideo.playsInline = true;
      pipVideo.style.display = 'none';
      document.body.appendChild(pipVideo);
    }

    pipVideo.srcObject = stream;
    animating = true;
    animate();

    await new Promise(r => setTimeout(r, 100));
    await pipVideo.play();
    await pipVideo.requestPictureInPicture();

    // Synchroniser play/pause entre les vidéos
    video.addEventListener('play', () => {
      if (pipVideo) pipVideo.play().catch(() => {});
    });
    video.addEventListener('pause', () => {
      if (pipVideo) pipVideo.pause();
    });

    setupMediaControls(video, pipVideo);
    pipActive = true;
    return true;

  } catch (error) {
    cleanup();
    return false;
  }
}

// Arrêter PiP
async function stopPiP() {
  cleanup();
  return true;
}

// Toggle orientation
async function toggleOrientation() {
  isHorizontal = !isHorizontal;

  try {
    chrome.storage.local.set({ isHorizontal });
  } catch (e) {}

  if (pipActive) {
    await stopPiP();
    await new Promise(r => setTimeout(r, 200));
    await startPiP();
  }

  return isHorizontal;
}

// Événements
document.addEventListener('leavepictureinpicture', () => {
  cleanup();
});

// Messages popup
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'togglePiP') {
    if (pipActive) {
      stopPiP().then(() => sendResponse({ success: true, active: false }));
    } else {
      startPiP().then(ok => sendResponse({ success: ok, active: ok }));
    }
    return true;
  }

  if (req.action === 'getPiPStatus') {
    sendResponse({ active: pipActive, isHorizontal });
    return true;
  }

  if (req.action === 'toggleOrientation') {
    toggleOrientation().then(h => sendResponse({ success: true, isHorizontal: h }));
    return true;
  }

  if (req.action === 'getOrientation') {
    sendResponse({ isHorizontal });
    return true;
  }
});

// Raccourcis clavier
document.addEventListener('keydown', async (e) => {
  const key = e.key.toLowerCase();
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Sur Mac: Cmd+Shift+P, Sur Windows/Linux: Ctrl+Shift+P
  const modifierKey = isMac ? e.metaKey : e.ctrlKey;

  // Cmd+Shift+P (Mac) ou Ctrl+Shift+P (Windows/Linux) : Toggle PiP
  if (modifierKey && e.shiftKey && key === 'p') {
    e.preventDefault();
    e.stopPropagation();
    console.log('Raccourci PiP activé');
    pipActive ? await stopPiP() : await startPiP();
    return;
  }

  // Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows/Linux) : Toggle Rotation
  if (modifierKey && e.shiftKey && key === 'r') {
    e.preventDefault();
    e.stopPropagation();
    console.log('Raccourci Rotation activé');
    await toggleOrientation();
    return;
  }
}, true); // capture: true pour intercepter avant les sites

// Charger préférences
chrome.storage?.local?.get(['isHorizontal'], (r) => {
  if (r.isHorizontal !== undefined) {
    isHorizontal = r.isHorizontal;
  }
});

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const shortcutPrefix = isMac ? 'Cmd+Shift' : 'Ctrl+Shift';
console.log(`Prêt! ${shortcutPrefix}+R (rotation) | ${shortcutPrefix}+P (PiP)`);
