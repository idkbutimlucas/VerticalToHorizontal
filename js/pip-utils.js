// pip-utils.js - Utility functions for platform detection and video selection

// === PLATFORM DETECTION ===

function isYouTube() {
  return window.location.hostname.includes('youtube.com');
}

function isYouTubeShorts() {
  return window.location.hostname.includes('youtube.com') &&
         window.location.pathname.includes('/shorts/');
}

function isTikTok() {
  return window.location.hostname.includes('tiktok.com');
}

// === VIDEO DETECTION ===

function getVideo() {
  // Priority 1: YouTube Shorts and Reels
  if (isYouTube()) {
    const reelVideo = document.querySelector('ytd-reel-video-renderer[is-active] video');
    if (reelVideo) return reelVideo;
  }

  // Priority 2: TikTok (best selection algorithm)
  if (isTikTok()) {
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

// === SHORTCUTS LOADING ===

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
