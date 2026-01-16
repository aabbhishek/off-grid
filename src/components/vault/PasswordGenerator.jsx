// Password Generator Component
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Dices, Copy, Check, RefreshCw, Sliders, 
  Type, Hash, AtSign, Minus, Sparkles
} from 'lucide-react'
import {
  generatePassword, generatePassphrase,
  calculateEntropy, calculatePassphraseEntropy
} from '../../utils/vaultCrypto'

const PasswordGenerator = ({ onUse, onClose }) => {
  const [mode, setMode] = useState('password') // 'password' or 'passphrase'
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Password options
  const [options, setOptions] = useState({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false
  })
  
  // Passphrase options
  const [passphraseOptions, setPassphraseOptions] = useState({
    wordCount: 4,
    separator: '-',
    capitalize: true
  })
  
  const entropy = mode === 'password' 
    ? calculateEntropy(options)
    : calculatePassphraseEntropy(passphraseOptions.wordCount)
  
  const getEntropyLabel = () => {
    if (entropy < 40) return { label: 'Weak', color: '#ef4444' }
    if (entropy < 60) return { label: 'Fair', color: '#f97316' }
    if (entropy < 80) return { label: 'Good', color: '#eab308' }
    if (entropy < 100) return { label: 'Strong', color: '#22c55e' }
    return { label: 'Very Strong', color: '#10b981' }
  }
  
  const entropyInfo = getEntropyLabel()
  
  const generate = () => {
    if (mode === 'password') {
      setPassword(generatePassword(options))
    } else {
      setPassword(generatePassphrase(passphraseOptions))
    }
    setCopied(false)
  }
  
  useEffect(() => {
    generate()
  }, [mode, options, passphraseOptions])
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleUse = () => {
    if (onUse) onUse(password)
    handleCopy()
  }
  
  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 rounded-lg bg-[var(--bg-tertiary)]">
        <button
          onClick={() => setMode('password')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            mode === 'password' 
              ? 'bg-[var(--accent)] text-white' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setMode('passphrase')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            mode === 'passphrase' 
              ? 'bg-[var(--accent)] text-white' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Passphrase
        </button>
      </div>
      
      {/* Generated Password Display */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 font-mono text-lg text-[var(--text-primary)] break-all select-all">
            {password}
          </code>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={generate}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Generate new"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        {/* Entropy Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: entropyInfo.color }} />
            <span style={{ color: entropyInfo.color }}>{entropyInfo.label}</span>
          </div>
          <span className="text-[var(--text-tertiary)]">{entropy} bits of entropy</span>
        </div>
      </div>
      
      {/* Options */}
      <div className="space-y-4">
        {mode === 'password' ? (
          <>
            {/* Length Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[var(--text-secondary)]">Length</label>
                <span className="text-sm font-mono text-[var(--text-primary)]">{options.length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>8</span>
                <span>64</span>
              </div>
            </div>
            
            {/* Character Sets */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors">
                <input
                  type="checkbox"
                  checked={options.uppercase}
                  onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm">Uppercase</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors">
                <input
                  type="checkbox"
                  checked={options.lowercase}
                  onChange={(e) => setOptions({ ...options, lowercase: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-[var(--text-tertiary)]" style={{ transform: 'scale(0.8)' }} />
                  <span className="text-sm">Lowercase</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors">
                <input
                  type="checkbox"
                  checked={options.numbers}
                  onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm">Numbers</span>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors">
                <input
                  type="checkbox"
                  checked={options.symbols}
                  onChange={(e) => setOptions({ ...options, symbols: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                <div className="flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm">Symbols</span>
                </div>
              </label>
            </div>
            
            {/* Exclude Ambiguous */}
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors">
              <input
                type="checkbox"
                checked={options.excludeAmbiguous}
                onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--accent)]"
              />
              <div>
                <span className="text-sm">Exclude ambiguous characters</span>
                <p className="text-xs text-[var(--text-tertiary)]">0O1lI (similar looking characters)</p>
              </div>
            </label>
          </>
        ) : (
          <>
            {/* Word Count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[var(--text-secondary)]">Number of Words</label>
                <span className="text-sm font-mono text-[var(--text-primary)]">{passphraseOptions.wordCount}</span>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                value={passphraseOptions.wordCount}
                onChange={(e) => setPassphraseOptions({ ...passphraseOptions, wordCount: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>3</span>
                <span>8</span>
              </div>
            </div>
            
            {/* Separator */}
            <div className="space-y-2">
              <label className="text-sm text-[var(--text-secondary)]">Word Separator</label>
              <div className="flex gap-2">
                {['-', ' ', '.', '_', ''].map(sep => (
                  <button
                    key={sep || 'none'}
                    onClick={() => setPassphraseOptions({ ...passphraseOptions, separator: sep })}
                    className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
                      passphraseOptions.separator === sep
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {sep || 'None'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Capitalize */}
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors">
              <input
                type="checkbox"
                checked={passphraseOptions.capitalize}
                onChange={(e) => setPassphraseOptions({ ...passphraseOptions, capitalize: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--accent)]"
              />
              <span className="text-sm">Capitalize first letter of each word</span>
            </label>
          </>
        )}
      </div>
      
      {/* Use Button */}
      {onUse && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUse}
          className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Use This Password
        </motion.button>
      )}
    </div>
  )
}

export default PasswordGenerator

