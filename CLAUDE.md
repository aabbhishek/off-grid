# OffGrid — Application Context for Claude

This document provides context for AI assistants working on the OffGrid codebase.

## Project Overview

**OffGrid** is a privacy-first developer toolkit — a collection of browser-based utilities where all data processing happens client-side. No data is ever sent to external servers.

**Core Principle**: Zero data transmission. Everything runs in the browser using Web APIs.

**Live URL**: https://off-grid.darkpkt.cloud (Custom domain hosted on GitHub Pages)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool & dev server |
| Tailwind CSS 3 | Utility-first styling |
| Framer Motion | Animations & transitions |
| Lucide React | Icon library |
| Recharts | Charts/visualizations |
| React Router DOM 6 | Client-side routing |
| Web Crypto API | Cryptographic operations (hashing, etc.) |

## Directory Structure

```
off-grid/
├── src/
│   ├── App.jsx              # Main app, routing, global context, layout
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles, CSS variables, Tailwind
│   ├── pages/               # Tool pages (one per tool)
│   │   ├── Landing.jsx      # Home page
│   │   ├── JWTDecoder.jsx   # JWT decode/verify tool
│   │   ├── JSONFormatter.jsx # JSON format/diff/query tool
│   │   ├── EncodeDecode.jsx # Base64, URL, HTML, Hex, Binary encoding
│   │   ├── HashGenerator.jsx # MD5, SHA family hash generation
│   │   ├── UUIDGenerator.jsx # UUID v1/v4/v7 generation
│   │   ├── SSLToolkit.jsx   # SSL/TLS certificate tools
│   │   ├── LogAnalyzer.jsx  # Log parsing and analysis
│   │   ├── LocalVault.jsx   # Encrypted credential storage
│   │   └── Privacy.jsx      # Privacy & analytics info page
│   ├── components/          # Shared components
│   │   ├── BootLoader.jsx   # Boot animation on first load
│   │   └── vault/           # Vault-specific components
│   └── utils/               # Utility functions
├── public/                  # Static assets (favicon, PWA icons, CNAME)
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration (includes PWA plugin)
├── tailwind.config.js       # Tailwind configuration
└── package.json             # Dependencies & scripts
```

## Key Patterns & Conventions

### Global App Context

The app uses React Context (`AppContext`) in `App.jsx` for global state:

```jsx
const { devMode, setDevMode, isOnline, showToast, copyToClipboard, theme, accent } = useApp()
```

- `devMode` — Shows advanced/technical details when enabled
- `isOnline` — Network connectivity status
- `showToast(message)` — Display toast notification
- `copyToClipboard(text)` — Copy text with toast feedback
- `theme` — 'dark' or 'light'
- `accent` — Current accent color ID

### Adding a New Tool

1. Create a new page component in `src/pages/NewTool.jsx`
2. Add route in `App.jsx`:
   ```jsx
   import NewTool from './pages/NewTool'
   // In Routes:
   <Route path="/newtool" element={<NewTool />} />
   ```
3. Add to `navItems` array in `App.jsx`:
   ```jsx
   { path: '/newtool', label: 'New Tool', icon: IconName, shortcut: '9' }
   ```
4. Add search keywords to `toolDescriptions` object

### Page Component Structure

Each tool page follows this pattern:

```jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../App'
import { IconName } from 'lucide-react'

const ToolPage = () => {
  const { devMode, showToast, copyToClipboard } = useApp()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Tool header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="tool-icon">
          <IconName className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Tool Name</h1>
          <p className="text-[var(--text-secondary)]">Tool description</p>
        </div>
      </div>

      {/* Tool content */}
      <div className="glass-card p-6">
        {/* Input area */}
      </div>

      {/* Dev mode content (conditional) */}
      {devMode && (
        <div className="glass-card p-6">
          {/* Technical details */}
        </div>
      )}
    </motion.div>
  )
}

export default ToolPage
```

### Styling Conventions

**CSS Variables** (defined in `index.css`):
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary` — Background colors
- `--text-primary`, `--text-secondary`, `--text-tertiary` — Text colors
- `--accent` — Current accent color
- `--border-color` — Border color
- `--glass-bg`, `--glass-border` — Glassmorphism effects

**Common Classes**:
- `glass-card` — Glassmorphic card with blur backdrop
- `glass-input` — Styled input field
- `glass-button` — Primary button style
- `accent-text` — Text with accent color
- `gradient-text` — Gradient text effect
- `tool-icon` — Styled icon container
- `nav-link` — Navigation link style

**Animation Pattern**:
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
>
```

