import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import { 
  Key, Copy, CheckCircle, XCircle, AlertTriangle, 
  Clock, Shield, Eye, EyeOff, RefreshCw, Info,
  ChevronDown, ChevronRight, Lock, Unlock
} from 'lucide-react'

// Base64URL decode
function base64UrlDecode(str) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    return atob(base64)
  } catch (e) {
    throw new Error('Invalid Base64URL encoding')
  }
}

// Parse JWT
function parseJWT(token) {
  const cleaned = token.trim().replace(/^Bearer\s+/i, '')
  const parts = cleaned.split('.')
  
  if (parts.length !== 3) {
    throw new Error(`JWT must have 3 parts, found ${parts.length}`)
  }

  const [headerB64, payloadB64, signature] = parts

  let header, payload
  try {
    header = JSON.parse(base64UrlDecode(headerB64))
  } catch (e) {
    throw new Error('Invalid header: ' + e.message)
  }

  try {
    payload = JSON.parse(base64UrlDecode(payloadB64))
  } catch (e) {
    throw new Error('Invalid payload: ' + e.message)
  }

  return { header, payload, signature, parts: { headerB64, payloadB64, signature } }
}

// Get token status
function getTokenStatus(payload) {
  const now = Math.floor(Date.now() / 1000)
  
  if (payload.exp) {
    if (payload.exp < now) {
      const expiredAgo = now - payload.exp
      return { 
        status: 'expired', 
        message: `Expired ${formatTimeDiff(expiredAgo)} ago`,
        icon: XCircle,
        className: 'status-invalid'
      }
    }
    const expiresIn = payload.exp - now
    return { 
      status: 'valid', 
      message: `Expires in ${formatTimeDiff(expiresIn)}`,
      icon: CheckCircle,
      className: 'status-valid'
    }
  }
  
  if (payload.nbf && payload.nbf > now) {
    const notYet = payload.nbf - now
    return { 
      status: 'not-yet-valid', 
      message: `Not valid for ${formatTimeDiff(notYet)}`,
      icon: AlertTriangle,
      className: 'status-warning'
    }
  }

  return { 
    status: 'unknown', 
    message: 'No expiration claim',
    icon: Info,
    className: 'text-[var(--text-tertiary)]'
  }
}

// Format time difference
function formatTimeDiff(seconds) {
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
  return `${Math.floor(seconds / 86400)} days`
}

// Format timestamp
function formatTimestamp(ts) {
  const date = new Date(ts * 1000)
  return {
    unix: ts,
    iso: date.toISOString(),
    local: date.toLocaleString(),
    relative: getRelativeTime(ts)
  }
}

function getRelativeTime(ts) {
  const now = Math.floor(Date.now() / 1000)
  const diff = ts - now
  if (diff > 0) {
    return `in ${formatTimeDiff(diff)}`
  } else {
    return `${formatTimeDiff(Math.abs(diff))} ago`
  }
}

// Standard claims reference
const standardClaims = {
  iss: { name: 'Issuer', desc: 'Principal that issued the JWT' },
  sub: { name: 'Subject', desc: 'Principal that is the subject of the JWT' },
  aud: { name: 'Audience', desc: 'Recipients that the JWT is intended for' },
  exp: { name: 'Expiration Time', desc: 'Time after which the JWT must not be accepted' },
  nbf: { name: 'Not Before', desc: 'Time before which the JWT must not be accepted' },
  iat: { name: 'Issued At', desc: 'Time at which the JWT was issued' },
  jti: { name: 'JWT ID', desc: 'Unique identifier for the JWT' }
}

