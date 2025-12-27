import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import {
  Code2, Copy, ArrowDownUp, AlertTriangle, Info,
  Binary, Link, FileCode, Hash, RefreshCw
} from 'lucide-react'

// Encoding/Decoding functions
const encoders = {
  base64: {
    name: 'Base64',
    icon: Binary,
    color: 'from-cyan-500 to-blue-500',
    encode: (str) => btoa(unescape(encodeURIComponent(str))),
    decode: (str) => decodeURIComponent(escape(atob(str))),
    description: 'Standard Base64 encoding (RFC 4648)'
  },
  base64url: {
    name: 'Base64 URL-Safe',
    icon: Link,
    color: 'from-purple-500 to-pink-500',
    encode: (str) => {
      return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
    },
    decode: (str) => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
      while (base64.length % 4) base64 += '='
      return decodeURIComponent(escape(atob(base64)))
    },
    description: 'URL-safe Base64 variant (used in JWTs)'
  },
  url: {
    name: 'URL Encode',
    icon: Link,
    color: 'from-orange-500 to-red-500',
    encode: (str) => encodeURIComponent(str),
    decode: (str) => decodeURIComponent(str),
    description: 'Percent-encoding for URL components (RFC 3986)'
  },
  html: {
    name: 'HTML Entities',
    icon: FileCode,
    color: 'from-emerald-500 to-teal-500',
    encode: (str) => {
      const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
      return str.replace(/[&<>"']/g, (char) => entities[char])
    },
    decode: (str) => {
      const textarea = document.createElement('textarea')
      textarea.innerHTML = str
      return textarea.value
    },
    description: 'HTML entity encoding for special characters'
  },
  unicode: {
    name: 'Unicode Escape',
    icon: Hash,
    color: 'from-indigo-500 to-purple-500',
    encode: (str) => {
      return Array.from(str)
        .map(char => {
          const code = char.codePointAt(0)
          if (code > 0xFFFF) return `\\u{${code.toString(16).toUpperCase()}}`
          return `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`
        })
        .join('')
    },
    decode: (str) => {
      return str.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, extended, basic) => {
        return String.fromCodePoint(parseInt(extended || basic, 16))
      })
    },
    description: 'JavaScript Unicode escape sequences'
  },
  hex: {
    name: 'Hexadecimal',
    icon: Binary,
    color: 'from-pink-500 to-rose-500',
    encode: (str) => {
      return Array.from(new TextEncoder().encode(str))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ')
    },
    decode: (str) => {
      const bytes = str.match(/[0-9a-fA-F]{2}/g)
      if (!bytes) return ''
      return new TextDecoder().decode(new Uint8Array(bytes.map(b => parseInt(b, 16))))
    },
    description: 'Hexadecimal byte representation'
  },
  binary: {
    name: 'Binary',
    icon: Binary,
    color: 'from-slate-500 to-gray-600',
    encode: (str) => {
      return Array.from(new TextEncoder().encode(str))
        .map(b => b.toString(2).padStart(8, '0'))
        .join(' ')
    },
    decode: (str) => {
      const bytes = str.match(/[01]{8}/g)
      if (!bytes) return ''
      return new TextDecoder().decode(new Uint8Array(bytes.map(b => parseInt(b, 2))))
    },
    description: 'Binary (base-2) byte representation'
  }
}

