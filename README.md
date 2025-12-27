# OffGrid — Privacy-First Developer Toolkit

<p align="center">
  <img src="public/favicon.svg" alt="OffGrid Logo" width="100" height="100">
</p>

<p align="center">
  <strong>Your data stays off the grid, off the network, off any server.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#privacy">Privacy</a>
</p>

---

## 🛡️ Privacy Guarantees

- **Zero Data Transmission**: All processing happens in your browser
- **No Analytics or Tracking**: No cookies, no fingerprinting, no third-party scripts
- **Works Offline**: Install as PWA and use without internet
- **Open Source**: Verify the code yourself

## ✨ Features

### 🔑 JWT Decoder
- Decode and inspect JSON Web Tokens
- View header, payload, and signature
- Real-time expiry status
- Signature verification (HS256)
- Security warnings for vulnerable configurations

### 📋 JSON Formatter
- Pretty print with customizable indentation
- Interactive tree view
- JSON diff comparison
- Path queries (dot notation)
- TypeScript interface inference (Dev Mode)
- Stats and metrics

### 🔄 Encode/Decode
- Base64 (standard and URL-safe)
- URL encoding (percent-encoding)
- HTML entities
- Unicode escape sequences
- Hexadecimal
- Binary

### #️⃣ Hash Generator
- MD5 (pure JavaScript implementation)
- SHA-1, SHA-256, SHA-384, SHA-512
- Text and file input
- Hash comparison/verification
- Multiple output formats

### 🆔 UUID Generator
- UUID v4 (random)
- UUID v7 (timestamp + random, sortable)
- UUID v1 (timestamp-based)
- Batch generation (up to 1000)
- UUID validation and parsing
- Multiple output formats

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/offgrid.git

# Navigate to the project
cd offgrid

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📦 Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Usage

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-5` | Switch between tools |
| `D` | Toggle Dev Mode |
| `/` | Focus search |
| `Ctrl+V` | Paste and process |

### Dev Mode

Toggle Dev Mode (press `D` or use sidebar toggle) to reveal:
- Detailed algorithm explanations
- Byte-level analysis
- Performance metrics
- TypeScript inference
- Internal process visualization

## 🔒 Privacy

OffGrid is designed with privacy as the core principle:

1. **Client-Side Only**: All operations run in your browser using Web APIs
2. **No Network Requests**: After initial load, no data leaves your device
3. **No Storage**: We don't use cookies or collect any data
4. **PWA Support**: Install and use completely offline
5. **Open Source**: Audit the code yourself

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Web Crypto API** - Cryptographic operations

## 🎨 Design

- **Glassmorphic UI** with backdrop blur effects
- **Terminal Green** color scheme (#00ff00)
- **Dark theme** optimized for developer comfort
- **Responsive** design for all screen sizes
- **Accessible** with keyboard navigation and ARIA labels

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

<p align="center">
  Made with 💚 for developers who value their privacy
</p>
