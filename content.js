// content.js – PiP universel avec rotation en temps réel
let isHorizontal = false;  // Toggle rotation pour vidéos verticales
let pipActive = false;
let canvas = null;
let ctx = null;
let pipVideo = null;
let sourceVideo = null;
let animating = false;
let originalStyle = null;

// === PIP OVERLAY BUTTON ===
const PIP_BUTTON_CLASS = 'pip-plus-overlay-btn';
const PIP_BUTTON_YT_CLASS = 'pip-plus-yt-btn';
const PIP_CONTAINER_CLASS = 'pip-plus-container';

// Inject styles once
function injectOverlayStyles() {
  if (document.getElementById('pip-plus-styles')) return;

  const style = document.createElement('style');
  style.id = 'pip-plus-styles';
  style.textContent = `
    /* Generic overlay button for non-YouTube sites */
    .${PIP_BUTTON_CLASS} {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s, background 0.2s;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
    }
    .${PIP_BUTTON_CLASS}:hover {
      background: rgba(0, 0, 0, 0.8);
    }
    .${PIP_BUTTON_CLASS}.active {
      background: rgba(114, 47, 55, 0.9);
    }
    .${PIP_BUTTON_CLASS}.active:hover {
      background: rgba(114, 47, 55, 1);
    }
    .${PIP_BUTTON_CLASS} svg {
      width: 100%;
      height: 100%;
      fill: white;
    }
    .${PIP_CONTAINER_CLASS}:hover .${PIP_BUTTON_CLASS},
    .${PIP_BUTTON_CLASS}.visible {
      opacity: 1;
    }

    /* YouTube native-style button (classic player) */
    .${PIP_BUTTON_YT_CLASS} {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      width: 48px;
      height: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      opacity: 0.9;
      transition: opacity 0.1s;
    }
    .${PIP_BUTTON_YT_CLASS}:hover {
      opacity: 1;
    }
    .${PIP_BUTTON_YT_CLASS}.active svg {
      fill: #f00;
    }
    .${PIP_BUTTON_YT_CLASS} svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    /* YouTube Shorts action button style - matches native buttons */
    .pip-plus-shorts-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      margin: 16px 0 0 0;
      color: white;
      font-size: 12px;
      font-family: 'Roboto', 'Arial', sans-serif;
      height: 72px;
      width: 64px;
    }
    .pip-plus-shorts-btn:hover {
      opacity: 0.8;
    }
    .pip-plus-shorts-btn.active svg {
      fill: #f00;
    }
    .pip-plus-shorts-btn svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    .pip-plus-shorts-btn .pip-plus-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .pip-plus-shorts-btn:hover .pip-plus-icon-circle {
      background: rgba(255, 255, 255, 0.2);
    }
    .pip-plus-shorts-btn.active .pip-plus-icon-circle {
      background: rgba(255, 0, 0, 0.2);
    }
    .pip-plus-shorts-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `;
  document.head.appendChild(style);
}

// PiP icon SVG
const PIP_ICON_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
</svg>`;

// Rotation icon SVG
const ROTATE_ICON_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/>
</svg>`;

// Check if we're on YouTube
function isYouTube() {
  return window.location.hostname.includes('youtube.com');
}

// Check if we're on YouTube Shorts
function isYouTubeShorts() {
  return window.location.hostname.includes('youtube.com') &&
         window.location.pathname.includes('/shorts/');
}

// Inject YouTube native-style button
function injectYouTubeButton() {
  // Skip if already injected
  if (document.querySelector(`.${PIP_BUTTON_YT_CLASS}`)) return;

  // Find the right controls container
  const rightControls = document.querySelector('.ytp-right-controls');
  if (!rightControls) return;

  // Find the autoplay button to insert after it
  const autoplayBtn = rightControls.querySelector('.ytp-autonav-toggle-button-container') ||
                      rightControls.querySelector('.ytp-right-controls-left');

  // Create button
  const btn = document.createElement('button');
  btn.className = `ytp-button ${PIP_BUTTON_YT_CLASS}`;
  btn.title = 'Picture-in-Picture Plus';
  btn.innerHTML = PIP_ICON_SVG;

  // Handle click
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (pipActive) {
      await stopPiP();
      btn.classList.remove('active');
    } else {
      const video = getVideo();
      if (video) {
        sourceVideo = video;
        const success = await startPiP();
        if (success) {
          btn.classList.add('active');
        }
      }
    }
    updateAllButtons();
  });

  // Insert after autoplay button or at the beginning
  if (autoplayBtn && autoplayBtn.nextSibling) {
    rightControls.insertBefore(btn, autoplayBtn.nextSibling);
  } else {
    rightControls.insertBefore(btn, rightControls.firstChild);
  }

  return btn;
}

