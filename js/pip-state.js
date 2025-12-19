// pip-state.js - Global state variables for PiP Plus extension

// PiP state
let isHorizontal = false;  // Rotation toggle for vertical videos
let pipActive = false;
let canvas = null;
let ctx = null;
let pipVideo = null;
let sourceVideo = null;
let animating = false;
let originalStyle = null;

// Keyboard shortcuts (loaded from storage)
let shortcuts = {
  pip: { ctrl: true, shift: true, alt: false, key: 'p' },
  rotation: { ctrl: true, shift: true, alt: false, key: 'e' }
};

// CSS class names
const PIP_BUTTON_CLASS = 'pip-plus-overlay-btn';
const PIP_BUTTON_YT_CLASS = 'pip-plus-yt-btn';
const PIP_CONTAINER_CLASS = 'pip-plus-container';
