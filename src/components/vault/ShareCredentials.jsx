// Credential Sharing Component
// Generate encrypted shareable links for credentials
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, Link, Copy, Check, X, Clock, Shield, Eye, EyeOff,
  Server, Key, ChevronDown, ChevronRight, AlertTriangle, Lock
} from 'lucide-react'
import { encrypt, decrypt, generateSalt, deriveKey, base64ToBuffer } from '../../utils/vaultCrypto'

// Time-to-live options for shared links
const TTL_OPTIONS = [
  { value: 0, label: 'No expiration', icon: '∞' },
  { value: 300, label: '5 minutes', icon: '5m' },
  { value: 900, label: '15 minutes', icon: '15m' },
  { value: 3600, label: '1 hour', icon: '1h' },
  { value: 86400, label: '24 hours', icon: '24h' },
  { value: 604800, label: '7 days', icon: '7d' }
]

// View count options
const VIEW_OPTIONS = [
  { value: 0, label: 'Unlimited views', icon: '∞' },
  { value: 1, label: 'Single view (burn after reading)', icon: '1x' },
  { value: 3, label: '3 views', icon: '3x' },
  { value: 5, label: '5 views', icon: '5x' },
  { value: 10, label: '10 views', icon: '10x' }
]

/**
 * Generate a shareable encrypted payload
 * @param {Object} data - Data to share
 * @param {string} password - Optional password protection
 * @param {Object} options - Sharing options
 * @returns {string} Base64 encoded encrypted payload
 */
const generateSharePayload = async (data, password, options = {}) => {
  const shareData = {
    type: 'offgrid-share',
    version: 1,
    created: Date.now(),
    expiresAt: options.ttl ? Date.now() + (options.ttl * 1000) : null,
    maxViews: options.maxViews || 0,
    viewCount: 0,
    data
  }

  // Encrypt with password
  const salt = generateSalt() // Returns base64 string
  const saltBuffer = base64ToBuffer(salt) // Convert to buffer for deriveKey
  // Derive actual crypto key from password
  const cryptoKey = await deriveKey(password, saltBuffer)
  const encrypted = await encrypt(shareData, cryptoKey)

  // Create payload (store salt as base64 string)
  const payload = {
    s: salt,
    e: encrypted,
    p: !!password // flag indicating password was used
  }

  // Encode to base64
  return btoa(JSON.stringify(payload))
}

/**
 * Decode and decrypt a share payload
 * @param {string} encodedPayload - Base64 encoded payload
 * @param {string} password - Password to decrypt
 * @returns {Object} Decrypted share data
 */
const decodeSharePayload = async (encodedPayload, password) => {
  try {
    const payload = JSON.parse(atob(encodedPayload))
    
    // Derive the crypto key from password and salt (convert base64 salt to buffer)
    const saltBuffer = base64ToBuffer(payload.s)
    const cryptoKey = await deriveKey(password, saltBuffer)
    const decrypted = await decrypt(payload.e, cryptoKey)
    
    // Validate
    if (decrypted.type !== 'offgrid-share') {
      throw new Error('Invalid share data')
    }

    // Check expiration
    if (decrypted.expiresAt && Date.now() > decrypted.expiresAt) {
      throw new Error('Share link has expired')
    }

    // Check view count
    if (decrypted.maxViews > 0 && decrypted.viewCount >= decrypted.maxViews) {
      throw new Error('Maximum view count reached')
    }

    return decrypted
  } catch (error) {
    throw new Error('Failed to decrypt: ' + error.message)
  }
}

