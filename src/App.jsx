import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Key, Braces, Code2, Hash, Fingerprint, 
  Search, ShieldOff, Wifi, WifiOff, Github, 
  ChevronDown, Zap, Menu, X, Home, Sun, Moon,
  Palette, Check, ShieldCheck
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
                href="https://github.com" 
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
  { path: '/jwt', label: 'JWT Decoder', icon: Key, shortcut: '1' },
  { path: '/json', label: 'JSON Formatter', icon: Braces, shortcut: '2' },
  { path: '/encode', label: 'Encode/Decode', icon: Code2, shortcut: '3' },
  { path: '/hash', label: 'Hash Generator', icon: Hash, shortcut: '4' },
  { path: '/uuid', label: 'UUID Generator', icon: Fingerprint, shortcut: '5' },
]

// Sidebar component
const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()

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
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 glass-card rounded-none lg:rounded-r-2xl z-50 flex flex-col ${
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
              type="text"
              placeholder="Search tools... (/)"
              className="glass-input pl-10 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-2 font-medium">
            Tools
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
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
          ))}
        </nav>

        {/* Dev Mode Toggle */}
        <div className="p-4 border-t border-[var(--border-color)]">
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

// Header component
const Header = ({ setIsOpen, theme, setTheme, accent, setAccent }) => {
  const { isOnline } = useApp()

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
      
      // Tool shortcuts (1-5)
      if (!e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 5) {
          const paths = ['/jwt', '/json', '/encode', '/hash', '/uuid']
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
          <div className="flex">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            
            <div className="flex-1 flex flex-col min-h-screen">
              <Header 
                setIsOpen={setSidebarOpen} 
                theme={theme} 
                setTheme={setTheme}
                accent={accent}
                setAccent={setAccent}
              />
              
              <main className="flex-1 p-4 lg:p-6 relative z-0">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/jwt" element={<JWTDecoder />} />
                    <Route path="/json" element={<JSONFormatter />} />
                    <Route path="/encode" element={<EncodeDecode />} />
                    <Route path="/hash" element={<HashGenerator />} />
                    <Route path="/uuid" element={<UUIDGenerator />} />
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
        </motion.div>
      )}
    </AppContext.Provider>
  )
}

export default App