// Inject YouTube Shorts buttons (PiP + Rotation)
function injectYouTubeShortsButtons() {
  // Skip if already injected
  if (document.querySelector('.pip-plus-shorts-container')) return;

  // Find the action bar in the active Shorts video
  const actionBar = document.querySelector('ytd-reel-video-renderer[is-active] reel-action-bar-view-model') ||
                    document.querySelector('reel-action-bar-view-model');
  if (!actionBar) return;

  // Create container for our buttons
  const container = document.createElement('div');
  container.className = 'pip-plus-shorts-container';

  // Create PiP button
  const pipBtn = document.createElement('button');
  pipBtn.className = 'pip-plus-shorts-btn pip-plus-shorts-pip';
  pipBtn.innerHTML = `
    <div class="pip-plus-icon-circle">${PIP_ICON_SVG}</div>
    <span>PiP</span>
  `;
  pipBtn.title = 'Picture-in-Picture';

  pipBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (pipActive) {
      await stopPiP();
    } else {
      const video = getVideo();
      if (video) {
        sourceVideo = video;
        await startPiP();
      }
    }
    updateAllButtons();
  });

  // Create Rotation button
  const rotateBtn = document.createElement('button');
  rotateBtn.className = 'pip-plus-shorts-btn pip-plus-shorts-rotate';
  rotateBtn.innerHTML = `
    <div class="pip-plus-icon-circle">${ROTATE_ICON_SVG}</div>
    <span>Rotate</span>
  `;
  rotateBtn.title = 'Rotation horizontale';

  rotateBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleOrientation();
    updateAllButtons();
  });

  container.appendChild(pipBtn);
  container.appendChild(rotateBtn);

  // Insert after the action bar
  actionBar.parentElement.appendChild(container);
}

// Inject PiP button on a video
function injectPiPButton(video) {
  // Skip if already has button or is our pipVideo
  if (video.dataset.pipButtonInjected || video === pipVideo) return;

  // On YouTube Shorts, use sidebar buttons
  if (isYouTubeShorts()) {
    video.dataset.pipButtonInjected = 'true';
    injectYouTubeShortsButtons();
    return;
  }

  // On YouTube classic, use native-style button in controls
  if (isYouTube()) {
    video.dataset.pipButtonInjected = 'true';
    injectYouTubeButton();
    return;
  }

  // Skip small or hidden videos
  const rect = video.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 100) return;

  const computedStyle = window.getComputedStyle(video);
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return;

  video.dataset.pipButtonInjected = 'true';

  // Create button
  const btn = document.createElement('button');
  btn.className = PIP_BUTTON_CLASS;
  btn.innerHTML = PIP_ICON_SVG;
  btn.title = 'Picture-in-Picture';

  // Handle click
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (pipActive) {
      await stopPiP();
      btn.classList.remove('active');
    } else {
      // Set this video as source before starting
      sourceVideo = video;
      const success = await startPiP();
      if (success) {
        btn.classList.add('active');
      }
    }
    updateAllButtons();
  });

  // Find a suitable container with proper dimensions
  let container = null;
  let parent = video.parentElement;

  // Search up to 5 levels for a container with actual height
  for (let i = 0; i < 5 && parent; i++) {
    const parentRect = parent.getBoundingClientRect();
    const parentStyle = window.getComputedStyle(parent);

    // Good container: has height, position relative/absolute, and no overflow hidden
    if (parentRect.height > 50 &&
        parentStyle.position !== 'static' &&
        parentStyle.overflow !== 'hidden') {
      container = parent;
      break;
    }

    // Accept container with height even if overflow hidden, but prefer without
    if (parentRect.height > 50 && parentStyle.position !== 'static' && !container) {
      container = parent;
    }

    parent = parent.parentElement;
  }

  // If found a good container, use it
  if (container) {
    container.classList.add(PIP_CONTAINER_CLASS);
    container.appendChild(btn);
  } else {
    // Fallback: position button absolutely on body, update position on scroll/resize
    btn.style.position = 'fixed';
    document.body.appendChild(btn);

    const updatePosition = () => {
      const videoRect = video.getBoundingClientRect();
      btn.style.top = (videoRect.bottom - 46) + 'px';
      btn.style.left = (videoRect.right - 46) + 'px';
      btn.style.bottom = 'auto';
      btn.style.right = 'auto';
    };

    updatePosition();

    // Update on scroll and resize
    const scrollHandler = () => requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', scrollHandler, { passive: true });

    // Store cleanup reference
    video._pipButtonCleanup = () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', scrollHandler);
    };

    // Show on video hover using mouse events
    video.addEventListener('mouseenter', () => btn.classList.add('visible'));
    video.addEventListener('mouseleave', (e) => {
      if (!e.relatedTarget || !btn.contains(e.relatedTarget)) {
        btn.classList.remove('visible');
      }
    });
    btn.addEventListener('mouseenter', () => btn.classList.add('visible'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('visible'));
  }

  // Store reference to button on video
  video._pipButton = btn;
}

