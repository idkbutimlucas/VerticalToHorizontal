// content.js – compatible popup.js, PiP stable et rotation fonctionnelle
let isHorizontal = false;
let pipActive = false;
let canvas = null;
let ctx = null;
let pipVideo = null;
let sourceVideo = null;
let animating = false;
let originalStyle = null;

console.log('[V2H] Extension chargée v9.0');

// === DÉTECTION VIDÉO ===
function getVideo() {
  if (window.location.hostname.includes('youtube.com')) {
    return document.querySelector('ytd-reel-video-renderer[is-active] video') || document.querySelector('video');
  }
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
  return null;
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
  restoreSourceVideo();
  sourceVideo = null;
  if (pipVideo && pipVideo.srcObject) pipVideo.srcObject.getTracks().forEach(t=>t.stop());
  if (document.pictureInPictureElement) document.exitPictureInPicture().catch(()=>{});
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
    console.error('[V2H] Erreur PiP:', e);
    cleanup();
    return false;
  }

  setupMediaControls(video, pipVideo);
  observeFeed();
  pipActive = true;
  return true;
}

// === STOP PiP ===
async function stopPiP() { cleanup(); return true; }

// === TOGGLE ORIENTATION ===
async function toggleOrientation() { isHorizontal=!isHorizontal; return isHorizontal; }

// === OBSERVE FEED TikTok ===
function observeFeed() {
  if (!window.location.hostname.includes('tiktok.com')) return;
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting && e.target!==sourceVideo){ sourceVideo=e.target; }
    });
  }, {threshold: 0.7});
  const observeAll = () => document.querySelectorAll('video').forEach(v=>observer.observe(v));
  observeAll();
  const mutationObs = new MutationObserver(()=>observeAll());
  mutationObs.observe(document.body,{childList:true, subtree:true});
}

// === EVENTS ===
document.addEventListener('leavepictureinpicture', cleanup);

// === RACCORCIS CLAVIER ===
document.addEventListener('keydown', async e => {
  const key = e.key.toLowerCase();
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const mod = isMac ? e.metaKey : e.ctrlKey;

  if (mod && e.shiftKey && key==='p') {
    e.preventDefault();
    pipActive ? await stopPiP() : await startPiP();
  }

  if (mod && e.shiftKey && key==='r') {
    e.preventDefault();
    await toggleOrientation();
  }
});

// === COMMUNICATION AVEC POPUP ===
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'togglePiP') {
    if (pipActive) stopPiP().then(()=>sendResponse({ success: true, active: false }));
    else startPiP().then(ok=>sendResponse({ success: ok, active: ok }));
    return true;
  }
  if (req.action === 'getPiPStatus') {
    sendResponse({ active: pipActive, isHorizontal });
    return true;
  }
  if (req.action === 'toggleOrientation') {
    toggleOrientation().then(h=>sendResponse({ success:true, isHorizontal:h }));
    return true;
  }
});
