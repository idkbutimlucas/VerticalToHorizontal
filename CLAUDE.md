# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Picture-in-Picture Plus is a Chrome extension (Manifest V3) that enables Picture-in-Picture mode for any web video with optional rotation for vertical videos (TikTok, YouTube Shorts).

## Development

### Loading the Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project folder
4. After code changes, click the refresh icon on the extension card

### Testing

No automated tests. Manual testing workflow:
- Test on YouTube (regular videos and Shorts)
- Test on TikTok (feed scrolling)
- Test keyboard shortcuts (default: Ctrl+Shift+P for PiP, Ctrl+Shift+E for rotation)
- Test the popup UI and options page
- Test the overlay button on videos (hover to reveal, click to toggle PiP)

## Architecture

### Two PiP Modes

The extension uses two distinct Picture-in-Picture strategies:

1. **Classic PiP Mode** - Direct `video.requestPictureInPicture()` for standard horizontal videos. Lightweight, native controls.

2. **Canvas Streaming Mode** - For vertical videos or feed-based platforms (TikTok/YouTube Shorts):
   - Captures video frames to an off-screen canvas
   - Applies rotation transform when `isHorizontal` is enabled
   - Streams canvas to a hidden video element via `canvas.captureStream(30)`
   - That hidden video enters PiP mode

Mode selection logic in `startPiP()`:
- TikTok or YouTube Shorts → Canvas mode (enables feed tracking)
- Vertical video + rotation enabled → Canvas mode
- Otherwise → Classic mode

### Feed Tracking

For scrolling feeds (TikTok, YouTube Shorts), `observeFeed()` uses `IntersectionObserver` to detect when a new video becomes visible (70% threshold). The `sourceVideo` reference updates automatically, keeping PiP synced with the current video in feed.

### Communication Flow

```
popup.js ←→ chrome.runtime.sendMessage ←→ content.js
                                              ↑
options.js → chrome.storage.sync ─────────────┘ (shortcutsUpdated)
```

The popup polls status every 2 seconds. Options page broadcasts shortcut changes to all tabs.

### Overlay Button

A floating PiP button is injected on each video element:
- Appears on hover (bottom-right corner)
- Uses `MutationObserver` to detect dynamically added videos
- Wraps videos in a container if parent has `position: static`
- Button state syncs with global `pipActive` via `updateAllButtons()`

### Key State Variables (content.js)

- `pipActive` - Whether PiP is currently enabled
- `isHorizontal` - Rotation toggle state
- `sourceVideo` - Currently tracked video element
- `animating` - Canvas render loop active flag
