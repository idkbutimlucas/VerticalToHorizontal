// pip-shortcuts.js - Keyboard shortcuts and Chrome message handling

// === KEYBOARD SHORTCUTS ===

document.addEventListener('keydown', async e => {
  const key = e.key.toLowerCase();

  // Detect Mac vs Windows/Linux for modifiers
  const isMac = navigator.userAgentData?.platform === 'macOS' ||
                /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
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

// === CHROME MESSAGE HANDLING ===

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.action === 'togglePiP') {
    if (pipActive) {
      stopPiP().then(() => {
        updateAllButtons();
        sendResponse({ success: true, active: false });
      });
    } else {
      startPiP().then(ok => {
        updateAllButtons();
        sendResponse({ success: ok, active: ok });
      });
    }
    return true;
  }

  if (req.action === 'getPiPStatus') {
    const video = getVideo();
    const isVerticalVideo = video && video.videoHeight > video.videoWidth;
    sendResponse({ active: pipActive, isHorizontal, isVerticalVideo });
    return true;
  }

  if (req.action === 'toggleOrientation') {
    toggleOrientation().then(h => {
      updateAllButtons();
      sendResponse({ success: true, isHorizontal: h });
    });
    return true;
  }

  if (req.action === 'shortcutsUpdated') {
    loadShortcuts();
    return true;
  }
});

// === PIP EXIT EVENT ===

document.addEventListener('leavepictureinpicture', () => {
  cleanup();
  updateAllButtons();
});