// Share Modal Component
export const ShareModal = ({
  isOpen,
  onClose,
  server,
  credentials = [],
  encryptionKey
}) => {
  const [step, setStep] = useState('select') // select, configure, generated
  const [selectedItems, setSelectedItems] = useState([])
  const [sharePassword, setSharePassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usePassword, setUsePassword] = useState(true)
  const [ttl, setTtl] = useState(3600) // 1 hour default
  const [maxViews, setMaxViews] = useState(0)
  const [includeServer, setIncludeServer] = useState(true)
  const [generatedLink, setGeneratedLink] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setSelectedItems([])
      setSharePassword('')
      setGeneratedLink('')
      setGeneratedPassword('')
      setUsePassword(true)
      setError('')
    }
  }, [isOpen])

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Toggle credential selection
  const toggleCredential = (credId) => {
    setSelectedItems(prev =>
      prev.includes(credId)
        ? prev.filter(id => id !== credId)
        : [...prev, credId]
    )
  }

  // Select all credentials
  const selectAll = () => {
    if (selectedItems.length === credentials.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(credentials.map(c => c.id))
    }
  }

  // Generate share link
  const generateShareLink = async () => {
    setIsGenerating(true)
    
    try {
      // Prepare data to share
      // Helper to get credential field from either flattened or nested format
      const getField = (cred, key) => cred?.[key] || cred?.data?.[key] || null
      
      const shareData = {
        server: includeServer ? {
          name: server?.name,
          hostname: server?.hostname,
          port: server?.port,
          protocol: server?.protocol,
          environment: server?.environment,
          // Don't include server password for security
        } : null,
        credentials: credentials
          .filter(c => selectedItems.includes(c.id))
          .map(c => ({
            name: c.name,
            type: c.type,
            host: getField(c, 'host'),
            port: getField(c, 'port'),
            database: getField(c, 'database'),
            username: getField(c, 'username'),
            password: getField(c, 'password'),
            apiKey: getField(c, 'apiKey'),
            token: getField(c, 'token'),
            url: getField(c, 'url'),
            notes: c.notes
          }))
      }

      // Generate password if not using custom
      const password = usePassword 
        ? (sharePassword || crypto.randomUUID().slice(0, 12))
        : crypto.randomUUID()

      // Generate encrypted payload
      const payload = await generateSharePayload(shareData, password, {
        ttl,
        maxViews
      })

      // Generate shareable URL (use /vault route with share parameter)
      const baseUrl = window.location.origin + window.location.pathname
      const shareUrl = `${baseUrl}#/vault?share=${encodeURIComponent(payload)}`

      setGeneratedLink(shareUrl)
      setGeneratedPassword(usePassword ? password : '')
      setError('')
      setStep('generated')
    } catch (err) {
      console.error('Failed to generate share link:', err)
      setError('Failed to generate share link: ' + (err.message || 'Unknown error'))
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy to clipboard
  const handleCopy = async (text, type) => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Share Credentials</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {step === 'select' && 'Select what to share'}
                    {step === 'configure' && 'Configure sharing options'}
                    {step === 'generated' && 'Share link generated'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Step 1: Select Credentials */}
            {step === 'select' && (
              <div className="space-y-4">
                {/* Server inclusion toggle */}
                {server && (
                  <div className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeServer}
                      onChange={e => setIncludeServer(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--accent)]"
                    />
                    <Server className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <div className="flex-1">
                      <div className="text-sm text-[var(--text-primary)]">Include Server Info</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{server.name}</div>
                    </div>
                  </div>
                )}

                {/* Credentials list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Credentials</span>
                    <button
                      onClick={selectAll}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      {selectedItems.length === credentials.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {credentials.map(cred => (
                      <label
                        key={cred.id}
                        className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                          selectedItems.includes(cred.id)
                            ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(cred.id)}
                          onChange={() => toggleCredential(cred.id)}
                          className="w-4 h-4 rounded accent-[var(--accent)]"
                        />
                        <Key className="w-4 h-4 text-[var(--text-tertiary)]" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[var(--text-primary)] truncate">{cred.name}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">{cred.type}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {credentials.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-tertiary)]">
                    <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No credentials to share</p>
                  </div>
                )}

                <button
                  onClick={() => setStep('configure')}
                  disabled={selectedItems.length === 0 && !includeServer}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)]/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Configure */}
            {step === 'configure' && (
              <div className="space-y-4">
                {/* Password protection */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={usePassword}
                      onChange={e => setUsePassword(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--accent)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">Password protect</span>
                  </label>
                  
                  {usePassword && (
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={sharePassword}
                        onChange={e => setSharePassword(e.target.value)}
                        placeholder="Leave empty for auto-generated password"
                        className="w-full glass-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Link Expiration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TTL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTtl(opt.value)}
                        className={`p-2 rounded-lg text-xs text-center transition-colors ${
                          ttl === opt.value
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View limit */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">View Limit</label>
                  <div className="grid grid-cols-3 gap-2">
                    {VIEW_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setMaxViews(opt.value)}
                        className={`p-2 rounded-lg text-xs text-center transition-colors ${
                          maxViews === opt.value
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>Security notice:</strong> Shared credentials will be decrypted and re-encrypted 
                    with the share password. Anyone with the link and password can view the credentials.
                  </div>
                </div>

                {/* Error display */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('select')}
                    className="flex-1 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={generateShareLink}
                    disabled={isGenerating}
                    className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-medium disabled:opacity-50 hover:bg-[var(--accent)]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Shield className="w-4 h-4" />
                        </motion.div>
                        Encrypting...
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4" />
                        Generate Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Generated */}
            {step === 'generated' && (
              <div className="space-y-4">
                {/* Success message */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Link Generated!</h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Share the link and password with the recipient
                  </p>
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Share Link</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="w-full glass-input pr-12 font-mono text-xs"
                    />
                    <button
                      onClick={() => handleCopy(generatedLink, 'link')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)]"
                    >
                      {copied === 'link' ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--text-tertiary)]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password */}
                {generatedPassword && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={generatedPassword}
                        readOnly
                        className="w-full glass-input pr-12 font-mono"
                      />
                      <button
                        onClick={() => handleCopy(generatedPassword, 'password')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)]"
                      >
                        {copied === 'password' ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-[var(--text-tertiary)]" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Share summary */}
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)] space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Items shared:</span>
                    <span className="text-[var(--text-primary)]">
                      {selectedItems.length} credential{selectedItems.length !== 1 ? 's' : ''}
                      {includeServer && ' + server info'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Expires:</span>
                    <span className="text-[var(--text-primary)]">
                      {TTL_OPTIONS.find(o => o.value === ttl)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">View limit:</span>
                    <span className="text-[var(--text-primary)]">
                      {VIEW_OPTIONS.find(o => o.value === maxViews)?.label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent)]/90 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Import from Share Link Component
export const ImportFromShareModal = ({
  isOpen,
  onClose,
  shareData,
  onImport
}) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [decryptedData, setDecryptedData] = useState(null)
  const [isDecrypting, setIsDecrypting] = useState(false)

  const handleDecrypt = async () => {
    setIsDecrypting(true)
    setError('')
    
    try {
      const data = await decodeSharePayload(shareData, password)
      setDecryptedData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleImport = () => {
    if (decryptedData?.data) {
      onImport(decryptedData.data)
      onClose()
    }
  }

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Import Shared Credentials</h2>
                <p className="text-sm text-[var(--text-tertiary)]">Enter the password to decrypt</p>
              </div>
            </div>

            {!decryptedData ? (
              <>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter share password"
                    className="w-full glass-input pr-10"
                    onKeyDown={e => e.key === 'Enter' && handleDecrypt()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDecrypt}
                    disabled={!password || isDecrypting}
                    className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-medium disabled:opacity-50"
                  >
                    {isDecrypting ? 'Decrypting...' : 'Decrypt'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Decrypted Successfully</span>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] space-y-1">
                    {decryptedData.data?.server && (
                      <div>Server: {decryptedData.data.server.name}</div>
                    )}
                    <div>
                      Credentials: {decryptedData.data?.credentials?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
                  >
                    Import to Vault
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ShareModal

