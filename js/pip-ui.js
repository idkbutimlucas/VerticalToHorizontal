// pip-ui.js - UI buttons for all platforms (overlay, YouTube, YouTube Shorts)

// === SVG ICONS ===

const PIP_ICON_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
</svg>`;

const ROTATE_ICON_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/>
</svg>`;

// === STYLES INJECTION ===

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

    /* TikTok action button style - matches native buttons */
    .pip-plus-tiktok-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      margin: 8px 0 0 0;
      color: white;
      font-size: 12px;
      font-family: 'TikTokFont', 'Proxima Nova', 'Arial', sans-serif;
      width: 48px;
      min-height: 78px;
    }
    .pip-plus-tiktok-btn:hover {
      opacity: 0.8;
    }
    .pip-plus-tiktok-btn.active svg {
      fill: #fe2c55;
    }
    .pip-plus-tiktok-btn svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .pip-plus-tiktok-btn .pip-plus-tiktok-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pip-plus-tiktok-btn:hover .pip-plus-tiktok-icon {
      background: rgba(255, 255, 255, 0.2);
    }
    .pip-plus-tiktok-btn.active .pip-plus-tiktok-icon {
      background: rgba(254, 44, 85, 0.2);
    }
    .pip-plus-tiktok-btn span {
      margin-top: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .pip-plus-tiktok-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `;
  document.head.appendChild(style);
}

// === YOUTUBE CLASSIC BUTTON ===

function injectYouTubeButton() {
  if (document.querySelector(`.${PIP_BUTTON_YT_CLASS}`)) return;

  const rightControls = document.querySelector('.ytp-right-controls');
  if (!rightControls) return;

  const autoplayBtn = rightControls.querySelector('.ytp-autonav-toggle-button-container') ||
                      rightControls.querySelector('.ytp-right-controls-left');

  const btn = document.createElement('button');
  btn.className = `ytp-button ${PIP_BUTTON_YT_CLASS}`;
  btn.title = 'Picture-in-Picture Plus';
  btn.innerHTML = PIP_ICON_SVG;

  btn.addEventListener('click', async (e) => {
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

  if (autoplayBtn && autoplayBtn.nextSibling) {
    rightControls.insertBefore(btn, autoplayBtn.nextSibling);
  } else {
    rightControls.insertBefore(btn, rightControls.firstChild);
  }

  return btn;
}

// === TIKTOK BUTTONS ===

function injectTikTokButtons() {
  // Find all TikTok action bars and inject buttons into each one that doesn't have them
  const actionBars = document.querySelectorAll('[class*="DivActionItemContainer"], [class*="SectionActionBarContainer"]');

  actionBars.forEach(actionBar => {
    // Skip if this action bar already has our buttons
    if (actionBar.querySelector('.pip-plus-tiktok-container')) return;

    const container = document.createElement('div');
    container.className = 'pip-plus-tiktok-container';

    // PiP button
    const pipBtn = document.createElement('button');
    pipBtn.className = 'pip-plus-tiktok-btn pip-plus-tiktok-pip';
    pipBtn.innerHTML = `
      <div class="pip-plus-tiktok-icon">${PIP_ICON_SVG}</div>
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

    // Rotation button
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'pip-plus-tiktok-btn pip-plus-tiktok-rotate';
    rotateBtn.innerHTML = `
      <div class="pip-plus-tiktok-icon">${ROTATE_ICON_SVG}</div>
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
    actionBar.appendChild(container);

    // Sync state immediately for newly injected buttons
    pipBtn.classList.toggle('active', pipActive);
    rotateBtn.classList.toggle('active', isHorizontal);
  });
}

// === YOUTUBE SHORTS BUTTONS ===

function injectYouTubeShortsButtons() {
  if (document.querySelector('.pip-plus-shorts-container')) return;

  const actionBar = document.querySelector('ytd-reel-video-renderer[is-active] reel-action-bar-view-model') ||
                    document.querySelector('reel-action-bar-view-model');
  if (!actionBar) return;

  const container = document.createElement('div');
  container.className = 'pip-plus-shorts-container';

  // PiP button
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

  // Rotation button
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
  actionBar.parentElement.appendChild(container);
}

// === GENERIC OVERLAY BUTTON ===

function injectOverlayButton(video) {
  const rect = video.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 100) return;

  const computedStyle = window.getComputedStyle(video);
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return;

  video.dataset.pipButtonInjected = 'true';

  const btn = document.createElement('button');
  btn.className = PIP_BUTTON_CLASS;
  btn.innerHTML = PIP_ICON_SVG;
  btn.title = 'Picture-in-Picture';

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (pipActive) {
      await stopPiP();
    } else {
      sourceVideo = video;
      await startPiP();
    }
    updateAllButtons();
  });

  // Find a suitable container
  let container = null;
  let parent = video.parentElement;

  for (let i = 0; i < 5 && parent; i++) {
    const parentRect = parent.getBoundingClientRect();
    const parentStyle = window.getComputedStyle(parent);

    if (parentRect.height > 50 &&
        parentStyle.position !== 'static' &&
        parentStyle.overflow !== 'hidden') {
      container = parent;
      break;
    }

    if (parentRect.height > 50 && parentStyle.position !== 'static' && !container) {
      container = parent;
    }

    parent = parent.parentElement;
  }

  if (container) {
    container.classList.add(PIP_CONTAINER_CLASS);
    container.appendChild(btn);
  } else {
    // Fallback: fixed position
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

    const scrollHandler = () => requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', scrollHandler, { passive: true });

    video._pipButtonCleanup = () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', scrollHandler);
    };

    video.addEventListener('mouseenter', () => btn.classList.add('visible'));
    video.addEventListener('mouseleave', (e) => {
      if (!e.relatedTarget || !btn.contains(e.relatedTarget)) {
        btn.classList.remove('visible');
      }
    });
    btn.addEventListener('mouseenter', () => btn.classList.add('visible'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('visible'));
  }

  video._pipButton = btn;
}

// === INJECT BUTTON (ROUTER) ===

function injectPiPButton(video) {
  if (video === pipVideo) return;

  // TikTok has multiple action bars (one per video), always try to inject
  if (isTikTok()) {
    injectTikTokButtons();
    video.dataset.pipButtonInjected = 'true';
    return;
  }

  // For other platforms, skip if already injected
  if (video.dataset.pipButtonInjected) return;

  if (isYouTubeShorts()) {
    video.dataset.pipButtonInjected = 'true';
    injectYouTubeShortsButtons();
    return;
  }

  if (isYouTube()) {
    video.dataset.pipButtonInjected = 'true';
    injectYouTubeButton();
    return;
  }

  injectOverlayButton(video);
}

// === UPDATE ALL BUTTONS STATE ===

function updateAllButtons() {
  // Overlay buttons
  document.querySelectorAll(`.${PIP_BUTTON_CLASS}`).forEach(btn => {
    if (pipActive) {
      btn.classList.add('visible');
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

  // YouTube classic button
  const ytBtn = document.querySelector(`.${PIP_BUTTON_YT_CLASS}`);
  if (ytBtn) {
    ytBtn.classList.toggle('active', pipActive);
  }

  // YouTube Shorts buttons
  const shortsPipBtn = document.querySelector('.pip-plus-shorts-pip');
  if (shortsPipBtn) {
    shortsPipBtn.classList.toggle('active', pipActive);
  }

  const shortsRotateBtn = document.querySelector('.pip-plus-shorts-rotate');
  if (shortsRotateBtn) {
    shortsRotateBtn.classList.toggle('active', isHorizontal);
  }

  // TikTok buttons (multiple per page)
  document.querySelectorAll('.pip-plus-tiktok-pip').forEach(btn => {
    btn.classList.toggle('active', pipActive);
  });

  document.querySelectorAll('.pip-plus-tiktok-rotate').forEach(btn => {
    btn.classList.toggle('active', isHorizontal);
  });
}

// === OBSERVE VIDEOS FOR UI ===

function observeVideosForOverlay() {
  injectOverlayStyles();

  const injectAll = () => {
    document.querySelectorAll('video').forEach(video => {
      if (video !== pipVideo) {
        injectPiPButton(video);
      }
    });
  };

  injectAll();

  const observer = new MutationObserver(() => injectAll());
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('loadedmetadata', (e) => {
    if (e.target.tagName === 'VIDEO') {
      injectPiPButton(e.target);
    }
  }, true);
}