// Update all buttons state
function updateAllButtons() {
  // Update overlay buttons
  document.querySelectorAll(`.${PIP_BUTTON_CLASS}`).forEach(btn => {
    if (pipActive) {
      btn.classList.add('visible');
      // Only the active video's button should be marked active
      const video = btn.parentElement?.querySelector('video');
      if (video === sourceVideo) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    } else {
      btn.classList.remove('active', 'visible');
    }
  });

  // Update YouTube classic button
  const ytBtn = document.querySelector(`.${PIP_BUTTON_YT_CLASS}`);
  if (ytBtn) {
    if (pipActive) {
      ytBtn.classList.add('active');
    } else {
      ytBtn.classList.remove('active');
    }
  }

  // Update YouTube Shorts buttons
  const shortsPipBtn = document.querySelector('.pip-plus-shorts-pip');
  if (shortsPipBtn) {
    if (pipActive) {
      shortsPipBtn.classList.add('active');
    } else {
      shortsPipBtn.classList.remove('active');
    }
  }

  const shortsRotateBtn = document.querySelector('.pip-plus-shorts-rotate');
  if (shortsRotateBtn) {
    if (isHorizontal) {
      shortsRotateBtn.classList.add('active');
    } else {
      shortsRotateBtn.classList.remove('active');
    }
  }
}

// Observe videos on page
function observeVideosForOverlay() {
  injectOverlayStyles();

  // Inject on existing videos
  const injectAll = () => {
    document.querySelectorAll('video').forEach(video => {
      if (video !== pipVideo) {
        injectPiPButton(video);
      }
    });
  };

  injectAll();

  // Observe new videos
  const observer = new MutationObserver(() => {
    injectAll();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also check when videos become ready
  document.addEventListener('loadedmetadata', (e) => {
    if (e.target.tagName === 'VIDEO') {
      injectPiPButton(e.target);
    }
  }, true);
}

// Start observing when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeVideosForOverlay);
} else {
  observeVideosForOverlay();
}

// Raccourcis clavier (chargés depuis le storage)
let shortcuts = {
  pip: { ctrl: true, shift: true, alt: false, key: 'p' },
  rotation: { ctrl: true, shift: true, alt: false, key: 'e' }
};

// Load custom shortcuts
async function loadShortcuts() {
  try {
    const result = await chrome.storage.sync.get(['shortcuts']);
    if (result.shortcuts) {
      shortcuts = result.shortcuts;
    }
  } catch (error) {
    // Silently handle error
  }
}

// Load shortcuts on startup
loadShortcuts();

// === UNIVERSAL VIDEO DETECTION ===
function getVideo() {
  // Priority 1: YouTube Shorts and Reels
  if (window.location.hostname.includes('youtube.com')) {
    const reelVideo = document.querySelector('ytd-reel-video-renderer[is-active] video');
    if (reelVideo) return reelVideo;
  }

  // Priority 2: TikTok (best selection algorithm)
  if (window.location.hostname.includes('tiktok.com')) {
    const videos = Array.from(document.querySelectorAll('video'));
    if (!videos.length) return null;
    let bestVideo = null;
    let bestScore = -1;
    for (const video of videos) {
      if (!video.videoWidth || video.readyState < 2) continue;
      const rect = video.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const score = (video.paused ? 0 : 1000) + (visibleHeight / rect.height) * 100;
      if (score > bestScore) { bestScore = score; bestVideo = video; }
    }
    return bestVideo || videos[0];
  }

  // Priority 3: Universal video search
  const videos = Array.from(document.querySelectorAll('video'));
  if (!videos.length) return null;

  // Find the most relevant video
  let bestVideo = null;
  let bestScore = -1;

  for (const video of videos) {
    // Ignore videos without dimensions or not ready
    if (!video.videoWidth || video.readyState < 2) continue;

    // Ignore hidden videos
    const computedStyle = window.getComputedStyle(video);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') continue;

    const rect = video.getBoundingClientRect();

    // Ignore off-screen or very small videos
    if (rect.width < 50 || rect.height < 50) continue;

    // Calculate score based on: playback, visibility, size
    const isPlaying = !video.paused && !video.ended;
    const area = rect.width * rect.height;
    const viewportArea = window.innerWidth * window.innerHeight;
    const sizeRatio = area / viewportArea;

    // Check if video is in viewport
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

    let score = 0;
    if (isPlaying) score += 1000;  // High priority for playing videos
    if (isInViewport) score += 500;  // Priority for visible videos
    score += sizeRatio * 100;  // Bonus for large videos

    if (score > bestScore) {
      bestScore = score;
      bestVideo = video;
    }
  }

  // If no optimal video, take the first visible one
  return bestVideo || videos.find(v => v.videoWidth && v.readyState >= 2) || videos[0];
}

// === MEDIA CONTROLS ===
function setupMediaControls(video, pipVid = null) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: 'Vertical To Horizontal',
    artist: window.location.hostname.includes('tiktok') ? 'TikTok' : 'YouTube Shorts'
  });
  navigator.mediaSession.setActionHandler('play', () => { video.play().catch(()=>{}); if(pipVid) pipVid.play().catch(()=>{}); });
  navigator.mediaSession.setActionHandler('pause', () => { video.pause(); if(pipVid) pipVid.pause(); });
  navigator.mediaSession.setActionHandler('seekbackward', d => { video.currentTime = Math.max(video.currentTime - (d.seekOffset||10),0); });
  navigator.mediaSession.setActionHandler('seekforward', d => { video.currentTime = Math.min(video.currentTime + (d.seekOffset||10), video.duration); });
}