// Byte analysis component
function ByteAnalysis({ input }) {
  if (!input) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border-color)]">
            <th className="p-2">Char</th>
            <th className="p-2">Unicode</th>
            <th className="p-2">UTF-8 Bytes</th>
            <th className="p-2">Binary</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(input).slice(0, 20).map((char, i) => {
            const codePoint = char.codePointAt(0)
            const charBytes = new TextEncoder().encode(char)
            return (
              <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]">
                <td className="p-2 font-mono accent-text">{char === ' ' ? '␣' : char}</td>
                <td className="p-2 font-mono text-[var(--text-secondary)]">U+{codePoint.toString(16).toUpperCase().padStart(4, '0')}</td>
                <td className="p-2 font-mono text-blue-500">{Array.from(charBytes).map(b => b.toString(16).padStart(2, '0')).join(' ')}</td>
                <td className="p-2 font-mono text-purple-500">{Array.from(charBytes).map(b => b.toString(2).padStart(8, '0')).join(' ')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {input.length > 20 && (
        <div className="text-xs text-[var(--text-tertiary)] p-2">Showing first 20 characters of {input.length}</div>
      )}
    </div>
  )
}

export default function EncodeDecode() {
  const { devMode, copyToClipboard } = useApp()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState('encode')
  const [encoding, setEncoding] = useState('base64')
  const [error, setError] = useState(null)
  const [showAllFormats, setShowAllFormats] = useState(false)

  useEffect(() => {
    if (!input) {
      setOutput('')
      setError(null)
      return
    }

    try {
      const encoder = encoders[encoding]
      const result = mode === 'encode' ? encoder.encode(input) : encoder.decode(input)
      setOutput(result)
      setError(null)
    } catch (e) {
      setOutput('')
      setError(`${mode === 'encode' ? 'Encoding' : 'Decoding'} error: ${e.message}`)
    }
  }, [input, mode, encoding])

  const handleSwap = () => {
    setInput(output)
    setMode(mode === 'encode' ? 'decode' : 'encode')
  }

  const getAllEncodings = () => {
    if (!input) return []
    return Object.entries(encoders).map(([key, encoder]) => {
      try {
        return { key, name: encoder.name, result: encoder.encode(input), error: null }
      } catch (e) {
        return { key, name: encoder.name, result: null, error: e.message }
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
          <Code2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">Encode / Decode</h1>
          <p className="text-sm text-[var(--text-secondary)]">Base64, URL, HTML entities, and more</p>
        </div>
      </div>

      {/* Encoding selector */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(encoders).map(([key, encoder]) => (
            <button
              key={key}
              onClick={() => setEncoding(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
                encoding === key
                  ? 'text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)]'
              }`}
              style={encoding === key ? { background: `linear-gradient(135deg, ${encoder.color.split(' ')[0].replace('from-', '')} , ${encoder.color.split(' ')[1].replace('to-', '')})`.replace('from-', '').replace('to-', '') } : {}}
            >
              <encoder.icon className="w-4 h-4" />
              {encoder.name}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">{encoders[encoding].description}</p>
      </div>

      {/* Main converter */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setMode('encode')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === 'encode' ? 'glass-button-primary' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Encode
          </button>
          <button
            onClick={handleSwap}
            className="p-2.5 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
            title="Swap input and output"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              mode === 'decode' ? 'glass-button-primary' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Decode
          </button>
        </div>

        {/* Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              {mode === 'encode' ? 'Input (Plain Text)' : 'Input (Encoded)'}
            </label>
            <button onClick={() => setInput('')} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Clear</button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter encoded text to decode...'}
            className="glass-input min-h-[150px] resize-y font-mono text-sm"
          />
          <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2">
            <span>{input.length} characters</span>
            <span>{new TextEncoder().encode(input).length} bytes</span>
          </div>
        </div>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              {mode === 'encode' ? 'Output (Encoded)' : 'Output (Decoded)'}
            </label>
            <button
              onClick={() => copyToClipboard(output)}
              disabled={!output}
              className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              <Copy className="w-3 h-3" />Copy
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            className="glass-input min-h-[150px] resize-y font-mono text-sm bg-[var(--bg-tertiary)]"
          />
          <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2">
            <span>{output.length} characters</span>
            <span>{new TextEncoder().encode(output).length} bytes</span>
          </div>
        </div>
      </div>

      {/* Multi-format view */}
      <div className="glass-card rounded-2xl p-6">
        <button
          onClick={() => setShowAllFormats(!showAllFormats)}
          className="flex items-center gap-2 text-sm text-[var(--text-primary)] mb-4"
        >
          <RefreshCw className={`w-4 h-4 transition-transform ${showAllFormats ? 'rotate-180' : ''}`} />
          {showAllFormats ? 'Hide' : 'Show'} all formats
        </button>

        <AnimatePresence>
          {showAllFormats && input && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {getAllEncodings().map(({ key, name, result, error }) => (
                <div key={key} className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium accent-text">{name}</span>
                    {result && (
                      <button onClick={() => copyToClipboard(result)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {result ? (
                    <code className="text-xs text-[var(--text-secondary)] break-all">{result}</code>
                  ) : (
                    <span className="text-xs text-red-500">{error}</span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dev Mode: Byte Analysis */}
      {devMode && input && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 accent-text" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Byte Analysis (Dev Mode)</h3>
          </div>
          <ByteAnalysis input={input} />
        </div>
      )}

      {/* Dev Mode: Encoding process */}
      {devMode && input && encoding === 'base64' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Binary className="w-4 h-4 accent-text" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Base64 Encoding Process (Dev Mode)</h3>
          </div>
          <div className="space-y-4 text-xs">
            <div>
              <div className="accent-text mb-1">1. UTF-8 Bytes</div>
              <code className="text-[var(--text-secondary)]">{Array.from(new TextEncoder().encode(input)).map(b => b.toString(16).padStart(2, '0')).join(' ')}</code>
            </div>
            <div>
              <div className="accent-text mb-1">2. Binary (grouped in 6-bit chunks for Base64)</div>
              <code className="text-[var(--text-secondary)]">{Array.from(new TextEncoder().encode(input)).map(b => b.toString(2).padStart(8, '0')).join('')}</code>
            </div>
            <div>
              <div className="accent-text mb-1">3. Base64 Alphabet</div>
              <code className="text-[var(--text-secondary)]">ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/</code>
            </div>
            <div>
              <div className="accent-text mb-1">4. Result</div>
              <code className="text-emerald-500">{output}</code>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
