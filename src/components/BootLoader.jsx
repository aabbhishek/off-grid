import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const bootSequence = [
  { text: 'BIOS POST...', delay: 200 },
  { text: 'Memory check: 16384 MB OK', delay: 150 },
  { text: 'Detecting hardware...', delay: 300 },
  { text: '', delay: 100 },
  { text: '╔══════════════════════════════════════════════════════════╗', delay: 50 },
  { text: '║                                                          ║', delay: 30 },
  { text: '║     ██████╗ ███████╗███████╗ ██████╗ ██████╗ ██╗██████╗  ║', delay: 30 },
  { text: '║    ██╔═══██╗██╔════╝██╔════╝██╔════╝ ██╔══██╗██║██╔══██╗ ║', delay: 30 },
  { text: '║    ██║   ██║█████╗  █████╗  ██║  ███╗██████╔╝██║██║  ██║ ║', delay: 30 },
  { text: '║    ██║   ██║██╔══╝  ██╔══╝  ██║   ██║██╔══██╗██║██║  ██║ ║', delay: 30 },
  { text: '║    ╚██████╔╝██║     ██║     ╚██████╔╝██║  ██║██║██████╔╝ ║', delay: 30 },
  { text: '║     ╚═════╝ ╚═╝     ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ║', delay: 30 },
  { text: '║                                                          ║', delay: 30 },
  { text: '║            Privacy-First Developer Toolkit               ║', delay: 30 },
  { text: '║                     v1.0.0                                ║', delay: 30 },
  { text: '║                                                          ║', delay: 30 },
  { text: '║       विद्या ददाति विनयं विनयाद् याति पात्रताम्              ║', delay: 30, sanskrit: true },
  { text: '║             (Vidya Dadati Vinayam)                        ║', delay: 30, transliteration: true },
  { text: '║           "Knowledge gives humility"                      ║', delay: 30 },
  { text: '║                                                          ║', delay: 30 },
  { text: '║                  Made in India 🇮🇳                         ║', delay: 30 },
  { text: '║                                                          ║', delay: 30 },
  { text: '╚══════════════════════════════════════════════════════════╝', delay: 50 },
  { text: '', delay: 100 },
  { text: 'Loading OFFGRID kernel...', delay: 200 },
  { text: '[  OK  ] Started Privacy Shield Service', delay: 150, status: 'ok' },
  { text: '[  OK  ] Started Local Processing Engine', delay: 120, status: 'ok' },
  { text: '[  OK  ] Started Zero-Transmission Protocol', delay: 100, status: 'ok' },
  { text: '[  OK  ] Started Offline Mode Handler', delay: 80, status: 'ok' },
  { text: '[  OK  ] Started Encryption Module', delay: 100, status: 'ok' },
  { text: '', delay: 50 },
  { text: 'Initializing modules...', delay: 150 },
  { text: '  → JWT Toolkit ........................... loaded', delay: 80 },
  { text: '  → JSON Toolkit ......................... loaded', delay: 80 },
  { text: '  → Encode/Decode Tools .................. loaded', delay: 80 },
  { text: '  → Hash Generator ....................... loaded', delay: 80 },
  { text: '  → UUID Generator ....................... loaded', delay: 80 },
  { text: '  → SSL/TLS Toolkit ...................... loaded', delay: 80 },
  { text: '  → Log Analyzer ......................... loaded', delay: 80 },
  { text: '  → Local Vault (Encrypted) .............. loaded', delay: 80 },
  { text: '', delay: 100 },
  { text: '[  OK  ] All systems operational', delay: 150, status: 'ok' },
  { text: '[  OK  ] Your data never leaves your browser', delay: 100, status: 'ok' },
  { text: '', delay: 100 },
  { text: 'Welcome to OffGrid. Press any key or wait to continue...', delay: 300 },
]

export default function BootLoader({ onComplete }) {
  const [lines, setLines] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (currentIndex < bootSequence.length) {
      const timer = setTimeout(() => {
        setLines(prev => [...prev, bootSequence[currentIndex]])
        setCurrentIndex(prev => prev + 1)
        setProgress(Math.round(((currentIndex + 1) / bootSequence.length) * 100))
      }, bootSequence[currentIndex].delay)
      return () => clearTimeout(timer)
    } else {
      setIsComplete(true)
    }
  }, [currentIndex])

  // Auto-complete after boot sequence or on any key press
  useEffect(() => {
    const handleKeyPress = () => {
      if (currentIndex > 10) {
        onComplete()
      }
    }

    const handleClick = () => {
      if (currentIndex > 10) {
        onComplete()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('click', handleClick)

    // Auto-continue after 1.5 seconds when complete
    if (isComplete) {
      const timer = setTimeout(onComplete, 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('keydown', handleKeyPress)
        window.removeEventListener('click', handleClick)
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('click', handleClick)
    }
  }, [isComplete, currentIndex, onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black z-[9999] overflow-hidden font-mono"
    >
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
        }}
      />

      {/* Terminal content */}
      <div className="h-full overflow-hidden p-4 md:p-8">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Terminal header */}
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-900/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-green-600 text-xs ml-2">offgrid@system ~ boot</span>
            <div className="flex-1" />
            <span className="text-green-700 text-xs">{progress}%</span>
          </div>

          {/* Boot log */}
          <div className="flex-1 overflow-y-auto text-xs md:text-sm leading-relaxed">
            {lines.map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                className="whitespace-pre"
              >
                {line.status === 'ok' ? (
                  <span>
                    <span className="text-green-500">[  OK  ]</span>
                    <span className="text-green-400">{line.text.replace('[  OK  ]', '')}</span>
                  </span>
                ) : line.status === 'fail' ? (
                  <span>
                    <span className="text-red-500">[FAILED]</span>
                    <span className="text-red-400">{line.text.replace('[FAILED]', '')}</span>
                  </span>
                ) : line.sanskrit ? (
                  <span className="text-amber-400">{line.text}</span>
                ) : line.transliteration ? (
                  <span className="text-amber-500/80">{line.text}</span>
                ) : line.text.includes('"Knowledge gives') ? (
                  <span className="text-amber-300/70">{line.text}</span>
                ) : line.text.includes('Made in India') ? (
                  <span className="text-orange-400">{line.text}</span>
                ) : line.text.includes('═') || line.text.includes('║') || line.text.includes('╔') || line.text.includes('╚') || line.text.includes('█') ? (
                  <span className="text-cyan-400">{line.text}</span>
                ) : line.text.includes('→') ? (
                  <span className="text-green-300">{line.text}</span>
                ) : line.text.includes('...') ? (
                  <span className="text-yellow-400">{line.text}</span>
                ) : (
                  <span className="text-green-500">{line.text}</span>
                )}
              </motion.div>
            ))}

            {/* Cursor - solid, no blinking */}
            {!isComplete && (
              <span className="inline-block w-2 h-4 bg-green-500 ml-1" />
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-2 border-t border-green-900/30">
            <div className="h-1 bg-green-900/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-600 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-green-700">
              <span>OFFGRID BOOT LOADER v1.0</span>
              <span>{isComplete ? 'READY' : 'LOADING...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skip hint */}
      {currentIndex > 10 && !isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 right-4 text-green-700 text-xs"
        >
          Press any key to skip...
        </motion.div>
      )}
    </motion.div>
  )
}
