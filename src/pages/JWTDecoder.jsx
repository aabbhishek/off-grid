import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import { 
  Key, Copy, CheckCircle, XCircle, AlertTriangle, 
  Clock, Shield, Eye, EyeOff, RefreshCw, Info,
  ChevronDown, ChevronRight, Lock, Unlock, Plus,
  Trash2, Download, Upload, Shuffle, Play, Pause,
  ArrowLeftRight, FileJson, Settings, Zap, Timer,
  FileKey, Layers, GitCompare, FileCode, Wand2
} from 'lucide-react'

// ==================== UTILITY FUNCTIONS ====================

// Base64URL encode/decode
function base64UrlEncode(str) {
  const base64 = btoa(str)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

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

function base64UrlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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

// Create JWT from parts
function createJWT(header, payload, signature = '') {
  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  return `${headerB64}.${payloadB64}.${signature}`
}

// Algorithm configurations
const ALGORITHMS = {
  HS256: { name: 'HMAC', hash: 'SHA-256', type: 'symmetric' },
  HS384: { name: 'HMAC', hash: 'SHA-384', type: 'symmetric' },
  HS512: { name: 'HMAC', hash: 'SHA-512', type: 'symmetric' },
  RS256: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256', type: 'asymmetric' },
  RS384: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384', type: 'asymmetric' },
  RS512: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512', type: 'asymmetric' },
  ES256: { name: 'ECDSA', hash: 'SHA-256', namedCurve: 'P-256', type: 'asymmetric' },
  ES384: { name: 'ECDSA', hash: 'SHA-384', namedCurve: 'P-384', type: 'asymmetric' },
  ES512: { name: 'ECDSA', hash: 'SHA-512', namedCurve: 'P-521', type: 'asymmetric' },
  PS256: { name: 'RSA-PSS', hash: 'SHA-256', saltLength: 32, type: 'asymmetric' },
  PS384: { name: 'RSA-PSS', hash: 'SHA-384', saltLength: 48, type: 'asymmetric' },
  PS512: { name: 'RSA-PSS', hash: 'SHA-512', saltLength: 64, type: 'asymmetric' },
  none: { name: 'none', type: 'none' }
}

// Sign JWT
async function signJWT(header, payload, secret, algorithm = 'HS256') {
  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const signatureInput = `${headerB64}.${payloadB64}`
  
  if (algorithm === 'none') {
    return `${signatureInput}.`
  }
  
  const algConfig = ALGORITHMS[algorithm]
  if (!algConfig) throw new Error(`Unsupported algorithm: ${algorithm}`)
  
  const encoder = new TextEncoder()
  
  if (algConfig.type === 'symmetric') {
    // HMAC signing
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: algConfig.hash },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureInput))
    return `${signatureInput}.${arrayBufferToBase64Url(signature)}`
  } else {
    // Asymmetric signing
    const keyData = parsePEMKey(secret)
    let key
    
    if (algConfig.name === 'RSASSA-PKCS1-v1_5' || algConfig.name === 'RSA-PSS') {
      key = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        { name: algConfig.name, hash: algConfig.hash },
        false,
        ['sign']
      )
    } else if (algConfig.name === 'ECDSA') {
      key = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        { name: 'ECDSA', namedCurve: algConfig.namedCurve },
        false,
        ['sign']
      )
    }
    
    const signParams = algConfig.name === 'RSA-PSS' 
      ? { name: 'RSA-PSS', saltLength: algConfig.saltLength }
      : algConfig.name === 'ECDSA'
        ? { name: 'ECDSA', hash: algConfig.hash }
        : { name: algConfig.name }
    
    const signature = await crypto.subtle.sign(signParams, key, encoder.encode(signatureInput))
    return `${signatureInput}.${arrayBufferToBase64Url(signature)}`
  }
}

// Verify JWT signature
async function verifyJWT(token, secret, expectedAlgorithm = null) {
  const parsed = parseJWT(token)
  const { header, parts } = parsed
  const algorithm = header.alg
  
  if (expectedAlgorithm && algorithm !== expectedAlgorithm) {
    throw new Error(`Algorithm mismatch: expected ${expectedAlgorithm}, got ${algorithm}`)
  }
  
  if (algorithm === 'none') {
    return { valid: parts.signature === '', message: 'Token has no signature (alg: none)', warning: true }
  }
  
  const algConfig = ALGORITHMS[algorithm]
  if (!algConfig) throw new Error(`Unsupported algorithm: ${algorithm}`)
  
  const signatureInput = `${parts.headerB64}.${parts.payloadB64}`
  const encoder = new TextEncoder()
  const signatureBuffer = base64UrlToArrayBuffer(parts.signature)
  
  if (algConfig.type === 'symmetric') {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: algConfig.hash },
      false,
      ['verify']
    )
    const valid = await crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(signatureInput))
    return { valid, message: valid ? 'Signature valid' : 'Signature invalid' }
  } else {
    const keyData = parsePEMKey(secret)
    let key
    
    if (algConfig.name === 'RSASSA-PKCS1-v1_5' || algConfig.name === 'RSA-PSS') {
      key = await crypto.subtle.importKey(
        'spki',
        keyData,
        { name: algConfig.name, hash: algConfig.hash },
        false,
        ['verify']
      )
    } else if (algConfig.name === 'ECDSA') {
      key = await crypto.subtle.importKey(
        'spki',
        keyData,
        { name: 'ECDSA', namedCurve: algConfig.namedCurve },
        false,
        ['verify']
      )
    }
    
    const verifyParams = algConfig.name === 'RSA-PSS'
      ? { name: 'RSA-PSS', saltLength: algConfig.saltLength }
      : algConfig.name === 'ECDSA'
        ? { name: 'ECDSA', hash: algConfig.hash }
        : { name: algConfig.name }
    
    const valid = await crypto.subtle.verify(verifyParams, key, signatureBuffer, encoder.encode(signatureInput))
    return { valid, message: valid ? 'Signature valid' : 'Signature invalid' }
  }
}

