import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Key, Braces, Code2, Hash, Fingerprint, 
  Search, ShieldOff, Wifi, WifiOff, Github, 
  ChevronDown, Zap, Menu, X, Home, Sun, Moon,
  Palette, Check, ShieldCheck, Download, Smartphone,
  Monitor, Share2, MoreVertical, Plus, ExternalLink,
  Lock, FileText, KeySquare
} from 'lucide-react'

// Import components
import BootLoader from './components/BootLoader'

// Import pages
import Landing from './pages/Landing'
import JWTDecoder from './pages/JWTDecoder'
import JSONFormatter from './pages/JSONFormatter'
import EncodeDecode from './pages/EncodeDecode'
import HashGenerator from './pages/HashGenerator'
import UUIDGenerator from './pages/UUIDGenerator'
import SSLToolkit from './pages/SSLToolkit'
import LogAnalyzer from './pages/LogAnalyzer'
import LocalVault from './pages/LocalVault'

// Context for global state
export const AppContext = createContext()

export const useApp = () => useContext(AppContext)

// Accent colors
const accentColors = [
  { id: 'cyan', name: 'Cyan', color: '#00d4ff' },
  { id: 'purple', name: 'Purple', color: '#a855f7' },
  { id: 'pink', name: 'Pink', color: '#ec4899' },
  { id: 'orange', name: 'Orange', color: '#f97316' },
  { id: 'green', name: 'Green', color: '#10b981' },
  { id: 'blue', name: 'Blue', color: '#3b82f6' },
]

// Toast component
const Toast = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, x: 50 }}
    animate={{ opacity: 1, y: 0, x: 0 }}
    exit={{ opacity: 0, y: 50, x: 50 }}
    className="toast"
  >
    <Shield className="w-4 h-4 accent-text" />
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
)

// Detect browser/platform
const getBrowserInfo = () => {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isAndroid = /Android/.test(ua)
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)
  const isFirefox = /Firefox/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isSamsung = /SamsungBrowser/.test(ua)
  const isOpera = /OPR/.test(ua)
  
  if (isIOS && isSafari) return { name: 'Safari iOS', platform: 'ios' }
  if (isIOS && isChrome) return { name: 'Chrome iOS', platform: 'ios' }
  if (isAndroid && isSamsung) return { name: 'Samsung Internet', platform: 'android' }
  if (isAndroid && isChrome) return { name: 'Chrome Android', platform: 'android' }
  if (isAndroid && isFirefox) return { name: 'Firefox Android', platform: 'android' }
  if (isEdge) return { name: 'Microsoft Edge', platform: 'desktop' }
  if (isChrome) return { name: 'Google Chrome', platform: 'desktop' }
  if (isFirefox) return { name: 'Firefox', platform: 'desktop' }
  if (isOpera) return { name: 'Opera', platform: 'desktop' }
  if (isSafari) return { name: 'Safari', platform: 'desktop' }
  
  return { name: 'Browser', platform: 'unknown' }
}

// Detect OS
const getOSInfo = () => {
  const ua = navigator.userAgent
  const platform = navigator.platform || ''
  
  // Check for iOS
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return { os: 'ios', name: 'iOS' }
  }
  
  // Check for macOS
  if (platform.startsWith('Mac') || /Macintosh/.test(ua)) {
    return { os: 'macos', name: 'macOS' }
  }
  
  // Check for Windows
  if (platform.startsWith('Win') || /Windows/.test(ua)) {
    return { os: 'windows', name: 'Windows' }
  }
  
  // Check for Android
  if (/Android/.test(ua)) {
    return { os: 'android', name: 'Android' }
  }
  
  // Check for Linux distros
  if (/Linux/.test(ua) || platform.startsWith('Linux')) {
    // Check for specific distros
    if (/Ubuntu/.test(ua)) return { os: 'ubuntu', name: 'Ubuntu' }
    if (/Fedora/.test(ua)) return { os: 'fedora', name: 'Fedora' }
    if (/Debian/.test(ua)) return { os: 'debian', name: 'Debian' }
    if (/Arch/.test(ua)) return { os: 'arch', name: 'Arch Linux' }
    if (/CentOS/.test(ua)) return { os: 'centos', name: 'CentOS' }
    if (/Red Hat/.test(ua)) return { os: 'redhat', name: 'Red Hat' }
    return { os: 'linux', name: 'Linux' }
  }
  
  // Check for ChromeOS
  if (/CrOS/.test(ua)) {
    return { os: 'chromeos', name: 'ChromeOS' }
  }
  
  // Check for FreeBSD
  if (/FreeBSD/.test(ua)) {
    return { os: 'freebsd', name: 'FreeBSD' }
  }
  
  return { os: 'unknown', name: 'Unknown' }
}