// JSON Syntax Highlighter
function SyntaxHighlight({ json }) {
  const formatted = JSON.stringify(json, null, 2)
  
  const highlighted = formatted
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="highlight-key">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="highlight-string">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="highlight-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="highlight-boolean">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="highlight-null">$1</span>')

  return (
    <pre 
      className="code-block whitespace-pre-wrap break-all"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}

// Collapsible Section
function Section({ title, icon: Icon, children, defaultOpen = true, badge, color = 'var(--accent)' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4" style={{ color }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color }} />
        )}
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="font-medium text-[var(--text-primary)]">{title}</span>
        {badge && (
          <span className="ml-auto badge">{badge}</span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--border-color)]"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function JWTDecoder() {
  const { devMode, copyToClipboard, showToast } = useApp()
  const [input, setInput] = useState('')
  const [decoded, setDecoded] = useState(null)
  const [error, setError] = useState(null)
  const [secret, setSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [tokenStatus, setTokenStatus] = useState(null)

  // Decode JWT on input change
  useEffect(() => {
    if (!input.trim()) {
      setDecoded(null)
      setError(null)
      setTokenStatus(null)
      return
    }

    try {
      const result = parseJWT(input)
      setDecoded(result)
      setError(null)
      setTokenStatus(getTokenStatus(result.payload))
    } catch (e) {
      setDecoded(null)
      setError(e.message)
      setTokenStatus(null)
    }
  }, [input])

  // Verify signature (HS256 only)
  const verifySignature = async () => {
    if (!decoded || !secret) return

    try {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const signatureInput = `${decoded.parts.headerB64}.${decoded.parts.payloadB64}`
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signatureInput)
      )

      const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const isValid = computed === decoded.parts.signature
      setVerificationResult(isValid ? 'valid' : 'invalid')
      showToast(isValid ? 'Signature valid!' : 'Signature invalid')
    } catch (e) {
      setVerificationResult('error')
      showToast('Verification error: ' + e.message)
    }
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
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500">
          <Key className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">JWT Decoder</h1>
          <p className="text-sm text-[var(--text-secondary)]">Decode and verify JSON Web Tokens securely</p>
        </div>
      </div>

      {/* Input */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-[var(--text-primary)]">Paste your JWT</label>
          <button
            onClick={() => setInput('')}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          className="glass-input min-h-[120px] resize-y font-mono text-xs"
        />

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token status */}
        <AnimatePresence>
          {tokenStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <div className={tokenStatus.className}>
                <tokenStatus.icon className="w-4 h-4" />
                <span className="font-medium">{tokenStatus.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decoded sections */}
      <AnimatePresence>
        {decoded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Header Section */}
            <Section title="Header" icon={Shield} badge={decoded.header.alg} color="#3b82f6">
              <SyntaxHighlight json={decoded.header} />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2))}
                  className="glass-button text-xs py-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy Header
                </button>
              </div>

              {decoded.header.alg === 'none' && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Security Warning</span>
                  </div>
                  <p className="mt-1 text-xs text-red-400/70">
                    Algorithm "none" means this token is unsigned. This is a security vulnerability.
                  </p>
                </div>
              )}
            </Section>

            {/* Payload Section */}
            <Section title="Payload" icon={Eye} color="#a855f7">
              <SyntaxHighlight json={decoded.payload} />
              
              {/* Standard claims explanation */}
              <div className="mt-4 space-y-2">
                {Object.entries(decoded.payload).map(([key, value]) => {
                  const claim = standardClaims[key]
                  if (!claim) return null
                  
                  return (
                    <div key={key} className="flex items-start gap-3 text-xs">
                      <span className="accent-text font-medium w-8">{key}</span>
                      <span className="text-[var(--text-tertiary)]">{claim.name}:</span>
                      {['exp', 'nbf', 'iat'].includes(key) && typeof value === 'number' ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                          <span className="text-[var(--text-primary)]">{new Date(value * 1000).toLocaleString()}</span>
                          <span className="accent-text">({getRelativeTime(value)})</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-primary)]">{JSON.stringify(value)}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2))}
                  className="glass-button text-xs py-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy Payload
                </button>
              </div>
            </Section>

            {/* Signature Verification */}
            <Section title="Signature Verification" icon={Lock} defaultOpen={false} color="#10b981">
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Enter your secret key to verify the signature. All verification happens locally.
                </p>
                
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={secret}
                    onChange={(e) => {
                      setSecret(e.target.value)
                      setVerificationResult(null)
                    }}
                    placeholder="Enter secret key for HS256 verification"
                    className="glass-input pr-20"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={verifySignature}
                  disabled={!secret || decoded.header.alg !== 'HS256'}
                  className="glass-button-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield className="w-4 h-4" />
                  Verify Signature
                </button>

                {decoded.header.alg !== 'HS256' && (
                  <p className="text-xs text-amber-500">
                    Note: This demo only supports HS256 verification. Algorithm: {decoded.header.alg}
                  </p>
                )}

                {/* Verification result */}
                <AnimatePresence>
                  {verificationResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 rounded-xl ${
                        verificationResult === 'valid' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'bg-red-500/10 border border-red-500/20'
                      }`}
                    >
                      <div className={`flex items-center gap-2 ${
                        verificationResult === 'valid' ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {verificationResult === 'valid' ? (
                          <>
                            <Unlock className="w-5 h-5" />
                            <span className="font-medium">Signature Valid</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            <span className="font-medium">Signature Invalid</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Section>

            {/* Dev Mode: Raw Parts */}
            {devMode && (
              <Section title="Raw Parts (Dev Mode)" icon={RefreshCw} defaultOpen={false} color="#f97316">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs accent-text mb-2">Header (Base64URL)</div>
                    <code className="block p-2 rounded-lg bg-[var(--bg-tertiary)] text-xs break-all text-[var(--text-secondary)]">
                      {decoded.parts.headerB64}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs accent-text mb-2">Payload (Base64URL)</div>
                    <code className="block p-2 rounded-lg bg-[var(--bg-tertiary)] text-xs break-all text-[var(--text-secondary)]">
                      {decoded.parts.payloadB64}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs accent-text mb-2">Signature (Base64URL)</div>
                    <code className="block p-2 rounded-lg bg-[var(--bg-tertiary)] text-xs break-all text-[var(--text-secondary)]">
                      {decoded.parts.signature}
                    </code>
                  </div>
                </div>
              </Section>
            )}

            {/* Dev Mode: Claims Reference */}
            {devMode && (
              <Section title="Standard Claims Reference (Dev Mode)" icon={Info} defaultOpen={false} color="#ec4899">
                <div className="grid gap-2">
                  {Object.entries(standardClaims).map(([key, claim]) => (
                    <div 
                      key={key}
                      className="flex items-start gap-4 p-2 rounded-lg hover:bg-[var(--bg-tertiary)]"
                    >
                      <code className="accent-text text-xs font-bold w-8">{key}</code>
                      <div>
                        <div className="text-sm text-[var(--text-primary)]">{claim.name}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">{claim.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!decoded && !error && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Key className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No JWT to decode</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Paste a JWT above to decode its header and payload
          </p>
        </div>
      )}
    </motion.div>
  )
}