// === HIDE / RESTORE ===
function hideSourceVideo(video) {
  originalStyle = { opacity: video.style.opacity || '', visibility: video.style.visibility || '' };
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

// === ANIMATION ===
function animate() {
  if (!animating || !ctx || !sourceVideo) return;
  const w = sourceVideo.videoWidth;
  const h = sourceVideo.videoHeight;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isHorizontal && h > w) {
    // Portrait → paysage
    canvas.width = h;
    canvas.height = w;
    ctx.translate(0, canvas.height);
    ctx.rotate(-Math.PI/2);
    ctx.drawImage(sourceVideo, 0, 0, w, h);
  } else if (!isHorizontal && w > h) {
    // Paysage → portrait
    canvas.width = h;
    canvas.height = w;
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI/2);
    ctx.drawImage(sourceVideo, 0, 0, w, h);
  } else {
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
  requestAnimationFrame(animate);
}

// === CLEANUP ===
function cleanup() {
  animating = false;

  // Restore source video (always safe to do)
  restoreSourceVideo();

  sourceVideo = null;

  // Clean up canvas stream (rotation mode only)
  if (pipVideo && pipVideo.srcObject) {
    pipVideo.srcObject.getTracks().forEach(t=>t.stop());
  }

  // Exit PiP if active
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(()=>{});
  }

  // Clean up media controls
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('play',null);
    navigator.mediaSession.setActionHandler('pause',null);
    navigator.mediaSession.setActionHandler('seekbackward',null);
    navigator.mediaSession.setActionHandler('seekforward',null);
  }

  pipActive = false;
}

// === START PiP ===
async function startPiP() {
  if (pipActive) return false;
  const video = getVideo();
  if (!video || !video.videoWidth) return false;

  sourceVideo = video;

  // Automatic detection: vertical video?
  const isVerticalVideo = video.videoHeight > video.videoWidth;

  // Detect scrolling feed platforms (TikTok, YouTube Shorts)
  const isTikTok = window.location.hostname.includes('tiktok.com');
  const isYouTubeShorts = window.location.hostname.includes('youtube.com') &&
                          window.location.pathname.includes('/shorts/');

  // Use canvas/stream mode if:
  // 1. It's TikTok or YouTube Shorts (need to follow feed)
  // 2. OR if rotation enabled for vertical video
  const needsCanvasMode = isTikTok || isYouTubeShorts || (isVerticalVideo && isHorizontal);

  // Classic PiP mode for normal sites without rotation
  if (!needsCanvasMode) {
    try {
      await video.requestPictureInPicture();
      setupMediaControls(video);
      pipActive = true;
      return true;
    } catch(e) {
      return false;
    }
  }

  // Canvas/stream mode: for TikTok, YouTube Shorts, or rotation
  hideSourceVideo(video);

  if (!canvas) {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
  }

  if (!pipVideo) {
    pipVideo = document.createElement('video');
    pipVideo.muted = true;
    pipVideo.playsInline = true;
    pipVideo.style.display = 'none';
    document.body.appendChild(pipVideo);
  }

  pipVideo.srcObject = canvas.captureStream(30);
  animating = true;
  animate();

  await pipVideo.play();
  try {
    await pipVideo.requestPictureInPicture();
  } catch(e){
    cleanup();
    return false;
  }

  setupMediaControls(video, pipVideo);

  // Observe feed for TikTok and YouTube Shorts
  if (isTikTok || isYouTubeShorts) {
    observeFeed();
  }

  pipActive = true;
  return true;
}