### Keyboard Shortcuts

Defined in `App.jsx` `useEffect`:
- `1-8` — Switch between tools
- `D` — Toggle dev mode
- `T` — Toggle theme
- `/` — Focus search input
- `Escape` — Clear search

## Important Files

| File | Contains |
|------|----------|
| `src/App.jsx` | Routing, context, layout, sidebar, header, theme/accent logic |
| `src/index.css` | All CSS variables, global styles, component classes |
| `vite.config.js` | PWA configuration, build settings |
| `tailwind.config.js` | Theme extensions, custom colors |

## PWA Support

The app is a Progressive Web App configured via `vite-plugin-pwa`. Key features:
- Works offline after initial load
- Can be installed on desktop/mobile
- Service worker caches assets

## Development Commands

```bash
npm run dev      # Start dev server (usually http://localhost:5173)
npm run build    # Production build to /dist
npm run preview  # Preview production build
npm run deploy   # Deploy to GitHub Pages
```

## Privacy Constraints

When adding features, ensure:
1. **No external API calls** — All processing must be client-side
2. **No analytics/tracking** — No third-party scripts
3. **No data persistence to servers** — Use localStorage only
4. **Web Crypto API** for cryptographic operations (not external libraries that phone home)

## Common Tasks

### Adding a new encoding type to Encode/Decode
Edit `src/pages/EncodeDecode.jsx`, add to the encodings array with encode/decode functions.

### Adding a new hash algorithm
Edit `src/pages/HashGenerator.jsx`. Use Web Crypto API's `crypto.subtle.digest()` for standard algorithms.

### Styling a new component
Use existing CSS classes from `index.css` (`glass-card`, `glass-input`, etc.) and Tailwind utilities. Follow the glassmorphic dark theme aesthetic.

## Design Philosophy

- **Glassmorphic UI** with backdrop blur effects
- **Dark theme** by default, light theme available
- **Customizable accent colors** (cyan, purple, pink, orange, green, blue)
- **Responsive** design for all screen sizes
- **Keyboard accessible** with shortcuts and focus management

## Dev Mode

Toggle with `D` key or sidebar switch. Persisted in `localStorage`.

### Dev Mode Features by Tool

| Tool | Dev Mode Shows |
|------|----------------|
| **JWT Decoder** | Raw Base64URL parts (header, payload, signature) |
| **JSON Formatter** | JS Transform Editor, Data Statistics, TypeScript Interface, Byte sizes |
| **Encode/Decode** | Byte Analysis (hex dump), Base64 Encoding Process step-by-step |
| **Hash Generator** | Computation time per algorithm, Algorithm Comparison table |
| **UUID Generator** | UUID Structure breakdown (color-coded), Version Comparison |
| **SSL/TLS Toolkit** | Raw Certificate hex dump, Raw Key Data |
| **Log Analyzer** | Auto-detected Debug Info, Parser Details |
| **Local Vault** | Server Details, Credential Breakdown, Health Check Details |

### Local Vault Dev Mode Details

**Server Card (expanded view):**
- Storage Details: Server ID, Encrypted Size, Created Date, Folder ID
- Credential Breakdown: Count by type (password, api_key, ssh_key, etc.)
- Connection Config: Protocol, Auth Method, Infrastructure, Health Status
- Health Check Config: URL, Expected Status, Interval, On Unlock setting

**Health Monitoring View:**
- Detection Method: Direct CORS / No-CORS Mode / Image Probe
- Response Time: Exact milliseconds
- Status Code: HTTP status when available
- Last Check: Full timestamp
- Error/Note details

### Visual Style

Dev Mode sections use:
- Orange/amber accent color (`text-orange-400`)
- Dashed border (`border-dashed border-2 border-orange-500/30`)
- Slight background tint (`bg-orange-500/5`)
- "Dev Mode" label in headers

## Local Vault Features

### Health Monitoring

The Local Vault includes health monitoring for servers with configured health check URLs.

**Location:** `src/pages/LocalVault.jsx` - `HealthMonitoringView` component

**Features:**
- Dashboard showing server health status (healthy, degraded, down, unknown)
- Manual health checks per server or all at once
- Auto-check on vault unlock (if enabled in server settings)
- Response time tracking
- CORS-aware error handling

