// content.js – PiP universel avec rotation en temps réel
let isHorizontal = false;  // Toggle rotation pour vidéos verticales
let pipActive = false;
let canvas = null;
let ctx = null;
let pipVideo = null;
let sourceVideo = null;
let animating = false;
let originalStyle = null;

// Raccourcis clavier (chargés depuis le storage)
let shortcuts = {
  pip: { ctrl: true, shift: true, alt: false, key: 'p' },
  rotation: { ctrl: true, shift: true, alt: false, key: 'r' }
};

console.log('[Universal PiP] Extension loaded v10.0');

// Load custom shortcuts
async function loadShortcuts() {
  try {
    const result = await chrome.storage.sync.get(['shortcuts']);
    if (result.shortcuts) {
      shortcuts = result.shortcuts;
      console.log('[Universal PiP] Shortcuts loaded:', shortcuts);
    }
  } catch (error) {
    console.error('[Universal PiP] Error loading shortcuts:', error);
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
      console.log('[Universal PiP] Classic mode enabled', {
        dimensions: `${video.videoWidth}x${video.videoHeight}`,
        isVertical: isVerticalVideo
      });
      return true;
    } catch(e) {
      console.error('[Universal PiP] Classic PiP error:', e);
      return false;
    }
  }

  // Canvas/stream mode: for TikTok, YouTube Shorts, or rotation
  console.log('[Universal PiP] Canvas mode enabled', {
    platform: isTikTok ? 'TikTok' : isYouTubeShorts ? 'YouTube Shorts' : 'Other',
    rotation: isHorizontal,
    isVertical: isVerticalVideo
  });

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
    console.error('[Universal PiP] Canvas PiP error:', e);
    cleanup();
    return false;
  }

  setupMediaControls(video, pipVideo);

  // Observe feed for TikTok and YouTube Shorts
  if (isTikTok || isYouTubeShorts) {
    observeFeed();
  }

  pipActive = true;
  console.log('[Universal PiP] Canvas PiP enabled');
  return true;
}

// === STOP PiP ===
async function stopPiP() { cleanup(); return true; }

// === TOGGLE ORIENTATION ===
async function toggleOrientation() {
  isHorizontal = !isHorizontal;
  console.log('[Universal PiP] Rotation:', isHorizontal ? 'Enabled' : 'Disabled');

  // If PiP is active, restart it with new mode
  if (pipActive) {
    console.log('[Universal PiP] Restarting PiP with new mode...');
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

  console.log('[Universal PiP] Feed observation enabled');

  // Observe videos that become visible
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting && entry.target !== sourceVideo && entry.target.readyState >= 2) {
        console.log('[Universal PiP] Video change detected');
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
document.addEventListener('leavepictureinpicture', cleanup);

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
    return;
  }
});

// === COMMUNICATION WITH POPUP ===
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.action === 'togglePiP') {
    if (pipActive) stopPiP().then(()=>sendResponse({ success: true, active: false }));
    else startPiP().then(ok=>sendResponse({ success: ok, active: ok }));
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
