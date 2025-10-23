# 📺 Universal Video PiP

**Universal Picture-in-Picture extension for Chrome with automatic vertical video detection and optional rotation.**

Transform any web video into a floating Picture-in-Picture window. Automatically detects vertical videos (TikTok, YouTube Shorts) and offers real-time rotation to horizontal format.

[![Version](https://img.shields.io/badge/version-10.0.0-blue.svg)](https://github.com/idkbutimlucas/VerticalToHorizontal)
[![Chrome](https://img.shields.io/badge/chrome-extension-green.svg)](https://github.com/idkbutimlucas/VerticalToHorizontal)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

## ✨ Features

### 🌍 Universal Support
- **Works on ALL websites** with video content (YouTube, TikTok, Netflix, Twitch, Vimeo, etc.)
- Intelligent video detection with automatic selection
- Classic PiP mode for standard videos
- Canvas streaming mode for feed-based platforms

### 📱 Vertical Video Handling
- **Automatic detection** of vertical videos
- **Real-time rotation toggle** (switch while PiP is active)
- Perfect for TikTok and YouTube Shorts
- Maintains aspect ratio and quality

### ⚙️ Customizable
- **Custom keyboard shortcuts** via settings page
- Default shortcuts: `Ctrl+Shift+P` (PiP) and `Ctrl+Shift+R` (Rotation)
- Settings sync across devices via Chrome storage
- Mac/Windows automatic modifier detection (⌘ vs Ctrl)

### 🎯 Smart Technology
- **TikTok/YouTube Shorts feed tracking**: Automatically follows video changes as you scroll
- IntersectionObserver for smooth feed detection
- Platform-specific optimizations
- Native media controls integration

## 🚀 Installation

### From Source (Developer Mode)

1. **Download or clone** this repository
```bash
git clone https://github.com/idkbutimlucas/VerticalToHorizontal.git
```

2. Open **Chrome** and go to `chrome://extensions/`

3. Enable **"Developer mode"** (top-right toggle)

4. Click **"Load unpacked"**

5. Select the extension folder

6. ✅ The extension is now installed!

### From Chrome Web Store

🔜 Coming soon - The extension will be published on the Chrome Web Store

## 🎮 Usage

### Quick Start

1. **Navigate to any video website** (YouTube, TikTok, Netflix, etc.)
2. **Press `Ctrl+Shift+P`** (or `⌘⇧P` on Mac) to activate PiP
3. For vertical videos: **Press `Ctrl+Shift+R`** to toggle rotation
4. **Enjoy your floating video!**

### Via Extension Popup

1. Click the extension icon in your toolbar
2. Click **"Enable PiP"** to start Picture-in-Picture
3. For vertical videos, click **"Enable Rotation"** before or during PiP
4. Use the settings link to customize keyboard shortcuts

### Keyboard Shortcuts (Default)

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Toggle PiP | `⌘⇧P` | `Ctrl+Shift+P` |
| Toggle Rotation | `⌘⇧R` | `Ctrl+Shift+R` |

**💡 Tip:** Customize shortcuts in the extension settings page!

## 🎨 How It Works

### Two Modes

**1. Classic PiP Mode** (Default for standard videos)
- Uses native browser Picture-in-Picture API
- Lightweight and fast
- Direct video element PiP
- Best for: YouTube videos, Netflix, streaming sites

**2. Canvas Streaming Mode** (For vertical videos and feeds)
- HTML5 Canvas captures and transforms video frames
- Real-time rotation support
- Feed tracking for TikTok/YouTube Shorts
- Best for: TikTok, YouTube Shorts, Instagram Reels

### Automatic Selection

The extension intelligently chooses the mode based on:
- Platform detection (TikTok, YouTube Shorts → Canvas mode)
- Video orientation (vertical + rotation enabled → Canvas mode)
- Otherwise → Classic PiP mode for best performance

## 🎛️ Settings

Access settings by:
1. Clicking the extension icon
2. Clicking **"⚙️ Customize shortcuts"** at the bottom

### Customizable Options

- **PiP shortcut**: Choose your modifiers (Ctrl, Shift, Alt) + key
- **Rotation shortcut**: Fully customizable combination
- **Settings sync**: Automatically synced across all your devices

## 🔧 Advanced Features

### Media Controls

When PiP is active, use:
- **Play/Pause**: Control playback
- **Skip Back**: -10 seconds
- **Skip Forward**: +10 seconds

These controls work:
- In the PiP window itself
- With your keyboard media keys
- On Mac Touch Bar

### Feed Following (TikTok/YouTube Shorts)

When using TikTok or YouTube Shorts:
1. Activate PiP on a video
2. Scroll to the next video
3. The PiP automatically updates to show the new video
4. Keep scrolling - the PiP follows your feed!

## 📋 Supported Platforms

### ✅ Fully Tested
- **TikTok** (with feed tracking)
- **YouTube** (regular videos + Shorts with feed tracking)
- **Netflix**
- **Twitch**
- **Vimeo**

### 🌐 Universal Support
Works on ANY website with `<video>` elements, including:
- Streaming platforms
- Social media
- News sites
- Educational platforms
- Video hosting services

## ⚠️ Known Limitations

### Audio
- Audio plays from the original page, not the PiP window
- This is a browser limitation for canvas-based PiP
- Classic PiP mode has full audio support

### Performance
- Canvas mode uses some CPU (~30 FPS rendering)
- Classic mode is very lightweight
- Performance optimizations are ongoing

### Compatibility
- **Chrome/Edge**: Full support ✅
- **Firefox**: Not compatible (different extension API)
- **Safari**: Not compatible (different extension system)

## 🐛 Troubleshooting

### Extension not working

1. Reload the extension in `chrome://extensions/` → Click ↻
2. Refresh the webpage (F5)
3. Open DevTools console (F12) to check for errors

### No video in PiP window

- Make sure the video is loaded and playing
- Try clicking on the video first
- Check if the page allows PiP (some sites block it)

### "Reload page (F5)" message

- The content script needs to load
- Simply refresh the page with F5
- This happens after installing/updating the extension

### Rotation not showing

- Rotation only appears for vertical videos (height > width)
- Make sure you're on a video page
- Try refreshing if the video just loaded

## 🛠️ Development

### Project Structure

```
VerticalToHorizontal/
├── manifest.json       # Extension configuration
├── content.js         # Main video detection and PiP logic
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
├── options.html       # Settings page
├── options.js         # Settings logic
└── icons/            # Extension icons
```

### Key Technologies

- **Manifest V3**: Latest Chrome extension API
- **IntersectionObserver**: Efficient feed tracking
- **Canvas API**: Video transformation and rotation
- **MediaStream API**: Canvas to video streaming
- **Chrome Storage API**: Settings sync

### Building from Source

```bash
# Clone the repository
git clone https://github.com/idkbutimlucas/VerticalToHorizontal.git

# Navigate to directory
cd VerticalToHorizontal

# Load in Chrome as unpacked extension
# (See installation instructions above)
```

## 📝 Changelog

### v10.0.0 - Complete Rewrite (Current)
- ✨ Universal video PiP for all websites
- ✨ Customizable keyboard shortcuts
- ✨ Real-time rotation toggle
- ✨ Automatic vertical video detection
- ✨ Smart mode selection (Classic vs Canvas)
- ✨ Feed tracking for TikTok/YouTube Shorts
- ✨ Complete English localization
- ✨ Settings page with sync
- 🔧 Platform-specific optimizations
- 🎨 Modern, clean UI

### v9.1.0
- 🔧 Optimized PiP window size

### v4.0.0
- 🔧 Code refactoring
- 🐛 Improved TikTok video detection

## 👨‍💻 Author

**Lucas Hochart**

- Website: [lucashochart.fr](https://lucashochart.fr)
- GitHub: [@idkbutimlucas](https://github.com/idkbutimlucas)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Icons and design inspired by modern Chrome extensions
- Thanks to the open-source community

---

**⭐ If you find this extension useful, please star the repository!**

Made with ❤️ by [Lucas Hochart](https://lucashochart.fr)