**Server health check fields (in ServerForm):**
- `healthCheckUrl` — URL to check (e.g., `https://api.example.com/health`)
- `healthCheckExpectedStatus` — Expected HTTP status code (default: 200)
- `healthCheckInterval` — Check interval in minutes (for future periodic checks)
- `healthCheckOnUnlock` — Run check when vault is unlocked

**Health statuses:**
- `healthy` — Response matches expected status
- `degraded` — Response received but status doesn't match
- `down` — Request failed or timed out
- `unknown` — CORS blocked or not yet checked

**Key functions:**
```jsx
performHealthCheck(serverId, serverData) → Promise<{status, lastCheck, responseTime, error, method}>
runAllHealthChecks(serversWithData) → Promise<results>
```

**CORS Workaround — Multi-Method Detection:**

Since CORS blocks direct requests, health checks use a fallback chain:

1. **Direct CORS request** — Standard fetch with `mode: 'cors'` (most accurate)
2. **No-CORS mode** — `mode: 'no-cors'` returns opaque response but detects if server responded
3. **Image probe** — Loads `favicon.ico` from server origin to test reachability

**Detection logic:**
- Fast CORS error (<500ms) often means server is UP (responded quickly)
- Timeout (>8s) means server is likely DOWN
- No-cors success = server responded (status unknown but reachable)
- Image loads/fails quickly = server is reachable

**Result includes `method` field:**
- `cors` — Standard request worked (status code available)
- `no-cors` — Detected via indirect check
- `image-probe` — Detected via favicon loading
- `all-failed` — All methods failed, server likely down

### SSH Config Export

The Local Vault can export SSH configurations to separate files for inclusion in the main SSH config.

**Files involved:**
- `src/utils/sshConfig.js` — SSH config generation utilities
- `src/pages/LocalVault.jsx` — SSH Config Modal UI

**Key functions:**
```jsx
// Generate SSH config entry
generateSSHConfigEntry(server) → string

// Generate filename (config.offgrid.servername)
generateSSHConfigFilename(serverName) → string

// Save to file using File System Access API
saveSSHConfigToFile(content, serverName) → Promise<{success, method, filename}>

// Get instructions for including in main config
getIncludeInstructions(filename) → {linux: {...}, windows: {...}}
```

**File naming convention:** `config.offgrid.<servername>` (no extension)

**Usage flow:**
1. User clicks "SSH Config" on a server card
2. Modal shows config preview with filename
3. User can save via File System Access API or download
4. Instructions show how to include in `~/.ssh/config`

## CI/CD & Releases

### Auto Release Workflow

Located in `.github/workflows/deploy.yml`. Handles deployment and semantic versioning.

**Deployment:**
- Hosted on GitHub Pages with custom domain: `off-grid.darkpkt.cloud`
- CNAME file in `public/` directory for custom domain configuration
- Base path is `/` (root) since using custom domain

**Version format:** `Major.Minor.Patch` (e.g., `1.5.3`)

**Version calculation:**
- **Major bump:** BREAKING CHANGE commits or `!` after type (e.g., `feat!:`)
- **Minor bump:** Count of `feat:` commits since last release
- **Patch bump:** Count of `fix:` commits since last release
- Default: +1 patch for other changes

**Release naming:** Just the version number (e.g., `1.5.3`)

**Commit conventions:**
- `feat: description` — New feature (bumps minor)
- `fix: description` — Bug fix (bumps patch)
- `feat!: description` — Breaking change (bumps major)
- `BREAKING CHANGE:` in body — Breaking change (bumps major)

## Header Components

### OS Detection

The header displays the user's operating system with an icon.

**Detection function:** `getOSInfo()` in `App.jsx`

**Supported OS:**
- Windows (windows icon)
- macOS/iOS (Apple icon)
- Linux (Tux icon) + distros: Ubuntu, Fedora, Debian, Arch, CentOS, Red Hat
- Android (robot icon)
- ChromeOS (Chrome icon)
- FreeBSD (daemon icon)

**Component:** `<OSIcon os={osInfo.os} className="w-4 h-4" />` — SVG icons

### Browser Detection

**Function:** `getBrowserInfo()` — Returns browser name and platform (ios/android/desktop)

## Ghost Mode & Analytics

### Cloudflare Analytics

**Token:** `5777f7fc9bcc4a7d947b5e4e2406ce93`

Analytics script is loaded conditionally based on Ghost Mode state:
- Initial load: Checks `localStorage.getItem('offgrid-ghostmode')` in `index.html`
- If ghost mode is enabled, script never loads
- Runtime: Managed by `useEffect` in `App.jsx` — adds/removes script dynamically