// OS Icons as SVG components
const OSIcon = ({ os, className = "w-4 h-4" }) => {
  switch (os) {
    case 'windows':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
        </svg>
      )
    case 'macos':
    case 'ios':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      )
    case 'linux':
    case 'ubuntu':
    case 'debian':
    case 'fedora':
    case 'arch':
    case 'centos':
    case 'redhat':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.504 0c-.155 0-.311.004-.466.014-.956.057-1.857.285-2.694.638-.238.1-.475.21-.708.327-.241.122-.477.255-.704.39-.037.022-.07.046-.106.069-.04.025-.079.052-.117.079a7.53 7.53 0 00-.628.482c-.157.132-.31.27-.457.412a6.926 6.926 0 00-.633.683c-.085.102-.168.205-.248.311-.069.093-.137.187-.201.283-.058.086-.115.173-.168.261-.05.086-.098.173-.143.261-.044.088-.085.177-.124.266a5.37 5.37 0 00-.2.502c-.042.127-.08.256-.115.385a4.44 4.44 0 00-.079.396c-.02.129-.036.258-.048.387-.006.062-.012.124-.016.187v.194c0 .1.002.198.009.296.002.03.004.061.008.092.018.203.047.405.087.605.014.068.028.135.044.202.035.144.077.287.124.428.024.069.048.137.074.206.099.267.216.527.352.78.024.046.05.092.077.137.09.152.186.3.29.446.081.115.168.227.259.336.091.109.187.215.288.318.1.103.206.203.316.3.11.097.225.191.344.282l.116.084c.068.05.137.1.208.147.131.087.266.17.406.25.14.078.285.152.435.222.15.07.304.135.463.196.16.061.324.119.492.172.168.053.34.102.517.147.178.045.36.086.546.123.187.037.378.069.573.098.195.029.394.054.596.075.202.021.408.038.618.05.21.013.422.021.637.025h.181c.094.003.19.004.287.004zm-4.65 12.666c-.197-.295-.197-.644 0-.938l.77-1.156c.197-.295.52-.47.866-.47h1.538c.347 0 .67.175.866.47l.77 1.156c.197.294.197.643 0 .938l-.77 1.155c-.196.295-.52.47-.866.47h-1.538c-.346 0-.67-.175-.866-.47zm3.994-4.158c-.296 0-.569-.175-.716-.44L9.54 5.3c-.147-.265-.147-.615 0-.88l1.592-2.768c.147-.266.42-.44.716-.44h3.183c.296 0 .57.174.717.44l1.591 2.768c.147.265.147.615 0 .88l-1.591 2.768c-.147.265-.42.44-.717.44zm-2.73 7.988c-.296 0-.57-.175-.717-.44L6.81 13.288c-.147-.265-.147-.615 0-.88l1.591-2.768c.147-.265.42-.44.717-.44h3.183c.296 0 .57.175.717.44l1.591 2.768c.147.265.147.615 0 .88l-1.591 2.768c-.147.265-.42.44-.717.44z"/>
        </svg>
      )
    case 'android':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.523 15.341c-.5 0-.91-.41-.91-.91s.41-.91.91-.91.91.41.91.91-.41.91-.91.91m-11.046 0c-.5 0-.91-.41-.91-.91s.41-.91.91-.91.91.41.91.91-.41.91-.91.91m11.4-6.02l1.97-3.41c.11-.19.045-.43-.145-.54-.19-.11-.43-.045-.54.145l-2 3.46c-1.53-.7-3.25-1.09-5.06-1.09s-3.53.39-5.06 1.09l-2-3.46c-.11-.19-.35-.255-.54-.145-.19.11-.255.35-.145.54l1.97 3.41C2.89 11.09.5 14.42.5 18.28h23c0-3.86-2.39-7.19-5.63-8.96"/>
        </svg>
      )
    case 'chromeos':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zm0-9c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"/>
        </svg>
      )
    case 'freebsd':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.2 6.5c-.3-.6-.8-1-1.4-1.2-.1 0-.2-.1-.3-.1-.4-.1-.7 0-1.1.1-1.1.3-2.1 1.1-2.8 2-.3.4-.5.8-.6 1.2-.3 1-.2 2 .3 2.9.4.7 1 1.2 1.7 1.5.1 0 .2.1.3.1.6.2 1.2.1 1.8-.1 1-.4 1.9-1.2 2.4-2.2.3-.6.5-1.2.5-1.8.1-.9-.2-1.7-.8-2.4zm-4.3-1c-.5-.4-1.2-.5-1.8-.4-.2 0-.4.1-.6.2-.8.3-1.4.9-1.8 1.6-.2.4-.3.8-.3 1.2-.1.9.2 1.8.8 2.4.5.5 1.1.8 1.8.8h.2c.6 0 1.2-.2 1.7-.5.7-.5 1.2-1.2 1.4-2 .1-.4.1-.8.1-1.2-.1-.8-.6-1.6-1.3-2.1h-.2zM6.2 3.4c-.2-.6-.5-1.2-1-1.6-.3-.3-.7-.5-1.1-.6C3.7 1 3.3 1 2.8 1c-.5 0-1 .1-1.4.3-.3.1-.5.3-.7.5-.3.3-.5.6-.7 1 0 .1-.1.2-.1.3 0 .1-.1.2-.1.3 0 .2-.1.5 0 .7v.1c0 .2.1.4.2.6.1.1.1.2.2.3.5.7 1.3 1.2 2.2 1.3h.3c.3 0 .6 0 .9-.1.7-.2 1.4-.5 1.9-1.1.3-.3.5-.7.6-1.1.1-.2.1-.5.1-.7 0-.1 0-.3-.1-.4l.1-.3zm6.9 6.1c-.9-.2-1.9.1-2.6.6-.3.2-.5.5-.7.8-.1.1-.1.2-.2.4-.4.8-.4 1.7-.1 2.5.1.2.2.4.3.5.5.7 1.2 1.2 2 1.4.2 0 .3.1.5.1.7.1 1.3-.1 1.9-.4.7-.4 1.3-1 1.6-1.8.2-.5.3-1 .2-1.6-.1-.6-.3-1.1-.7-1.6-.5-.6-1.3-1-2.2-.9zm-.5 4.2c-.7 0-1.3-.6-1.3-1.3 0-.7.6-1.3 1.3-1.3.7 0 1.3.6 1.3 1.3 0 .8-.6 1.3-1.3 1.3zm-.1 5.9c-3.9 0-7.3-2.7-8.2-6.4-.1-.5-.2-1.1-.2-1.7 0-1.5.4-2.9 1.1-4.1l4.6 2.7c-.2.5-.3 1-.3 1.5 0 1.8 1.3 3.3 3 3.5v4.5z"/>
        </svg>
      )
    default:
      return <Monitor className={className} />
  }
}