// Parse PEM key
function parsePEMKey(pem) {
  const lines = pem.trim().split('\n')
  const base64 = lines.filter(line => !line.startsWith('-----')).join('')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Get token status with custom time
function getTokenStatus(payload, customTime = null) {
  const now = customTime !== null ? customTime : Math.floor(Date.now() / 1000)
  
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

// Validate all claims
function validateClaims(payload, options = {}, customTime = null) {
  const now = customTime !== null ? customTime : Math.floor(Date.now() / 1000)
  const tolerance = options.clockTolerance || 0
  const checks = []
  
  // Expiration check
  if (payload.exp !== undefined) {
    const isValid = payload.exp + tolerance >= now
    checks.push({
      claim: 'exp',
      name: 'Expiration',
      status: isValid ? 'pass' : 'fail',
      value: payload.exp,
      message: isValid 
        ? `Expires ${getRelativeTime(payload.exp, now)}` 
        : `Expired ${formatTimeDiff(now - payload.exp)} ago`
    })
  }
  
  // Not Before check
  if (payload.nbf !== undefined) {
    const isValid = payload.nbf - tolerance <= now
    checks.push({
      claim: 'nbf',
      name: 'Not Before',
      status: isValid ? 'pass' : 'fail',
      value: payload.nbf,
      message: isValid 
        ? 'Token is active' 
        : `Not valid for ${formatTimeDiff(payload.nbf - now)}`
    })
  }
  
  // Issued At check
  if (payload.iat !== undefined) {
    const isValid = payload.iat - tolerance <= now
    checks.push({
      claim: 'iat',
      name: 'Issued At',
      status: isValid ? 'pass' : 'warn',
      value: payload.iat,
      message: isValid 
        ? `Issued ${formatTimeDiff(now - payload.iat)} ago`
        : 'Token issued in the future!'
    })
  }
  
  // Issuer check
  if (options.expectedIssuer && payload.iss !== undefined) {
    const isValid = payload.iss === options.expectedIssuer
    checks.push({
      claim: 'iss',
      name: 'Issuer',
      status: isValid ? 'pass' : 'fail',
      value: payload.iss,
      message: isValid ? 'Issuer matches' : `Expected: ${options.expectedIssuer}`
    })
  }
  
  // Audience check
  if (options.expectedAudience && payload.aud !== undefined) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    const isValid = audiences.includes(options.expectedAudience)
    checks.push({
      claim: 'aud',
      name: 'Audience',
      status: isValid ? 'pass' : 'fail',
      value: payload.aud,
      message: isValid ? 'Audience matches' : `Expected: ${options.expectedAudience}`
    })
  }
  
  return checks
}

// Format time difference
function formatTimeDiff(seconds) {
  const abs = Math.abs(seconds)
  if (abs < 60) return `${abs} seconds`
  if (abs < 3600) return `${Math.floor(abs / 60)} minutes`
  if (abs < 86400) return `${Math.floor(abs / 3600)} hours`
  return `${Math.floor(abs / 86400)} days`
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

function getRelativeTime(ts, now = null) {
  const currentTime = now !== null ? now : Math.floor(Date.now() / 1000)
  const diff = ts - currentTime
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

// JWT Templates
const jwtTemplates = {
  accessToken: {
    name: 'Access Token',
    description: 'Standard API access token',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      iss: 'https://api.example.com',
      sub: 'user_123',
      aud: 'https://api.example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      scope: 'read write'
    }
  },
  idToken: {
    name: 'ID Token (OIDC)',
    description: 'OpenID Connect ID token',
    header: { alg: 'RS256', typ: 'JWT' },
    payload: {
      iss: 'https://auth.example.com',
      sub: 'user_123',
      aud: 'client_app_id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      nonce: 'random_nonce_value',
      name: 'John Doe',
      email: 'john@example.com',
      email_verified: true
    }
  },
  refreshToken: {
    name: 'Refresh Token',
    description: 'Long-lived refresh token',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      iss: 'https://auth.example.com',
      sub: 'user_123',
      exp: Math.floor(Date.now() / 1000) + 604800,
      iat: Math.floor(Date.now() / 1000),
      jti: generateUUID(),
      token_type: 'refresh'
    }
  },
  auth0: {
    name: 'Auth0 Access Token',
    description: 'Auth0-style access token',
    header: { alg: 'RS256', typ: 'JWT' },
    payload: {
      iss: 'https://your-tenant.auth0.com/',
      sub: 'auth0|user_id',
      aud: ['https://api.example.com', 'https://your-tenant.auth0.com/userinfo'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
      azp: 'client_id',
      scope: 'openid profile email'
    }
  },
  cognito: {
    name: 'AWS Cognito Token',
    description: 'AWS Cognito User Pool token',
    header: { alg: 'RS256', typ: 'JWT', kid: 'key_id' },
    payload: {
      sub: 'uuid-user-id',
      iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxx',
      client_id: 'app_client_id',
      origin_jti: generateUUID(),
      event_id: generateUUID(),
      token_use: 'access',
      scope: 'aws.cognito.signin.user.admin',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      jti: generateUUID(),
      username: 'johndoe'
    }
  },
  firebase: {
    name: 'Firebase Auth Token',
    description: 'Firebase Authentication ID token',
    header: { alg: 'RS256', typ: 'JWT' },
    payload: {
      iss: 'https://securetoken.google.com/project-id',
      aud: 'project-id',
      auth_time: Math.floor(Date.now() / 1000),
      user_id: 'firebase_uid',
      sub: 'firebase_uid',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: 'user@example.com',
      email_verified: true,
      firebase: {
        identities: { email: ['user@example.com'] },
        sign_in_provider: 'password'
      }
    }
  },
  serviceAccount: {
    name: 'Service Account Token',
    description: 'Machine-to-machine auth token',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      iss: 'service-name',
      sub: 'service-name',
      aud: 'https://api.example.com',
      exp: Math.floor(Date.now() / 1000) + 300,
      iat: Math.floor(Date.now() / 1000),
      jti: generateUUID(),
      permissions: ['read:data', 'write:data']
    }
  }
}

// ==================== UI COMPONENTS ====================

// JSON Syntax Highlighter
function SyntaxHighlight({ json, editable = false, onChange }) {
  const formatted = JSON.stringify(json, null, 2)
  
  if (editable) {
    return (
      <textarea
        value={formatted}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value)
            onChange(parsed)
          } catch {}
        }}
        className="w-full h-48 font-mono text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] p-3 rounded-lg resize-none border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
        spellCheck={false}
      />
    )
  }
  
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