**What is tracked (when Ghost Mode OFF):**
- Page views (no user identification)
- Country (from IP, not stored)
- Device type (desktop/mobile/tablet)
- Browser type (no fingerprinting)

**What is never tracked:**
- Passwords or credentials
- Content processed (JWTs, JSON, logs)
- Personal information
- Cookies or cross-site tracking

### Ghost Mode

Privacy-focused feature that completely disables all analytics tracking.

**State Management:**
- Stored in `localStorage` as `offgrid-ghostmode`
- Managed via `AppContext` (`ghostMode`, `setGhostMode`)
- Keyboard shortcut: Press `g` to toggle

**Components:**
1. **`GhostModeToggle`** — Sidebar toggle with "Private" badge when active
2. **`GhostIndicator`** — Simple badge in header with ghost icon (primary accent color)
3. **`GhostModeAnimation`** — Full-screen activation animation with:
   - Ripple effects (3 expanding circles)
   - Floating ghost icon with glow
   - Floating particles rising upward
   - "GHOST MODE ACTIVATED" text

**When Enabled:**
- Cloudflare analytics script is removed from DOM
- Ghost badge appears in header (solid accent color background)
- Sidebar toggle shows "Private" badge
- Analytics never load on page refresh

### Privacy Page

Located at `/privacy` — explains tracking and Ghost Mode.

**Sections:**
1. **Ghost Mode Status Card** — Shows current status with toggle button
2. **What We Track** — Page views, country, device type (Cloudflare)
3. **What We Never Track** — Passwords, content, personal info
4. **How Ghost Mode Works** — Step-by-step explanation
5. **About Cloudflare** — Why we chose it, privacy features, external links

**Links:**
- Footer link to `/privacy`
- External link to Cloudflare Web Analytics info
- External link to Cloudflare Privacy Policy

## Log Analyzer

### Supported Log Formats

The Log Analyzer auto-detects and parses the following log formats:

| Format | Example | Detection |
|--------|---------|-----------|
| **NDJSON** | `{"timestamp":"...","level":"INFO","message":"..."}` | Valid JSON with log fields |
| **Apache/Nginx** | `192.168.1.1 - - [18/Jan/2026:10:15:30] "GET /api HTTP/1.1" 200` | Combined log format |
| **Syslog** | `<134>Jan 18 10:15:30 server app[1234]: message` | RFC 5424/3164 |
| **Log4j/Spark** | `26/01/18 23:39:23 WARN ClassName: message` | 2-digit year format |
| **Python** | `2026-01-18 23:39:24 - logger - INFO - message` | Dash-separated format |
| **Logback/SLF4J** | `2026-01-18 10:15:30.123 INFO [main] logger - message` | With thread name |
| **Spring Boot** | `2026-01-18 10:15:30.123  INFO 12345 --- [main] logger : message` | With PID |
| **Generic** | `2026-01-18 10:15:30 [INFO] message` | ISO timestamp + level |

### Mixed Format Support

The parser handles **mixed-format logs** (common in application logs that include library/framework output):

1. Scores all formats against sample lines
2. Tries formats in confidence order for each line
3. Falls back to trying all formats if primary fails
4. Shows format breakdown in Dev Mode

**Stats include:**
- `formatBreakdown`: Count of lines parsed by each format
- `isMixedFormat`: Boolean indicating multiple formats detected

### Stack Trace Handling

Java, Python, Go, and JS stack traces are automatically attached to the preceding log entry:
- Lines starting with `\tat ` (Java/JS)
- Lines starting with `File "` (Python)
- `Caused by:` and `... N more` lines

### UI Features

**Sort Order:**
- Toggle between "Oldest First" (ascending) and "Newest First" (descending)
- Button shows arrow icon indicating current sort direction
- Highlighted when in descending (newest first) mode

**Format Chips (Mixed Mode):**
- When logs contain multiple formats, shows format chips next to each entry
- Format legend displayed above the log list showing all detected formats with counts
- Icons: ⚡ Spark/Log4j, 🐍 Python, ☕ Logback, 🍃 Spring, {} JSON, 🪶 Apache, 📋 Syslog

**Dev Mode (Per Entry):**
- Expanded entries show "Parser Details" section with:
  - Detected format (with icon)
  - Line number
  - Source/logger name
  - Raw line length

### Line Ending Normalization

The parser automatically normalizes Windows (CRLF), old Mac (CR), and Unix (LF) line endings before parsing.