// Install Modal Component
const InstallModal = ({ isOpen, onClose, deferredPrompt, setDeferredPrompt }) => {
  const { showToast } = useApp()
  const browser = getBrowserInfo()
  
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        showToast('OffGrid installed successfully!')
        onClose()
      }
      setDeferredPrompt(null)
    }
  }
  
  const getInstructions = () => {
    switch (browser.platform) {
      case 'ios':
        return {
          title: 'Install on iOS',
          steps: [
            { icon: <Share2 className="w-5 h-5" />, text: 'Tap the Share button in Safari\'s toolbar' },
            { icon: <Plus className="w-5 h-5" />, text: 'Scroll down and tap "Add to Home Screen"' },
            { icon: <Check className="w-5 h-5" />, text: 'Tap "Add" to install OffGrid' }
          ],
          note: 'Note: On iOS, PWAs must be installed from Safari.'
        }
      case 'android':
        return {
          title: 'Install on Android',
          steps: [
            { icon: <MoreVertical className="w-5 h-5" />, text: 'Tap the menu button (⋮) in your browser' },
            { icon: <Download className="w-5 h-5" />, text: 'Tap "Install app" or "Add to Home screen"' },
            { icon: <Check className="w-5 h-5" />, text: 'Confirm by tapping "Install"' }
          ],
          note: null
        }
      default:
        return {
          title: 'Install on Desktop',
          steps: [
            { icon: <MoreVertical className="w-5 h-5" />, text: `Click the menu button in ${browser.name}` },
            { icon: <Download className="w-5 h-5" />, text: 'Look for "Install OffGrid" or "Install app"' },
            { icon: <Monitor className="w-5 h-5" />, text: 'Or look for the install icon (⊕) in the address bar' }
          ],
          note: 'Tip: In Chrome/Edge, you may see an install icon in the address bar.'
        }
    }
  }
  
  const instructions = getInstructions()
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Install OffGrid</h2>
                <p className="text-sm text-[var(--text-secondary)]">{browser.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Native install button if available */}
          {deferredPrompt && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNativeInstall}
              className="w-full mb-6 p-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Install Now
            </motion.button>
          )}
          
          {/* Manual instructions */}
          <div className={deferredPrompt ? 'opacity-60' : ''}>
            {deferredPrompt && (
              <p className="text-sm text-[var(--text-secondary)] mb-4 text-center">
                — or install manually —
              </p>
            )}
            
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
              {instructions.title}
            </h3>
            
            <div className="space-y-3">
              {instructions.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                    {step.icon}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] pt-1.5">{step.text}</p>
                </div>
              ))}
            </div>
            
            {instructions.note && (
              <p className="mt-4 text-xs text-[var(--text-tertiary)] italic">
                {instructions.note}
              </p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <ShieldCheck className="w-4 h-4" />
            <span>Works offline • No data collection • Open source</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Theme Toggle
const ThemeToggle = ({ theme, setTheme }) => {
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-xl transition-all duration-300 hover:bg-[var(--bg-tertiary)]"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5 text-amber-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

// Accent Color Picker
const AccentPicker = ({ accent, setAccent }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl transition-all duration-300 hover:bg-[var(--bg-tertiary)] flex items-center gap-2"
        title="Change accent color"
      >
        <Palette className="w-5 h-5" />
        <div 
          className="w-3 h-3 rounded-full"
          style={{ background: accentColors.find(c => c.id === accent)?.color }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-0 top-full mt-2 p-3 glass-card rounded-xl z-[100] min-w-[180px]"
            >
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-3">Accent Color</div>
              <div className="grid grid-cols-3 gap-2">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      setAccent(color.id)
                      setIsOpen(false)
                    }}
                    className={`color-swatch relative ${accent === color.id ? 'active' : ''}`}
                    style={{ background: color.color }}
                    title={color.name}
                  >
                    {accent === color.id && (
                      <Check className="w-3 h-3 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Privacy Badge component
const PrivacyBadge = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative z-[100]">
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300"
        style={{
          background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Shield className="w-3.5 h-3.5 accent-text" />
        <span className="accent-text">100% Private</span>
        <ChevronDown className={`w-3 h-3 accent-text transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setExpanded(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-72 glass-card rounded-xl p-4 z-[100]"
            >
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 accent-text" />
                <span className="accent-text">Privacy Guarantees</span>
              </h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  No data sent to servers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  No analytics or tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Works fully offline
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Open source & verifiable
                </li>
              </ul>
              <a 
                href="https://github.com/aabbhishek/off-grid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                View source code
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Navigation items
const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/jwt', label: 'JWT Toolkit', icon: Key, shortcut: '1' },
  { path: '/json', label: 'JSON Toolkit', icon: Braces, shortcut: '2' },
  { path: '/encode', label: 'Encode/Decode', icon: Code2, shortcut: '3' },
  { path: '/hash', label: 'Hash Generator', icon: Hash, shortcut: '4' },
  { path: '/uuid', label: 'UUID Generator', icon: Fingerprint, shortcut: '5' },
  { path: '/ssl', label: 'SSL/TLS Toolkit', icon: Lock, shortcut: '6' },
  { path: '/logs', label: 'Log Analyzer', icon: FileText, shortcut: '7' },
  { path: '/vault', label: 'Local Vault', icon: KeySquare, shortcut: '8' },
]

// Tool descriptions for search
const toolDescriptions = {
  '/': ['home', 'landing', 'start', 'main'],
  '/jwt': ['jwt', 'token', 'decode', 'json web token', 'authentication', 'auth', 'bearer'],
  '/json': ['json', 'format', 'formatter', 'beautify', 'validate', 'parse', 'tree', 'diff'],
  '/encode': ['encode', 'decode', 'base64', 'url', 'html', 'entity', 'hex', 'binary', 'unicode'],
  '/hash': ['hash', 'md5', 'sha', 'sha256', 'sha512', 'checksum', 'digest', 'crypto'],
  '/uuid': ['uuid', 'guid', 'unique', 'id', 'identifier', 'v4', 'v7', 'generate'],
  '/ssl': ['ssl', 'tls', 'certificate', 'cert', 'x509', 'pem', 'der', 'csr', 'chain', 'key', 'private', 'public', 'https'],
  '/logs': ['log', 'logs', 'analyzer', 'parse', 'debug', 'error', 'trace', 'syslog', 'apache', 'nginx', 'json', 'ndjson', 'stacktrace'],
  '/vault': ['vault', 'password', 'credential', 'secret', 'server', 'ssh', 'rdp', 'database', 'encrypted', 'secure', 'storage'],
}

// Sidebar component
const Sidebar = ({ isOpen, setIsOpen, deferredPrompt, isInstalled, onShowInstallModal }) => {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  // Filter navItems based on search query
  const filteredNavItems = navItems.filter((item) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase().trim()
    const label = item.label.toLowerCase()
    const descriptions = toolDescriptions[item.path] || []
    
    return (
      label.includes(query) ||
      descriptions.some(desc => desc.includes(query))
    )
  })

  // Handle keyboard shortcut for search (/)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('')
        searchInputRef.current?.blur()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-screen w-64 lg:w-72 glass-card rounded-none lg:rounded-r-2xl z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border-color)]">
          <NavLink to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-purple-600">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              {/* Small "off" indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                <WifiOff className="w-2.5 h-2.5 text-emerald-500" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text font-display">
                OffGrid
              </h1>
              <p className="text-[10px] text-[var(--text-tertiary)] tracking-wider uppercase">
                Privacy-First Toolkit
              </p>
            </div>
          </NavLink>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tools... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-10 py-2.5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-2 font-medium">
            {searchQuery ? `Results (${filteredNavItems.length})` : 'Tools'}
          </div>
          {filteredNavItems.length > 0 ? (
            filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  setIsOpen(false)
                  setSearchQuery('')
                }}
                className={({ isActive }) => 
                  `nav-link mb-1 ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1 text-sm">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                    {item.shortcut}
                  </span>
                )}
              </NavLink>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-[var(--text-tertiary)]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tools found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </nav>

        {/* Install App & Dev Mode Toggle */}
        <div className="p-4 border-t border-[var(--border-color)] space-y-2">
          <InstallButton 
            deferredPrompt={deferredPrompt}
            isInstalled={isInstalled}
            onShowModal={onShowInstallModal}
          />
          <DevModeToggle />
        </div>
      </motion.aside>
    </>
  )
}

// Dev Mode Toggle
const DevModeToggle = () => {
  const { devMode, setDevMode } = useApp()

  return (
    <button
      onClick={() => setDevMode(!devMode)}
      className="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
    >
      <div className="flex items-center gap-3">
        <Zap className={`w-4 h-4 ${devMode ? 'accent-text' : 'text-[var(--text-tertiary)]'}`} />
        <span className={`text-sm ${devMode ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          Dev Mode
        </span>
      </div>
      <div className={`toggle-switch ${devMode ? 'active' : ''}`}></div>
    </button>
  )
}

// PWA Install Button (Sidebar version)
const InstallButton = ({ deferredPrompt, isInstalled, onShowModal }) => {
  // Show installed state
  if (isInstalled) {
    return (
      <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Smartphone className="w-4 h-4" />
        <span className="text-sm">App Installed</span>
        <Check className="w-4 h-4 ml-auto" />
      </div>
    )
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onShowModal}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
        deferredPrompt 
          ? 'bg-gradient-to-r from-[var(--accent)]/20 to-purple-500/20 hover:from-[var(--accent)]/30 hover:to-purple-500/30 border border-[var(--accent)]/30'
          : 'bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/10 border border-[var(--border-color)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <Download className={`w-4 h-4 ${deferredPrompt ? 'accent-text' : 'text-[var(--text-tertiary)]'}`} />
        <span className={`text-sm ${deferredPrompt ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
          Install App
        </span>
      </div>
      <div className={`text-[10px] px-2 py-0.5 rounded-full ${
        deferredPrompt 
          ? 'bg-[var(--accent)]/20 accent-text' 
          : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
      }`}>
        PWA
      </div>
    </motion.button>
  )
}

// Header Install Button (compact version)
const HeaderInstallButton = ({ deferredPrompt, isInstalled, onShowModal }) => {
  // If already installed, show a badge
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installed</span>
      </div>
    )
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onShowModal}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        deferredPrompt 
          ? 'bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white hover:opacity-90' 
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/20'
      }`}
      title={deferredPrompt ? "Install OffGrid as an app" : "Click for install instructions"}
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install</span>
    </motion.button>
  )
}

// Header component
const Header = ({ setIsOpen, theme, setTheme, accent, setAccent, deferredPrompt, isInstalled, onShowInstallModal }) => {
  const { isOnline } = useApp()
  const osInfo = getOSInfo()

  return (
    <header className="sticky top-0 z-[60] rounded-none border-x-0 border-t-0" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Install App Button */}
          <HeaderInstallButton 
            deferredPrompt={deferredPrompt}
            isInstalled={isInstalled}
            onShowModal={onShowInstallModal}
          />

          {/* OS Indicator */}
          <div 
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
            title={osInfo.name}
          >
            <OSIcon os={osInfo.os} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{osInfo.name}</span>
          </div>

          {/* Online/Offline indicator */}
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${
            isOnline 
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
              : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

          <ThemeToggle theme={theme} setTheme={setTheme} />
          <AccentPicker accent={accent} setAccent={setAccent} />

          <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

          <PrivacyBadge />
        </div>
      </div>
    </header>
  )
}

// Main App
function App() {
  const [isBooting, setIsBooting] = useState(() => {
    // Only show boot screen on first visit or if explicitly requested
    const hasBooted = sessionStorage.getItem('offgrid-booted')
    return !hasBooted
  })

  const [devMode, setDevMode] = useState(() => {
    const saved = localStorage.getItem('offgrid-devmode')
    return saved === 'true'
  })
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('offgrid-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  
  const [accent, setAccent] = useState(() => {
    const saved = localStorage.getItem('offgrid-accent')
    return saved || 'cyan'
  })
  
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installModalOpen, setInstallModalOpen] = useState(false)

  // Handle boot complete
  const handleBootComplete = () => {
    setIsBooting(false)
    sessionStorage.setItem('offgrid-booted', 'true')
  }

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('offgrid-theme', theme)
  }, [theme])

  // Apply accent color
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent)
    localStorage.setItem('offgrid-accent', accent)
  }, [accent])

  // Save dev mode preference
  useEffect(() => {
    localStorage.setItem('offgrid-devmode', devMode)
  }, [devMode])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // PWA Install prompt
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    const handleBeforeInstall = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      showToast('OffGrid has been installed!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Dev mode toggle
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
        setDevMode(prev => !prev)
        showToast(devMode ? 'Dev Mode disabled' : 'Dev Mode enabled')
      }
      
      // Theme toggle
      if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
      }
      
      // Tool shortcuts (1-8)
      if (!e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 8) {
          const paths = ['/jwt', '/json', '/encode', '/hash', '/uuid', '/ssl', '/logs', '/vault']
          window.location.hash = paths[num - 1]
        }
      }

      // Search focus
      if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault()
        document.querySelector('input[type="text"]')?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [devMode])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Copied to clipboard!')
    } catch (err) {
      showToast('Failed to copy')
    }
  }

  return (
    <AppContext.Provider value={{ devMode, setDevMode, isOnline, showToast, copyToClipboard, theme, accent }}>
      {/* Boot Loader */}
      <AnimatePresence>
        {isBooting && <BootLoader onComplete={handleBootComplete} />}
      </AnimatePresence>

      {/* Main App */}
      {!isBooting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen mesh-bg"
        >
          <div className="flex min-h-screen">
            <Sidebar 
              isOpen={sidebarOpen} 
              setIsOpen={setSidebarOpen}
              deferredPrompt={deferredPrompt}
              isInstalled={isInstalled}
              onShowInstallModal={() => setInstallModalOpen(true)}
            />
            
            {/* Main content with left margin on desktop for fixed sidebar */}
            <div className="flex-1 flex flex-col min-h-screen lg:ml-72 min-w-0 overflow-x-hidden">
              <Header 
                setIsOpen={setSidebarOpen} 
                theme={theme} 
                setTheme={setTheme}
                accent={accent}
                setAccent={setAccent}
                deferredPrompt={deferredPrompt}
                isInstalled={isInstalled}
                onShowInstallModal={() => setInstallModalOpen(true)}
              />
              
              <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/jwt" element={<JWTDecoder />} />
                    <Route path="/json" element={<JSONFormatter />} />
                    <Route path="/encode" element={<EncodeDecode />} />
                    <Route path="/hash" element={<HashGenerator />} />
                    <Route path="/uuid" element={<UUIDGenerator />} />
                    <Route path="/ssl/*" element={<SSLToolkit />} />
                    <Route path="/logs" element={<LogAnalyzer />} />
                    <Route path="/vault" element={<LocalVault />} />
                  </Routes>
                </AnimatePresence>
              </main>

            {/* Footer */}
            <footer className="p-4 text-center text-xs text-[var(--text-tertiary)]">
              <p className="flex items-center justify-center gap-2">
                <span>OffGrid — Your data never leaves your browser</span>
                <span>•</span>
                <a 
                  href="https://github.com/aabbhishek/off-grid" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
                >
                  <Github className="w-3 h-3" />
                  GitHub
                </a>
              </p>
            </footer>
            </div>
          </div>

          {/* Toast notifications */}
          <AnimatePresence>
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
          </AnimatePresence>

          {/* Install Modal */}
          <AnimatePresence>
            {installModalOpen && (
              <InstallModal
                isOpen={installModalOpen}
                onClose={() => setInstallModalOpen(false)}
                deferredPrompt={deferredPrompt}
                setDeferredPrompt={setDeferredPrompt}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AppContext.Provider>
  )
}

export default App
