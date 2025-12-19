// pip-core.js - Core PiP functionality (start, stop, canvas mode, animation)

// === MEDIA CONTROLS ===

function setupMediaControls(video, pipVid = null) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: 'Picture-in-Picture Plus',
    artist: isTikTok() ? 'TikTok' : 'YouTube'
  });
  navigator.mediaSession.setActionHandler('play', () => {
    video.play().catch(() => {});
    if (pipVid) pipVid.play().catch(() => {});
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    video.pause();
    if (pipVid) pipVid.pause();
  });
  navigator.mediaSession.setActionHandler('seekbackward', d => {
    video.currentTime = Math.max(video.currentTime - (d.seekOffset || 10), 0);
  });
  navigator.mediaSession.setActionHandler('seekforward', d => {
    video.currentTime = Math.min(video.currentTime + (d.seekOffset || 10), video.duration);
  });
}

// === HIDE / RESTORE SOURCE VIDEO ===

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

// === CANVAS ANIMATION ===

function animate() {
  if (!animating || !ctx || !sourceVideo) return;
  const w = sourceVideo.videoWidth;
  const h = sourceVideo.videoHeight;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isHorizontal && h > w) {
    // Portrait → landscape
    canvas.width = h;
    canvas.height = w;
    ctx.translate(0, canvas.height);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(sourceVideo, 0, 0, w, h);
  } else if (!isHorizontal && w > h) {
    // Landscape → portrait
    canvas.width = h;
    canvas.height = w;
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
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

  // Restore source video
  restoreSourceVideo();
  sourceVideo = null;

  // Clean up canvas stream
  if (pipVideo && pipVideo.srcObject) {
    pipVideo.srcObject.getTracks().forEach(t => t.stop());
  }

  // Exit PiP if active
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(() => {});
  }

  // Clean up media controls
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
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

  // Detect scrolling feed platforms
  const needsCanvasMode = isTikTok() || isYouTubeShorts() || (isVerticalVideo && isHorizontal);

  // Classic PiP mode for normal sites without rotation
  if (!needsCanvasMode) {
    try {
      await video.requestPictureInPicture();
      setupMediaControls(video);
      pipActive = true;
      return true;
    } catch (e) {
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
  } catch (e) {
    cleanup();
    return false;
  }

  setupMediaControls(video, pipVideo);

  // Observe feed for TikTok and YouTube Shorts
  if (isTikTok() || isYouTubeShorts()) {
    observeFeed();
  }

  pipActive = true;
  return true;
}

// === STOP PiP ===

async function stopPiP() {
  cleanup();
  return true;
}

// === TOGGLE ORIENTATION ===

async function toggleOrientation() {
  isHorizontal = !isHorizontal;

  // If PiP is active, restart it with new mode
  if (pipActive) {
    await stopPiP();
    await new Promise(resolve => setTimeout(resolve, 100));
    await startPiP();
  }

  return isHorizontal;
}

// === OBSERVE FEED (TikTok & YouTube Shorts) ===

function observeFeed() {
  if (!isTikTok() && !isYouTubeShorts()) return;

  // Observe videos that become visible
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target !== sourceVideo && entry.target.readyState >= 2) {
        // Restore previous video visibility
        restoreSourceVideo();
        // Switch to new video and hide it
        sourceVideo = entry.target;
        hideSourceVideo(sourceVideo);
      }
    });
  }, { threshold: 0.7 });

  // Observe all existing and future videos
  const observeAll = () => {
    document.querySelectorAll('video').forEach(v => {
      if (v !== pipVideo) {
        observer.observe(v);
      }
    });
  };

  observeAll();

  // Observe new videos added to DOM
  const mutationObs = new MutationObserver(() => observeAll());
  mutationObs.observe(document.body, { childList: true, subtree: true });
}
