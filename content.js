// Vertical To Horizontal - v4.0 Clean

let isHorizontal = false;
let pipActive = false;
let canvas = null;
let ctx = null;
let pipVideo = null;
let sourceVideo = null;
let animating = false;

console.log('[V2H] Extension chargée');

// === DÉTECTION VIDÉO ===

function getVideo() {
  // YOUTUBE SHORTS
  if (window.location.hostname.includes('youtube.com')) {
    return document.querySelector('ytd-reel-video-renderer[is-active] video') ||
           document.querySelector('video');
  }

  // TIKTOK
  if (window.location.hostname.includes('tiktok.com')) {
    const videos = Array.from(document.querySelectorAll('video'));

    if (videos.length === 0) return null;

    console.log(`[V2H TikTok] ${videos.length} vidéos trouvées`);

    // Trouver la vidéo la plus visible dans le viewport
    let bestVideo = null;
    let bestScore = -1;

    for (const video of videos) {
      if (!video.videoWidth) continue;

      const rect = video.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculer combien de la vidéo est visible
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = visibleHeight / rect.height;

      // Score: visibilité + bonus si en lecture
      const score = visibilityRatio * 100 + (video.paused ? 0 : 10);

      console.log(`  Vidéo: ${(visibilityRatio * 100).toFixed(0)}% visible, ${video.paused ? 'pause' : 'play'}, score=${score.toFixed(0)}`);

      if (score > bestScore) {
        bestScore = score;
        bestVideo = video;
      }
    }

    if (bestVideo) {
      console.log(`[V2H TikTok] ✓ Vidéo sélectionnée (score=${bestScore.toFixed(0)})`);
      return bestVideo;
    }

    return videos[0];
  }

  return null;
}

// === MEDIA CONTROLS ===

function setupMediaControls(video, pipVid = null) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: 'Vertical To Horizontal',
    artist: window.location.hostname.includes('tiktok') ? 'TikTok' : 'YouTube Shorts'
  });

  navigator.mediaSession.setActionHandler('play', () => {
    video.play().catch(() => {});
    if (pipVid) pipVid.play().catch(() => {});
  });

  navigator.mediaSession.setActionHandler('pause', () => {
    video.pause();
    if (pipVid) pipVid.pause();
  });

  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    video.currentTime = Math.max(video.currentTime - (details.seekOffset || 10), 0);
  });

  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    video.currentTime = Math.min(video.currentTime + (details.seekOffset || 10), video.duration);
  });
}

// === ANIMATION ===

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

// === HIDE/RESTORE VIDEO ===

let originalStyle = null;

function hideSourceVideo(video) {
  originalStyle = {
    opacity: video.style.opacity || '',
    visibility: video.style.visibility || ''
  };
  video.style.opacity = '0';
  video.style.visibility = 'hidden';
}

function restoreSourceVideo() {
  if (sourceVideo && originalStyle) {
    sourceVideo.style.opacity = originalStyle.opacity;
    sourceVideo.style.visibility = originalStyle.visibility;
    originalStyle = null;
  }
}

// === CLEANUP ===

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

// === START PIP ===

async function startPiP() {
  if (pipActive) return false;

  const video = getVideo();
  if (!video || !video.videoWidth) {
    console.log('[V2H] Pas de vidéo trouvée');
    return false;
  }

  const w = video.videoWidth;
  const h = video.videoHeight;
  const vertical = h > w;

  console.log(`[V2H] Démarrage PiP (${w}x${h}, ${vertical ? 'vertical' : 'horizontal'}, rotation=${isHorizontal})`);

  try {
    // Mode normal (pas de rotation)
    if (!isHorizontal || !vertical) {
      await video.requestPictureInPicture();
      setupMediaControls(video);
      pipActive = true;
      console.log('[V2H] PiP mode normal activé');
      return true;
    }

    // Mode rotation
    sourceVideo = video;
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

    // Sync play/pause
    video.addEventListener('play', () => {
      if (pipVideo) pipVideo.play().catch(() => {});
    });
    video.addEventListener('pause', () => {
      if (pipVideo) pipVideo.pause();
    });

    setupMediaControls(video, pipVideo);
    pipActive = true;
    console.log('[V2H] PiP mode rotation activé');
    return true;

  } catch (error) {
    console.error('[V2H] Erreur PiP:', error);
    cleanup();
    return false;
  }
}

// === STOP PIP ===

async function stopPiP() {
  console.log('[V2H] Arrêt PiP');
  cleanup();
  return true;
}

// === TOGGLE ORIENTATION ===

async function toggleOrientation() {
  isHorizontal = !isHorizontal;

  try {
    chrome.storage.local.set({ isHorizontal });
  } catch (e) {}

  console.log('[V2H] Orientation:', isHorizontal ? 'horizontal' : 'vertical');

  if (pipActive) {
    await stopPiP();
    await new Promise(r => setTimeout(r, 200));
    await startPiP();
  }

  return isHorizontal;
}

// === EVENTS ===

document.addEventListener('leavepictureinpicture', () => {
  cleanup();
});

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

// === KEYBOARD SHORTCUTS ===

document.addEventListener('keydown', async (e) => {
  const key = e.key.toLowerCase();
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? e.metaKey : e.ctrlKey;

  // Cmd+Shift+P / Ctrl+Shift+P : Toggle PiP
  if (modifierKey && e.shiftKey && key === 'p') {
    e.preventDefault();
    e.stopPropagation();
    console.log('[V2H] Raccourci PiP');
    pipActive ? await stopPiP() : await startPiP();
    return;
  }

  // Cmd+Shift+R / Ctrl+Shift+R : Toggle Rotation
  if (modifierKey && e.shiftKey && key === 'r') {
    e.preventDefault();
    e.stopPropagation();
    console.log('[V2H] Raccourci Rotation');
    await toggleOrientation();
    return;
  }
}, true);

// === LOAD PREFERENCES ===

chrome.storage?.local?.get(['isHorizontal'], (r) => {
  if (r.isHorizontal !== undefined) {
    isHorizontal = r.isHorizontal;
    console.log('[V2H] Préférence chargée:', isHorizontal ? 'horizontal' : 'vertical');
  }
});

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const prefix = isMac ? 'Cmd+Shift' : 'Ctrl+Shift';
console.log(`[V2H] Prêt! ${prefix}+R (rotation) | ${prefix}+P (PiP)`);
