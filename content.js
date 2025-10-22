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
    console.log('========================================');
    console.log('🔍 [TikTok] DÉBUT DÉTECTION VIDÉO');
    console.log('========================================');

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

    console.log('📋 Stratégie 1: Test des sélecteurs spécifiques...');
    for (const selector of activeSelectors) {
      const video = document.querySelector(selector);
      console.log(`   - Selector: ${selector}`);
      console.log(`     Résultat: ${video ? 'TROUVÉ' : 'RIEN'} ${video && video.videoWidth > 0 ? '(dimensions OK)' : video ? '(pas de dimensions)' : ''}`);

      if (video && video.videoWidth > 0) {
        console.log(`✅ SÉLECTIONNÉ via stratégie 1: ${selector}`);
        console.log(`   src: ${video.src || video.currentSrc || 'N/A'}`);
        console.log(`   paused: ${video.paused}, time: ${video.currentTime.toFixed(2)}s`);
        console.log('========================================');
        return video;
      }
    }

    // Stratégie 2: Analyser TOUTES les vidéos
    const videos = document.querySelectorAll('video');
    console.log(`\n📋 Stratégie 2: Analyse de ${videos.length} vidéo(s) trouvée(s)`);

    videos.forEach((video, index) => {
      console.log(`\n   📹 Vidéo #${index + 1}:`);
      console.log(`      - Dimensions: ${video.videoWidth}x${video.videoHeight}`);
      console.log(`      - Paused: ${video.paused}`);
      console.log(`      - CurrentTime: ${video.currentTime.toFixed(2)}s`);
      console.log(`      - Src: ${(video.src || video.currentSrc || 'N/A').substring(0, 80)}...`);

      // Vérifier les attributs du parent
      let parent = video.parentElement;
      let ariaHidden = false;
      let hasDataE2E = false;
      let parentInfo = [];

      while (parent && parent !== document.body && parentInfo.length < 5) {
        const aria = parent.getAttribute('aria-hidden');
        const dataE2E = parent.getAttribute('data-e2e');

        if (aria === 'true') {
          ariaHidden = true;
          parentInfo.push(`aria-hidden=true (${parent.tagName})`);
        }
        if (dataE2E) {
          hasDataE2E = true;
          parentInfo.push(`data-e2e="${dataE2E}" (${parent.tagName})`);
        }

        parent = parent.parentElement;
      }

      console.log(`      - Aria-hidden parent: ${ariaHidden ? '❌ OUI' : '✅ NON'}`);
      console.log(`      - Data-e2e parent: ${hasDataE2E ? '✅ OUI' : '❌ NON'}`);
      if (parentInfo.length > 0) {
        console.log(`      - Parents: ${parentInfo.join(', ')}`);
      }

      // Position dans le viewport
      const rect = video.getBoundingClientRect();
      const centerY = window.innerHeight / 2;
      const videoCenter = rect.top + rect.height / 2;
      const distanceFromCenter = Math.abs(centerY - videoCenter);

      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(window.innerHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

      console.log(`      - Position: top=${rect.top.toFixed(0)}px, center=${videoCenter.toFixed(0)}px`);
      console.log(`      - Distance du centre écran: ${distanceFromCenter.toFixed(0)}px`);
      console.log(`      - Visibilité: ${(visibilityRatio * 100).toFixed(1)}%`);
    });

    // Chercher la vidéo qui n'est PAS en aria-hidden ET qui joue
    console.log('\n🔍 Recherche vidéo: NOT aria-hidden + playing...');
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
        console.log(`✅ SÉLECTIONNÉ via stratégie 2 (not aria-hidden + playing)`);
        console.log(`   src: ${(video.src || video.currentSrc || 'N/A').substring(0, 80)}...`);
        console.log(`   time: ${video.currentTime.toFixed(2)}s`);
        console.log('========================================');
        return video;
      }
    }

    // Stratégie 3: Ratio de visibilité (fallback)
    console.log('\n📋 Stratégie 3: Fallback sur visibilité...');
    let bestVideo = null;
    let bestVisibilityRatio = 0;
    let bestIndex = -1;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
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
        bestIndex = i;
      }
    }

    if (bestVideo) {
      console.log(`✅ SÉLECTIONNÉ via stratégie 3 (fallback visibilité)`);
      console.log(`   Vidéo #${bestIndex + 1} avec ${(bestVisibilityRatio * 100).toFixed(1)}% de visibilité`);
      console.log(`   src: ${(bestVideo.src || bestVideo.currentSrc || 'N/A').substring(0, 80)}...`);
      console.log('========================================');
      return bestVideo;
    }

    // Dernier fallback
    console.log('⚠️ FALLBACK FINAL: Première vidéo trouvée');
    console.log('========================================');
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