// Tab Navigation
const tabs = [
  { id: 'decoder', label: 'Decode', icon: Eye },
  { id: 'validator', label: 'Validate', icon: Shield },
  { id: 'builder', label: 'Build', icon: Wand2 },
  { id: 'debugger', label: 'Debug', icon: Settings },
  { id: 'comparator', label: 'Compare', icon: GitCompare },
  { id: 'converter', label: 'Convert', icon: Shuffle },
  { id: 'keys', label: 'Keys', icon: FileKey },
  { id: 'templates', label: 'Templates', icon: Layers },
  { id: 'clock', label: 'Clock', icon: Timer }
]

// Copy Button Component
function CopyButton({ text, label = 'Copy' }) {
  const { copyToClipboard } = useApp()
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <button onClick={handleCopy} className="glass-button text-xs py-1.5 px-2">
      {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {label}
    </button>
  )
}

// Validation Check Item
function ValidationCheck({ check }) {
  const icons = {
    pass: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    fail: <XCircle className="w-4 h-4 text-red-400" />,
    warn: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    skip: <Info className="w-4 h-4 text-[var(--text-tertiary)]" />
  }
  
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${
      check.status === 'pass' ? 'bg-emerald-500/10' :
      check.status === 'fail' ? 'bg-red-500/10' :
      check.status === 'warn' ? 'bg-amber-500/10' : 'bg-[var(--bg-tertiary)]'
    }`}>
      {icons[check.status]}
      <div className="flex-1">
        <span className="text-sm font-medium text-[var(--text-primary)]">{check.name}</span>
        <span className="text-xs text-[var(--text-tertiary)] ml-2">({check.claim})</span>
      </div>
      <span className="text-xs text-[var(--text-secondary)]">{check.message}</span>
    </div>
  )
}

// ==================== TAB COMPONENTS ====================

// Decoder Tab (Original functionality)
function DecoderTab() {
  const { devMode, copyToClipboard, showToast } = useApp()
  const [input, setInput] = useState('')
  const [decoded, setDecoded] = useState(null)
  const [error, setError] = useState(null)
  const [tokenStatus, setTokenStatus] = useState(null)

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

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Input Section */}
      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-[var(--text-primary)]">Paste your JWT</label>
          <button onClick={() => setInput('')} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Clear</button>
        </div>
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" 
          className="glass-input min-h-[100px] resize-y font-mono text-xs leading-relaxed w-full" 
        />
        
        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        {/* Token Status */}
        {tokenStatus && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
            tokenStatus.status === 'valid' ? 'bg-emerald-500/10 border border-emerald-500/20' :
            tokenStatus.status === 'expired' ? 'bg-red-500/10 border border-red-500/20' :
            tokenStatus.status === 'not-yet-valid' ? 'bg-amber-500/10 border border-amber-500/20' :
            'bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
          }`}>
            <tokenStatus.icon className={`w-5 h-5 flex-shrink-0 ${
              tokenStatus.status === 'valid' ? 'text-emerald-400' :
              tokenStatus.status === 'expired' ? 'text-red-400' :
              tokenStatus.status === 'not-yet-valid' ? 'text-amber-400' :
              'text-[var(--text-tertiary)]'
            }`} />
            <span className={`font-medium ${
              tokenStatus.status === 'valid' ? 'text-emerald-400' :
              tokenStatus.status === 'expired' ? 'text-red-400' :
              tokenStatus.status === 'not-yet-valid' ? 'text-amber-400' :
              'text-[var(--text-secondary)]'
            }`}>{tokenStatus.message}</span>
          </div>
        )}
      </div>

      {/* Decoded Sections */}
      {decoded && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          {/* Header & Payload - Stacked on mobile/tablet with sidebar, side-by-side on wide screens */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Header */}
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Header</h3>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-mono">{decoded.header.alg}</span>
                </div>
                <CopyButton text={JSON.stringify(decoded.header, null, 2)} label="" />
              </div>
              <pre className="p-3 sm:p-4 rounded-xl bg-[var(--bg-tertiary)] text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                <code className="text-blue-400">{JSON.stringify(decoded.header, null, 2)}</code>
              </pre>
              {decoded.header.alg === 'none' && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-400">Algorithm "none" - unsigned token (security vulnerability)</span>
                </div>
              )}
            </div>

            {/* Payload */}
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Payload</h3>
                </div>
                <CopyButton text={JSON.stringify(decoded.payload, null, 2)} label="" />
              </div>
              <pre className="p-3 sm:p-4 rounded-xl bg-[var(--bg-tertiary)] text-xs sm:text-sm font-mono overflow-x-auto max-h-[250px] overflow-y-auto whitespace-pre-wrap break-all">
                <code className="text-purple-400">{JSON.stringify(decoded.payload, null, 2)}</code>
              </pre>
            </div>
          </div>

          {/* Claims Details */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Claims Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Object.entries(decoded.payload).map(([key, value]) => {
                const claim = standardClaims[key]
                const isTimestamp = ['exp', 'nbf', 'iat'].includes(key) && typeof value === 'number'
                
                return (
                  <div key={key} className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-xs font-mono accent-text font-semibold">{key}</span>
                      {claim && <span className="text-xs text-[var(--text-tertiary)] truncate">{claim.name}</span>}
                    </div>
                    {isTimestamp ? (
                      <div className="space-y-0.5">
                        <div className="text-sm text-[var(--text-primary)] font-medium">
                          {new Date(value * 1000).toLocaleString()}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {getRelativeTime(value)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--text-primary)] break-all font-mono">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Signature */}
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Signature</h3>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs">{decoded.header.alg}</span>
            </div>
            <code className="block p-3 sm:p-4 rounded-xl bg-[var(--bg-tertiary)] text-xs font-mono break-all text-amber-400/80 leading-relaxed whitespace-pre-wrap">
              {decoded.parts.signature || '(empty - unsigned token)'}
            </code>
          </div>

          {/* Dev Mode: Raw Parts */}
          {devMode && (
            <div className="glass-card rounded-2xl p-4 sm:p-6 border-dashed border-2 border-orange-500/30">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-orange-400">Raw Parts (Dev Mode)</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Header (Base64URL)', value: decoded.parts.headerB64, color: 'text-blue-400' },
                  { label: 'Payload (Base64URL)', value: decoded.parts.payloadB64, color: 'text-purple-400' },
                  { label: 'Signature (Base64URL)', value: decoded.parts.signature, color: 'text-amber-400' }
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs text-[var(--text-tertiary)] mb-1">{label}</div>
                    <code className={`block p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs break-all ${color} leading-relaxed whitespace-pre-wrap`}>
                      {value || '(empty)'}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!decoded && !error && (
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
          <Key className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-[var(--text-primary)] mb-2">No JWT to decode</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Paste a JWT above to decode its header and payload
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mb-3">
            Try pasting a sample JWT like:
          </p>
          <code className="block text-xs text-[var(--accent)] bg-[var(--bg-tertiary)] p-3 rounded-lg break-all font-mono">
            eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
          </code>
        </div>
      )}
    </div>
  )
}

// Validator Tab
function ValidatorTab() {
  const { showToast, devMode } = useApp()
  const [input, setInput] = useState('')
  const [secret, setSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [decoded, setDecoded] = useState(null)
  const [signatureResult, setSignatureResult] = useState(null)
  const [claimsResult, setClaimsResult] = useState([])
  const [validationOptions, setValidationOptions] = useState({ clockTolerance: 0, expectedIssuer: '', expectedAudience: '' })
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setSignatureResult(null)
    setClaimsResult([])
    
    try {
      const parsed = parseJWT(input)
      setDecoded(parsed)
      
      // Validate claims
      const claims = validateClaims(parsed.payload, validationOptions)
      setClaimsResult(claims)
      
      // Verify signature if secret provided
      if (secret.trim()) {
        try {
          const result = await verifyJWT(input, secret)
          setSignatureResult(result)
        } catch (e) {
          setSignatureResult({ valid: false, message: e.message })
        }
      }
      
      showToast('Validation complete')
    } catch (e) {
      showToast('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">JWT Token</h3>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JWT to validate..." className="glass-input min-h-[80px] resize-y font-mono text-xs" />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Signature Verification</h3>
        <div className="relative">
          <input type={showSecret ? 'text' : 'password'} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret (HMAC) or Public Key (RSA/EC)" className="glass-input pr-10 font-mono text-xs" />
          <button onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-2">For HMAC: enter secret. For RSA/EC: paste public key in PEM format.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Claims Validation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Clock Tolerance (seconds)</label>
            <input type="number" value={validationOptions.clockTolerance} onChange={(e) => setValidationOptions(prev => ({ ...prev, clockTolerance: parseInt(e.target.value) || 0 }))} className="glass-input text-sm" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Expected Issuer (iss)</label>
            <input type="text" value={validationOptions.expectedIssuer} onChange={(e) => setValidationOptions(prev => ({ ...prev, expectedIssuer: e.target.value }))} placeholder="Optional" className="glass-input text-sm" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Expected Audience (aud)</label>
            <input type="text" value={validationOptions.expectedAudience} onChange={(e) => setValidationOptions(prev => ({ ...prev, expectedAudience: e.target.value }))} placeholder="Optional" className="glass-input text-sm" />
          </div>
        </div>
      </div>

      <button onClick={handleValidate} disabled={!input.trim() || loading} className="w-full glass-button-primary text-sm disabled:opacity-50">
        <Shield className="w-4 h-4" />{loading ? 'Validating...' : 'Validate Token'}
      </button>

      {signatureResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl ${signatureResult.valid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <div className={`flex items-center gap-2 ${signatureResult.valid ? 'text-emerald-400' : 'text-red-400'}`}>
            {signatureResult.valid ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="font-semibold">Signature: {signatureResult.message}</span>
          </div>
          {signatureResult.warning && <p className="text-xs text-amber-400 mt-2"><AlertTriangle className="w-3 h-3 inline mr-1" />This token uses algorithm "none" which is a security risk.</p>}
        </motion.div>
      )}

      {claimsResult.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Claims Validation Results</h3>
          <div className="space-y-2">
            {claimsResult.map((check, i) => <ValidationCheck key={i} check={check} />)}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Builder Tab
function BuilderTab() {
  const { showToast, copyToClipboard } = useApp()
  const [header, setHeader] = useState({ alg: 'HS256', typ: 'JWT' })
  const [payload, setPayload] = useState({ sub: '1234567890', name: 'John Doe', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })
  const [secret, setSecret] = useState('your-256-bit-secret')
  const [generatedJWT, setGeneratedJWT] = useState('')
  const [loading, setLoading] = useState(false)

  const generateToken = async () => {
    setLoading(true)
    try {
      const jwt = await signJWT(header, payload, secret, header.alg)
      setGeneratedJWT(jwt)
      showToast('JWT generated successfully!')
    } catch (e) {
      showToast('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const setNow = () => setPayload(p => ({ ...p, iat: Math.floor(Date.now() / 1000) }))
  const setExpiry = (hours) => setPayload(p => ({ ...p, exp: Math.floor(Date.now() / 1000) + hours * 3600 }))
  const generateJti = () => setPayload(p => ({ ...p, jti: generateUUID() }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Shield className="w-4 h-4 accent-text" />Header</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Algorithm</label>
              <select value={header.alg} onChange={(e) => setHeader(h => ({ ...h, alg: e.target.value }))} className="glass-input text-sm">
                <option value="HS256">HS256 (HMAC SHA-256)</option>
                <option value="HS384">HS384 (HMAC SHA-384)</option>
                <option value="HS512">HS512 (HMAC SHA-512)</option>
                <option value="RS256">RS256 (RSA SHA-256)</option>
                <option value="RS384">RS384 (RSA SHA-384)</option>
                <option value="RS512">RS512 (RSA SHA-512)</option>
                <option value="ES256">ES256 (ECDSA P-256)</option>
                <option value="ES384">ES384 (ECDSA P-384)</option>
                <option value="ES512">ES512 (ECDSA P-521)</option>
                <option value="none">none (Unsigned - INSECURE)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Type</label>
              <input type="text" value={header.typ} onChange={(e) => setHeader(h => ({ ...h, typ: e.target.value }))} className="glass-input text-sm" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Lock className="w-4 h-4 accent-text" />Signing Key</h3>
          <textarea value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={header.alg.startsWith('HS') ? 'Your secret key' : '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'} className="glass-input min-h-[100px] font-mono text-xs" />
          {header.alg === 'none' && <p className="text-xs text-red-400 mt-2"><AlertTriangle className="w-3 h-3 inline mr-1" />Warning: Creating unsigned token!</p>}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><FileJson className="w-4 h-4 accent-text" />Payload</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button onClick={setNow} className="glass-button text-xs py-2"><Clock className="w-3 h-3" />Set iat to now</button>
          <button onClick={() => setExpiry(1)} className="glass-button text-xs py-2">Expire in 1h</button>
          <button onClick={() => setExpiry(24)} className="glass-button text-xs py-2">Expire in 24h</button>
          <button onClick={generateJti} className="glass-button text-xs py-2">Generate jti</button>
        </div>
        <SyntaxHighlight json={payload} editable onChange={setPayload} />
      </div>

      <button onClick={generateToken} disabled={loading} className="w-full glass-button-primary text-sm disabled:opacity-50">
        <Wand2 className="w-4 h-4" />{loading ? 'Generating...' : 'Generate JWT'}
      </button>

      {generatedJWT && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Generated JWT</h3>
            <CopyButton text={generatedJWT} />
          </div>
          <code className="block p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs font-mono break-all text-emerald-400">{generatedJWT}</code>
        </motion.div>
      )}
    </div>
  )
}

// Debugger Tab (3-panel editor)
function DebuggerTab() {
  const { showToast, copyToClipboard } = useApp()
  const [encoded, setEncoded] = useState('')
  const [header, setHeader] = useState({})
  const [payload, setPayload] = useState({})
  const [secret, setSecret] = useState('')
  const [signatureValid, setSignatureValid] = useState(null)

  const syncFromEncoded = (jwt) => {
    setEncoded(jwt)
    try {
      const parsed = parseJWT(jwt)
      setHeader(parsed.header)
      setPayload(parsed.payload)
      setSignatureValid(null)
    } catch {}
  }

  const syncFromParts = () => {
    try {
      const jwt = createJWT(header, payload)
      setEncoded(jwt)
      setSignatureValid(null)
    } catch {}
  }

  const resign = async () => {
    if (!secret) return showToast('Enter signing key first')
    try {
      const jwt = await signJWT(header, payload, secret, header.alg || 'HS256')
      setEncoded(jwt)
      setSignatureValid(true)
      showToast('Token re-signed!')
    } catch (e) {
      showToast('Error: ' + e.message)
    }
  }

  const verify = async () => {
    if (!secret || !encoded) return
    try {
      const result = await verifyJWT(encoded, secret)
      setSignatureValid(result.valid)
      showToast(result.valid ? 'Signature valid!' : 'Signature invalid!')
    } catch (e) {
      setSignatureValid(false)
      showToast('Verification failed: ' + e.message)
    }
  }

  useEffect(() => {
    if (Object.keys(header).length && Object.keys(payload).length) {
      syncFromParts()
    }
  }, [header, payload])

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Encoded JWT</h3>
          <div className="flex items-center gap-2">
            {signatureValid !== null && (
              <span className={`text-xs px-2 py-1 rounded-full ${signatureValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {signatureValid ? '✓ Valid' : '✗ Invalid'}
              </span>
            )}
            <CopyButton text={encoded} />
          </div>
        </div>
        <textarea value={encoded} onChange={(e) => syncFromEncoded(e.target.value)} placeholder="Paste or type JWT here..." className="glass-input min-h-[80px] font-mono text-xs text-cyan-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">Header</h3>
          <SyntaxHighlight json={header} editable onChange={(h) => { setHeader(h); setSignatureValid(null) }} />
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-purple-400 mb-3">Payload</h3>
          <SyntaxHighlight json={payload} editable onChange={(p) => { setPayload(p); setSignatureValid(null) }} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Signing Key</h3>
        <div className="flex gap-2">
          <input type="text" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret or private key..." className="glass-input flex-1 font-mono text-xs" />
          <button onClick={verify} className="glass-button text-xs"><Shield className="w-3 h-3" />Verify</button>
          <button onClick={resign} className="glass-button-primary text-xs"><RefreshCw className="w-3 h-3" />Re-sign</button>
        </div>
      </div>
    </div>
  )
}

// Comparator Tab
function ComparatorTab() {
  const { showToast } = useApp()
  const [tokenA, setTokenA] = useState('')
  const [tokenB, setTokenB] = useState('')
  const [comparison, setComparison] = useState(null)

  const compare = () => {
    try {
      const a = parseJWT(tokenA)
      const b = parseJWT(tokenB)
      
      const diffs = []
      
      // Compare headers
      const allHeaderKeys = new Set([...Object.keys(a.header), ...Object.keys(b.header)])
      allHeaderKeys.forEach(key => {
        if (JSON.stringify(a.header[key]) !== JSON.stringify(b.header[key])) {
          diffs.push({ section: 'Header', field: key, valueA: a.header[key], valueB: b.header[key] })
        }
      })
      
      // Compare payloads
      const allPayloadKeys = new Set([...Object.keys(a.payload), ...Object.keys(b.payload)])
      allPayloadKeys.forEach(key => {
        if (JSON.stringify(a.payload[key]) !== JSON.stringify(b.payload[key])) {
          diffs.push({ section: 'Payload', field: key, valueA: a.payload[key], valueB: b.payload[key] })
        }
      })
      
      // Compare signatures
      if (a.signature !== b.signature) {
        diffs.push({ section: 'Signature', field: 'signature', valueA: a.signature.substring(0, 20) + '...', valueB: b.signature.substring(0, 20) + '...' })
      }
      
      setComparison({ a, b, diffs })
      showToast(diffs.length === 0 ? 'Tokens are identical!' : `Found ${diffs.length} difference(s)`)
    } catch (e) {
      showToast('Error: ' + e.message)
    }
  }

  const swap = () => { setTokenA(tokenB); setTokenB(tokenA); setComparison(null) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">Token A</h3>
          <textarea value={tokenA} onChange={(e) => { setTokenA(e.target.value); setComparison(null) }} placeholder="Paste first JWT..." className="glass-input min-h-[100px] font-mono text-xs" />
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-purple-400 mb-3">Token B</h3>
          <textarea value={tokenB} onChange={(e) => { setTokenB(e.target.value); setComparison(null) }} placeholder="Paste second JWT..." className="glass-input min-h-[100px] font-mono text-xs" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={compare} disabled={!tokenA || !tokenB} className="flex-1 glass-button-primary text-sm disabled:opacity-50"><GitCompare className="w-4 h-4" />Compare Tokens</button>
        <button onClick={swap} className="glass-button text-sm"><Shuffle className="w-4 h-4" />Swap</button>
      </div>

      {comparison && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className={`p-4 rounded-xl ${comparison.diffs.length === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            {comparison.diffs.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400"><CheckCircle className="w-5 h-5" />Tokens are identical!</div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400"><AlertTriangle className="w-5 h-5" />{comparison.diffs.length} difference(s) found</div>
            )}
          </div>

          {comparison.diffs.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Differences</h3>
              <table className="w-full text-xs">
                <thead><tr className="text-left text-[var(--text-tertiary)]"><th className="pb-2">Section</th><th className="pb-2">Field</th><th className="pb-2 text-blue-400">Token A</th><th className="pb-2 text-purple-400">Token B</th></tr></thead>
                <tbody>
                  {comparison.diffs.map((diff, i) => (
                    <tr key={i} className="border-t border-[var(--border-color)]">
                      <td className="py-2 text-[var(--text-secondary)]">{diff.section}</td>
                      <td className="py-2 font-mono accent-text">{diff.field}</td>
                      <td className="py-2 font-mono text-[var(--text-primary)] break-all">{JSON.stringify(diff.valueA) ?? '(missing)'}</td>
                      <td className="py-2 font-mono text-[var(--text-primary)] break-all">{JSON.stringify(diff.valueB) ?? '(missing)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Converter Tab
function ConverterTab() {
  const { showToast, copyToClipboard } = useApp()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [format, setFormat] = useState('compact-to-json')

  const convert = () => {
    try {
      if (format === 'compact-to-json') {
        const parsed = parseJWT(input)
        setOutput(JSON.stringify({ header: parsed.header, payload: parsed.payload, signature: parsed.signature }, null, 2))
      } else if (format === 'json-to-compact') {
        const data = JSON.parse(input)
        setOutput(createJWT(data.header, data.payload, data.signature || ''))
      } else if (format === 'extract-header') {
        const parsed = parseJWT(input)
        setOutput(JSON.stringify(parsed.header, null, 2))
      } else if (format === 'extract-payload') {
        const parsed = parseJWT(input)
        setOutput(JSON.stringify(parsed.payload, null, 2))
      } else if (format === 'extract-signature') {
        const parsed = parseJWT(input)
        setOutput(`Base64URL: ${parsed.signature}\n\nHex: ${Array.from(base64UrlDecode(parsed.signature)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')}`)
      }
      showToast('Conversion complete')
    } catch (e) {
      showToast('Error: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Conversion Type</h3>
        <select value={format} onChange={(e) => setFormat(e.target.value)} className="glass-input text-sm">
          <option value="compact-to-json">Compact → JSON (expand JWT)</option>
          <option value="json-to-compact">JSON → Compact (create JWT)</option>
          <option value="extract-header">Extract Header</option>
          <option value="extract-payload">Extract Payload</option>
          <option value="extract-signature">Extract Signature</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Input</h3>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste input here..." className="glass-input min-h-[150px] font-mono text-xs" />
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Output</h3>
            <CopyButton text={output} />
          </div>
          <pre className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs font-mono min-h-[150px] overflow-auto text-[var(--text-secondary)] whitespace-pre-wrap">{output || 'Output will appear here...'}</pre>
        </div>
      </div>

      <button onClick={convert} disabled={!input} className="w-full glass-button-primary text-sm disabled:opacity-50"><Shuffle className="w-4 h-4" />Convert</button>
    </div>
  )
}

// Key Tools Tab
function KeyToolsTab() {
  const { showToast, copyToClipboard } = useApp()
  const [keyType, setKeyType] = useState('hmac')
  const [keySize, setKeySize] = useState(256)
  const [generatedKey, setGeneratedKey] = useState('')
  const [generatedPublicKey, setGeneratedPublicKey] = useState('')
  const [loading, setLoading] = useState(false)

  const generateKey = async () => {
    setLoading(true)
    setGeneratedKey('')
    setGeneratedPublicKey('')
    
    try {
      if (keyType === 'hmac') {
        const bytes = new Uint8Array(keySize / 8)
        crypto.getRandomValues(bytes)
        const base64 = btoa(String.fromCharCode(...bytes))
        setGeneratedKey(`Raw (Base64): ${base64}\n\nHex: ${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
      } else if (keyType === 'rsa') {
        const keyPair = await crypto.subtle.generateKey(
          { name: 'RSASSA-PKCS1-v1_5', modulusLength: keySize, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
          true,
          ['sign', 'verify']
        )
        const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
        const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)
        setGeneratedKey(`-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(privateKey))).match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`)
        setGeneratedPublicKey(`-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(publicKey))).match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`)
      } else if (keyType === 'ec') {
        const curves = { 256: 'P-256', 384: 'P-384', 521: 'P-521' }
        const keyPair = await crypto.subtle.generateKey(
          { name: 'ECDSA', namedCurve: curves[keySize] },
          true,
          ['sign', 'verify']
        )
        const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
        const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)
        setGeneratedKey(`-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(privateKey))).match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`)
        setGeneratedPublicKey(`-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(publicKey))).match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`)
      }
      showToast('Key generated!')
    } catch (e) {
      showToast('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Key Generation</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Key Type</label>
            <select value={keyType} onChange={(e) => { setKeyType(e.target.value); setGeneratedKey(''); setGeneratedPublicKey('') }} className="glass-input text-sm">
              <option value="hmac">HMAC Secret</option>
              <option value="rsa">RSA Key Pair</option>
              <option value="ec">ECDSA Key Pair</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Key Size</label>
            <select value={keySize} onChange={(e) => setKeySize(parseInt(e.target.value))} className="glass-input text-sm">
              {keyType === 'hmac' && <><option value="256">256 bits (HS256)</option><option value="384">384 bits (HS384)</option><option value="512">512 bits (HS512)</option></>}
              {keyType === 'rsa' && <><option value="2048">2048 bits</option><option value="3072">3072 bits</option><option value="4096">4096 bits</option></>}
              {keyType === 'ec' && <><option value="256">P-256 (ES256)</option><option value="384">P-384 (ES384)</option><option value="521">P-521 (ES512)</option></>}
            </select>
          </div>
        </div>
        <button onClick={generateKey} disabled={loading} className="w-full glass-button-primary text-sm disabled:opacity-50"><Zap className="w-4 h-4" />{loading ? 'Generating...' : 'Generate Key'}</button>
      </div>

      {generatedKey && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{keyType === 'hmac' ? 'Secret Key' : 'Private Key'}</h3>
            <CopyButton text={generatedKey} />
          </div>
          <pre className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs font-mono overflow-auto text-emerald-400 whitespace-pre-wrap">{generatedKey}</pre>
        </motion.div>
      )}

      {generatedPublicKey && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Public Key</h3>
            <CopyButton text={generatedPublicKey} />
          </div>
          <pre className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs font-mono overflow-auto text-blue-400 whitespace-pre-wrap">{generatedPublicKey}</pre>
        </motion.div>
      )}
    </div>
  )
}

// Templates Tab
function TemplatesTab() {
  const { showToast, copyToClipboard } = useApp()
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const applyTemplate = (key) => {
    setSelectedTemplate(jwtTemplates[key])
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">JWT Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(jwtTemplates).map(([key, template]) => (
            <button key={key} onClick={() => applyTemplate(key)} className={`p-4 rounded-xl text-left transition-all ${selectedTemplate === template ? 'bg-[var(--accent)]/20 border-[var(--accent)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80'} border border-[var(--border-color)]`}>
              <div className="font-medium text-sm text-[var(--text-primary)]">{template.name}</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedTemplate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-400">Header</h3>
              <CopyButton text={JSON.stringify(selectedTemplate.header, null, 2)} />
            </div>
            <SyntaxHighlight json={selectedTemplate.header} />
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-400">Payload</h3>
              <CopyButton text={JSON.stringify(selectedTemplate.payload, null, 2)} />
            </div>
            <SyntaxHighlight json={selectedTemplate.payload} />
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Unsigned JWT (Preview)</h3>
              <CopyButton text={createJWT(selectedTemplate.header, selectedTemplate.payload)} />
            </div>
            <code className="block p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs font-mono break-all text-[var(--text-secondary)]">
              {createJWT(selectedTemplate.header, selectedTemplate.payload)}
            </code>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Clock Skew Tab
function ClockSkewTab() {
  const { showToast } = useApp()
  const [input, setInput] = useState('')
  const [decoded, setDecoded] = useState(null)
  const [simulatedTime, setSimulatedTime] = useState(Math.floor(Date.now() / 1000))
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(60) // seconds per tick

  useEffect(() => {
    if (!input.trim()) { setDecoded(null); return }
    try { setDecoded(parseJWT(input)) } catch { setDecoded(null) }
  }, [input])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setSimulatedTime(t => t + playSpeed)
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying, playSpeed])

  const status = decoded ? getTokenStatus(decoded.payload, simulatedTime) : null
  const claims = decoded ? validateClaims(decoded.payload, {}, simulatedTime) : []

  const timeline = decoded?.payload ? (() => {
    const points = []
    if (decoded.payload.iat) points.push({ time: decoded.payload.iat, label: 'Issued (iat)', color: 'blue' })
    if (decoded.payload.nbf) points.push({ time: decoded.payload.nbf, label: 'Valid From (nbf)', color: 'amber' })
    if (decoded.payload.exp) points.push({ time: decoded.payload.exp, label: 'Expires (exp)', color: 'red' })
    points.push({ time: simulatedTime, label: 'Current Time', color: 'emerald', isCurrent: true })
    return points.sort((a, b) => a.time - b.time)
  })() : []

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">JWT Token</h3>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JWT to test..." className="glass-input min-h-[80px] font-mono text-xs" />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Timer className="w-4 h-4 accent-text" />Time Simulation</h3>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setIsPlaying(!isPlaying)} className={`glass-button text-sm ${isPlaying ? 'text-amber-400' : ''}`}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{isPlaying ? 'Pause' : 'Play'}
          </button>
          <select value={playSpeed} onChange={(e) => setPlaySpeed(parseInt(e.target.value))} className="glass-input text-xs w-32">
            <option value="1">1 sec/tick</option>
            <option value="60">1 min/tick</option>
            <option value="3600">1 hour/tick</option>
            <option value="86400">1 day/tick</option>
          </select>
          <button onClick={() => setSimulatedTime(Math.floor(Date.now() / 1000))} className="glass-button text-xs">Reset to Now</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[-86400, -3600, -60, 60, 3600, 86400].map(offset => (
            <button key={offset} onClick={() => setSimulatedTime(t => t + offset)} className="glass-button text-xs py-2">
              {offset > 0 ? '+' : ''}{offset >= 86400 || offset <= -86400 ? `${offset / 86400}d` : offset >= 3600 || offset <= -3600 ? `${offset / 3600}h` : `${offset / 60}m`}
            </button>
          ))}
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
          <div className="text-xs text-[var(--text-tertiary)] mb-1">Simulated Time</div>
          <div className="text-lg font-mono text-[var(--text-primary)]">{new Date(simulatedTime * 1000).toLocaleString()}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">Unix: {simulatedTime}</div>
        </div>
      </div>

      {decoded && status && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className={`p-4 rounded-xl ${status.status === 'valid' ? 'bg-emerald-500/10 border border-emerald-500/20' : status.status === 'expired' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            <div className={`flex items-center gap-2 ${status.status === 'valid' ? 'text-emerald-400' : status.status === 'expired' ? 'text-red-400' : 'text-amber-400'}`}>
              <status.icon className="w-5 h-5" /><span className="font-semibold">{status.message}</span>
            </div>
          </div>

          {timeline.length > 1 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Token Timeline</h3>
              <div className="relative">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[var(--border-color)]" />
                {timeline.map((point, i) => (
                  <div key={i} className={`relative pl-8 pb-4 ${point.isCurrent ? 'text-emerald-400' : `text-${point.color}-400`}`}>
                    <div className={`absolute left-0 w-4 h-4 rounded-full ${point.isCurrent ? 'bg-emerald-500' : point.color === 'blue' ? 'bg-blue-500' : point.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <div className="text-sm font-medium">{point.label}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{new Date(point.time * 1000).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {claims.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Claims at Simulated Time</h3>
              <div className="space-y-2">{claims.map((check, i) => <ValidationCheck key={i} check={check} />)}</div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ==================== MAIN COMPONENT ====================

export default function JWTDecoder() {
  const [activeTab, setActiveTab] = useState('decoder')

  const renderTab = () => {
    switch (activeTab) {
      case 'decoder': return <DecoderTab />
      case 'validator': return <ValidatorTab />
      case 'builder': return <BuilderTab />
      case 'debugger': return <DebuggerTab />
      case 'comparator': return <ComparatorTab />
      case 'converter': return <ConverterTab />
      case 'keys': return <KeyToolsTab />
      case 'templates': return <TemplatesTab />
      case 'clock': return <ClockSkewTab />
      default: return <DecoderTab />
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500 flex-shrink-0">
          <Key className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">JWT Toolkit</h1>
          <p className="text-sm text-[var(--text-secondary)]">Complete JWT decoder, validator, builder & debugging tools</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="inline-flex glass-card rounded-2xl p-2">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-[var(--accent)] text-white' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