// === STOP PiP ===
async function stopPiP() { cleanup(); return true; }

// === TOGGLE ORIENTATION ===
async function toggleOrientation() {
  isHorizontal = !isHorizontal;

  // If PiP is active, restart it with new mode
  if (pipActive) {
    await stopPiP();
    // Small delay to ensure previous PiP is closed
    await new Promise(resolve => setTimeout(resolve, 100));
    await startPiP();
  }

  return isHorizontal;
}


// === OBSERVE FEED (TikTok & YouTube Shorts) ===
function observeFeed() {
  const isTikTok = window.location.hostname.includes('tiktok.com');
  const isYouTubeShorts = window.location.hostname.includes('youtube.com');

  if (!isTikTok && !isYouTubeShorts) return;

  // Observe videos that become visible
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting && entry.target !== sourceVideo && entry.target.readyState >= 2) {
        sourceVideo = entry.target;
      }
    });
  }, {threshold: 0.7});

  // Observe all existing and future videos
  const observeAll = () => {
    document.querySelectorAll('video').forEach(v => {
      if (v !== pipVideo) {  // Don't observe our own PiP video
        observer.observe(v);
      }
    });
  };

  observeAll();

  // Observe new videos added to DOM
  const mutationObs = new MutationObserver(() => observeAll());
  mutationObs.observe(document.body, {childList: true, subtree: true});
}

// === EVENTS ===
document.addEventListener('leavepictureinpicture', () => {
  cleanup();
  updateAllButtons();
});

// === KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', async e => {
  const key = e.key.toLowerCase();
  // Detect Mac vs Windows/Linux for modifiers
  const isMac = navigator.userAgentData?.platform === 'macOS' || /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const ctrlPressed = isMac ? e.metaKey : e.ctrlKey;

  // Check PiP shortcut
  const pipShortcut = shortcuts.pip;
  const isPipShortcut =
    key === pipShortcut.key &&
    (!pipShortcut.ctrl || ctrlPressed) &&
    (!pipShortcut.shift || e.shiftKey) &&
    (!pipShortcut.alt || e.altKey);

  if (isPipShortcut) {
    e.preventDefault();
    pipActive ? await stopPiP() : await startPiP();
    updateAllButtons();
    return;
  }

  // Check Rotation shortcut
  const rotationShortcut = shortcuts.rotation;
  const isRotationShortcut =
    key === rotationShortcut.key &&
    (!rotationShortcut.ctrl || ctrlPressed) &&
    (!rotationShortcut.shift || e.shiftKey) &&
    (!rotationShortcut.alt || e.altKey);

  if (isRotationShortcut) {
    e.preventDefault();
    await toggleOrientation();
    updateAllButtons();
    return;
  }
});

// === COMMUNICATION WITH POPUP ===
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.action === 'togglePiP') {
    if (pipActive) stopPiP().then(()=>{ updateAllButtons(); sendResponse({ success: true, active: false }); });
    else startPiP().then(ok=>{ updateAllButtons(); sendResponse({ success: ok, active: ok }); });
    return true;
  }
  if (req.action === 'getPiPStatus') {
    // Detect if current video is vertical
    const video = getVideo();
    const isVerticalVideo = video && video.videoHeight > video.videoWidth;
    sendResponse({ active: pipActive, isHorizontal, isVerticalVideo });
    return true;
  }
  if (req.action === 'toggleOrientation') {
    toggleOrientation().then(h=>sendResponse({ success:true, isHorizontal:h }));
    return true;
  }
  if (req.action === 'shortcutsUpdated') {
    // Reload shortcuts when modified
    loadShortcuts();
    return true;
  }
});
