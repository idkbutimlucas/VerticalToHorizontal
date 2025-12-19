// content.js - Entry point for PiP Plus extension
// This file initializes the extension after all modules are loaded

// Load shortcuts and start observing videos when DOM is ready
function initPiPPlus() {
  loadShortcuts();
  observeVideosForOverlay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPiPPlus);
} else {
  initPiPPlus();
}
