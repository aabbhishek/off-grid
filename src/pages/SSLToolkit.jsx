import { useState, useRef, useCallback, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, FileText, Link2, FilePlus, KeyRound, RefreshCw, GitCompare,
  Upload, Copy, Check, AlertTriangle, Shield, ShieldCheck, ShieldX,
  ChevronRight, ChevronDown, Download, X, Eye, EyeOff, Info,
  Calendar, Clock, Globe, Building, User, Mail, Server, Fingerprint,
  AlertCircle, CheckCircle, XCircle, FileKey, ArrowRight
} from 'lucide-react'
import { useApp } from '../App'

// ==================== UTILITY FUNCTIONS ====================

// Parse PEM format
const parsePEM = (pem) => {
  const pemRegex = /-----BEGIN ([^-]+)-----([^-]+)-----END ([^-]+)-----/g
  const matches = []
  let match
  while ((match = pemRegex.exec(pem)) !== null) {
    const type = match[1].trim()
    const base64 = match[2].replace(/\s/g, '')
    try {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      matches.push({ type, bytes, base64 })
    } catch (e) {
      console.error('Failed to decode base64:', e)
    }
  }
  return matches
}

// Convert bytes to hex string
const bytesToHex = (bytes, separator = '') => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(separator)
}

// Parse ASN.1 DER
const parseASN1 = (bytes, offset = 0, depth = 0) => {
  if (offset >= bytes.length) return null
  
  const tag = bytes[offset]
  let length = bytes[offset + 1]
  let headerLength = 2
  
  if (length & 0x80) {
    const numBytes = length & 0x7f
    length = 0
    for (let i = 0; i < numBytes; i++) {
      length = (length << 8) | bytes[offset + 2 + i]
    }
    headerLength = 2 + numBytes
  }
  
  const value = bytes.slice(offset + headerLength, offset + headerLength + length)
  const isConstructed = (tag & 0x20) !== 0
  
  const tagNames = {
    0x01: 'BOOLEAN',
    0x02: 'INTEGER',
    0x03: 'BIT STRING',
    0x04: 'OCTET STRING',
    0x05: 'NULL',
    0x06: 'OBJECT IDENTIFIER',
    0x0c: 'UTF8String',
    0x13: 'PrintableString',
    0x14: 'T61String',
    0x16: 'IA5String',
    0x17: 'UTCTime',
    0x18: 'GeneralizedTime',
    0x30: 'SEQUENCE',
    0x31: 'SET',
    0xa0: '[0]',
    0xa1: '[1]',
    0xa2: '[2]',
    0xa3: '[3]',
  }
  
  const result = {
    tag,
    tagName: tagNames[tag] || `[${tag.toString(16)}]`,
    length,
    headerLength,
    totalLength: headerLength + length,
    offset,
    depth,
    value,
    isConstructed
  }
  
  if (isConstructed || tag >= 0xa0) {
    result.children = []
    let childOffset = 0
    while (childOffset < value.length) {
      const child = parseASN1(value, childOffset, depth + 1)
      if (!child) break
      result.children.push(child)
      childOffset += child.totalLength
    }
  }
  
  return result
}

// Parse OID
const parseOID = (bytes) => {
  const oid = []
  oid.push(Math.floor(bytes[0] / 40))
  oid.push(bytes[0] % 40)
  
  let value = 0
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i] & 0x7f)
    if (!(bytes[i] & 0x80)) {
      oid.push(value)
      value = 0
    }
  }
  return oid.join('.')
}

// OID name lookup
const oidNames = {
  '2.5.4.3': 'commonName',
  '2.5.4.6': 'countryName',
  '2.5.4.7': 'localityName',
  '2.5.4.8': 'stateOrProvinceName',
  '2.5.4.10': 'organizationName',
  '2.5.4.11': 'organizationalUnitName',
  '2.5.4.5': 'serialNumber',
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.10045.2.1': 'ecPublicKey',
  '1.2.840.10045.3.1.7': 'secp256r1',
  '1.3.132.0.34': 'secp384r1',
  '1.3.132.0.35': 'secp521r1',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '2.5.29.14': 'subjectKeyIdentifier',
  '2.5.29.15': 'keyUsage',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.31': 'cRLDistributionPoints',
  '2.5.29.32': 'certificatePolicies',
  '2.5.29.35': 'authorityKeyIdentifier',
  '2.5.29.37': 'extKeyUsage',
  '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess',
  '1.3.6.1.5.5.7.3.1': 'serverAuth',
  '1.3.6.1.5.5.7.3.2': 'clientAuth',
  '1.3.6.1.5.5.7.3.3': 'codeSigning',
  '1.3.6.1.5.5.7.3.4': 'emailProtection',
  '1.3.6.1.5.5.7.48.1': 'OCSP',
  '1.3.6.1.5.5.7.48.2': 'caIssuers',
}

// Parse X.509 certificate
const parseCertificate = async (bytes) => {
  try {
    const asn1 = parseASN1(bytes)
    if (!asn1 || asn1.tagName !== 'SEQUENCE') {
      throw new Error('Invalid certificate structure')
    }
    
    const tbsCert = asn1.children[0]
    const signatureAlg = asn1.children[1]
    const signature = asn1.children[2]
    
    // Version (optional, default v1)
    let version = 1
    let idx = 0
    if (tbsCert.children[0].tag === 0xa0) {
      version = tbsCert.children[0].children[0].value[0] + 1
      idx = 1
    }
    
    // Serial number
    const serialBytes = tbsCert.children[idx].value
    const serial = bytesToHex(serialBytes, ':').toUpperCase()
    
    // Signature algorithm
    const sigAlgOID = parseOID(tbsCert.children[idx + 1].children[0].value)
    const sigAlgName = oidNames[sigAlgOID] || sigAlgOID
    
    // Issuer
    const issuer = parseDistinguishedName(tbsCert.children[idx + 2])
    
    // Validity
    const validity = tbsCert.children[idx + 3]
    const notBefore = parseTime(validity.children[0])
    const notAfter = parseTime(validity.children[1])
    
    // Subject
    const subject = parseDistinguishedName(tbsCert.children[idx + 4])
    
    // Subject Public Key Info
    const spki = tbsCert.children[idx + 5]
    const pubKeyAlgOID = parseOID(spki.children[0].children[0].value)
    const pubKeyAlgName = oidNames[pubKeyAlgOID] || pubKeyAlgOID
    
    let keyInfo = { algorithm: pubKeyAlgName }
    if (pubKeyAlgName === 'rsaEncryption') {
      const pubKeyData = parseASN1(spki.children[1].value.slice(1))
      if (pubKeyData && pubKeyData.children) {
        const modulus = pubKeyData.children[0].value
        keyInfo.keySize = (modulus.length - (modulus[0] === 0 ? 1 : 0)) * 8
      }
    } else if (pubKeyAlgName === 'ecPublicKey') {
      if (spki.children[0].children.length > 1) {
        const curveOID = parseOID(spki.children[0].children[1].value)
        keyInfo.curve = oidNames[curveOID] || curveOID
        const curveSize = {
          'secp256r1': 256,
          'secp384r1': 384,
          'secp521r1': 521
        }
        keyInfo.keySize = curveSize[keyInfo.curve] || 0
      }
    }
    
    // Extensions (v3)
    let extensions = []
    let san = []
    let keyUsage = []
    let extKeyUsage = []
    let basicConstraints = null
    
    if (version === 3 && tbsCert.children.length > idx + 6) {
      const extContainer = tbsCert.children[idx + 6]
      if (extContainer.tag === 0xa3 && extContainer.children) {
        const extSeq = extContainer.children[0]
        for (const ext of extSeq.children || []) {
          const extOID = parseOID(ext.children[0].value)
          const extName = oidNames[extOID] || extOID
          const critical = ext.children.length > 2 && ext.children[1].tagName === 'BOOLEAN'
          const extValue = critical ? ext.children[2].value : ext.children[1].value
          
          const extension = { oid: extOID, name: extName, critical }
          
          if (extName === 'subjectAltName') {
            const sanAsn = parseASN1(extValue)
            if (sanAsn && sanAsn.children) {
              for (const child of sanAsn.children) {
                if (child.tag === 0x82) { // DNS
                  san.push({ type: 'DNS', value: String.fromCharCode(...child.value) })
                } else if (child.tag === 0x87) { // IP
                  if (child.value.length === 4) {
                    san.push({ type: 'IP', value: child.value.join('.') })
                  } else if (child.value.length === 16) {
                    const parts = []
                    for (let i = 0; i < 16; i += 2) {
                      parts.push(((child.value[i] << 8) | child.value[i + 1]).toString(16))
                    }
                    san.push({ type: 'IP', value: parts.join(':') })
                  }
                } else if (child.tag === 0x81) { // Email
                  san.push({ type: 'Email', value: String.fromCharCode(...child.value) })
                }
              }
            }
          } else if (extName === 'keyUsage') {
            const kuAsn = parseASN1(extValue)
            if (kuAsn && kuAsn.tagName === 'BIT STRING' && kuAsn.value.length > 1) {
              const bits = kuAsn.value[1]
              const usages = [
                'Digital Signature', 'Non Repudiation', 'Key Encipherment',
                'Data Encipherment', 'Key Agreement', 'Certificate Sign',
                'CRL Sign', 'Encipher Only', 'Decipher Only'
              ]
              for (let i = 0; i < 8; i++) {
                if (bits & (0x80 >> i)) keyUsage.push(usages[i])
              }
            }
          } else if (extName === 'extKeyUsage') {
            const ekuAsn = parseASN1(extValue)
            if (ekuAsn && ekuAsn.children) {
              for (const child of ekuAsn.children) {
                const ekuOID = parseOID(child.value)
                extKeyUsage.push(oidNames[ekuOID] || ekuOID)
              }
            }
          } else if (extName === 'basicConstraints') {
            const bcAsn = parseASN1(extValue)
            basicConstraints = { isCA: false, pathLength: null }
            if (bcAsn && bcAsn.children) {
              for (const child of bcAsn.children) {
                if (child.tagName === 'BOOLEAN') {
                  basicConstraints.isCA = child.value[0] !== 0
                } else if (child.tagName === 'INTEGER') {
                  basicConstraints.pathLength = child.value[0]
                }
              }
            }
          }
          
          extensions.push(extension)
        }
      }
    }
    
    // Calculate fingerprints
    const sha256Fingerprint = await calculateSHA256(bytes)
    const sha1Fingerprint = await calculateSHA1(bytes)
    
    return {
      version,
      serial,
      signatureAlgorithm: sigAlgName,
      issuer,
      subject,
      validity: {
        notBefore,
        notAfter,
        daysRemaining: Math.floor((notAfter - Date.now()) / (1000 * 60 * 60 * 24)),
        isExpired: notAfter < Date.now(),
        isNotYetValid: notBefore > Date.now()
      },
      publicKey: keyInfo,
      extensions,
      san,
      keyUsage,
      extKeyUsage,
      basicConstraints,
      fingerprints: {
        sha256: sha256Fingerprint,
        sha1: sha1Fingerprint
      },
      raw: bytes
    }
  } catch (e) {
    console.error('Certificate parsing error:', e)
    throw new Error('Failed to parse certificate: ' + e.message)
  }
}

// Parse Distinguished Name
const parseDistinguishedName = (dn) => {
  const result = {}
  if (!dn || !dn.children) return result
  
  for (const rdn of dn.children) {
    if (rdn.children && rdn.children[0] && rdn.children[0].children) {
      const attr = rdn.children[0]
      const oid = parseOID(attr.children[0].value)
      const name = oidNames[oid] || oid
      const value = String.fromCharCode(...attr.children[1].value)
      result[name] = value
    }
  }
  return result
}

// Parse time
const parseTime = (node) => {
  const str = String.fromCharCode(...node.value)
  if (node.tagName === 'UTCTime') {
    // YYMMDDHHmmssZ
    let year = parseInt(str.substring(0, 2))
    year += year < 50 ? 2000 : 1900
    const month = parseInt(str.substring(2, 4)) - 1
    const day = parseInt(str.substring(4, 6))
    const hour = parseInt(str.substring(6, 8))
    const min = parseInt(str.substring(8, 10))
    const sec = parseInt(str.substring(10, 12))
    return new Date(Date.UTC(year, month, day, hour, min, sec))
  } else {
    // GeneralizedTime: YYYYMMDDHHmmssZ
    const year = parseInt(str.substring(0, 4))
    const month = parseInt(str.substring(4, 6)) - 1
    const day = parseInt(str.substring(6, 8))
    const hour = parseInt(str.substring(8, 10))
    const min = parseInt(str.substring(10, 12))
    const sec = parseInt(str.substring(12, 14))
    return new Date(Date.UTC(year, month, day, hour, min, sec))
  }
}

// Calculate SHA-256 fingerprint
const calculateSHA256 = async (bytes) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  return bytesToHex(new Uint8Array(hashBuffer), ':').toUpperCase()
}

// Calculate SHA-1 fingerprint
const calculateSHA1 = async (bytes) => {
  const hashBuffer = await crypto.subtle.digest('SHA-1', bytes)
  return bytesToHex(new Uint8Array(hashBuffer), ':').toUpperCase()
}

// Parse CSR
const parseCSR = (bytes) => {
  try {
    const asn1 = parseASN1(bytes)
    if (!asn1 || asn1.tagName !== 'SEQUENCE') {
      throw new Error('Invalid CSR structure')
    }
    
    const certReqInfo = asn1.children[0]
    const signatureAlg = asn1.children[1]
    const signature = asn1.children[2]
    
    // Version
    const version = certReqInfo.children[0].value[0] + 1
    
    // Subject
    const subject = parseDistinguishedName(certReqInfo.children[1])
    
    // Subject Public Key Info
    const spki = certReqInfo.children[2]
    const pubKeyAlgOID = parseOID(spki.children[0].children[0].value)
    const pubKeyAlgName = oidNames[pubKeyAlgOID] || pubKeyAlgOID
    
    let keyInfo = { algorithm: pubKeyAlgName }
    if (pubKeyAlgName === 'rsaEncryption') {
      const pubKeyData = parseASN1(spki.children[1].value.slice(1))
      if (pubKeyData && pubKeyData.children) {
        const modulus = pubKeyData.children[0].value
        keyInfo.keySize = (modulus.length - (modulus[0] === 0 ? 1 : 0)) * 8
      }
    } else if (pubKeyAlgName === 'ecPublicKey') {
      if (spki.children[0].children.length > 1) {
        const curveOID = parseOID(spki.children[0].children[1].value)
        keyInfo.curve = oidNames[curveOID] || curveOID
      }
    }
    
    // Signature algorithm
    const sigAlgOID = parseOID(signatureAlg.children[0].value)
    const sigAlgName = oidNames[sigAlgOID] || sigAlgOID
    
    // Requested extensions
    let requestedSAN = []
    if (certReqInfo.children.length > 3) {
      const attrs = certReqInfo.children[3]
      if (attrs.tag === 0xa0 && attrs.children) {
        for (const attr of attrs.children) {
          const attrOID = parseOID(attr.children[0].value)
          if (attrOID === '1.2.840.113549.1.9.14') { // extensionRequest
            const extSeq = attr.children[1].children[0]
            for (const ext of extSeq.children || []) {
              const extOID = parseOID(ext.children[0].value)
              if (oidNames[extOID] === 'subjectAltName') {
                const sanValue = ext.children[1].value
                const sanAsn = parseASN1(sanValue)
                if (sanAsn && sanAsn.children) {
                  for (const child of sanAsn.children) {
                    if (child.tag === 0x82) {
                      requestedSAN.push({ type: 'DNS', value: String.fromCharCode(...child.value) })
                    } else if (child.tag === 0x87) {
                      if (child.value.length === 4) {
                        requestedSAN.push({ type: 'IP', value: child.value.join('.') })
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return {
      version,
      subject,
      publicKey: keyInfo,
      signatureAlgorithm: sigAlgName,
      requestedSAN,
      raw: bytes
    }
  } catch (e) {
    console.error('CSR parsing error:', e)
    throw new Error('Failed to parse CSR: ' + e.message)
  }
}

// ==================== SHARED COMPONENTS ====================

const CopyButton = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)] hover:text-[var(--accent)]"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

const FileDropZone = ({ onFile, accept, children }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        isDragging 
          ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
          : 'border-[var(--border-color)] hover:border-[var(--accent)]/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        className="hidden"
      />
      {children}
    </div>
  )
}

const InfoBadge = ({ type, children }) => {
  const colors = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  
  const icons = {
    success: <CheckCircle className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
  }
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors[type]}`}>
      {icons[type]}
      <span className="text-sm">{children}</span>
    </div>
  )
}

const DetailRow = ({ label, value, mono = false }) => (
  <div className="flex items-start gap-4 py-2 border-b border-[var(--border-color)] last:border-0">
    <span className="text-[var(--text-secondary)] text-sm min-w-[140px]">{label}</span>
    <span className={`text-[var(--text-primary)] text-sm flex-1 ${mono ? 'font-mono text-xs' : ''}`}>
      {value || '-'}
    </span>
  </div>
)

// ==================== SUB-TOOL COMPONENTS ====================

// Certificate Decoder
const CertificateDecoder = () => {
  const { devMode } = useApp()
  const [input, setInput] = useState('')
  const [cert, setCert] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const handleParse = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    setError(null)
    setCert(null)
    
    try {
      const pems = parsePEM(input)
      if (pems.length === 0) {
        // Try as DER
        throw new Error('No valid PEM certificate found. Please paste a certificate starting with "-----BEGIN CERTIFICATE-----"')
      }
      
      const certPem = pems.find(p => p.type === 'CERTIFICATE')
      if (!certPem) {
        throw new Error('No certificate found in input')
      }
      
      const parsed = await parseCertificate(certPem.bytes)
      setCert(parsed)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleFile = async (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target.result
      if (typeof content === 'string') {
        setInput(content)
      } else {
        // Binary DER file
        const bytes = new Uint8Array(content)
        // Convert to PEM
        const base64 = btoa(String.fromCharCode(...bytes))
        const pem = `-----BEGIN CERTIFICATE-----\n${base64.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`
        setInput(pem)
      }
    }
    
    if (file.name.endsWith('.der') || file.name.endsWith('.cer')) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }
  
  const getValidityStatus = () => {
    if (!cert) return null
    const days = cert.validity.daysRemaining
    if (cert.validity.isExpired) return { type: 'error', text: 'Expired', icon: XCircle }
    if (cert.validity.isNotYetValid) return { type: 'warning', text: 'Not yet valid', icon: AlertTriangle }
    if (days <= 30) return { type: 'warning', text: `Expires in ${days} days`, icon: AlertTriangle }
    return { type: 'success', text: `Valid (${days} days remaining)`, icon: CheckCircle }
  }
  
  const status = getValidityStatus()
  
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 accent-text" />
          Certificate Decoder
        </h2>
        
        <FileDropZone onFile={handleFile} accept=".pem,.crt,.cer,.der">
          <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)] text-sm">
            Drop certificate file or click to browse
          </p>
          <p className="text-[var(--text-tertiary)] text-xs mt-1">
            Supports .pem, .crt, .cer, .der
          </p>
        </FileDropZone>
        
        <div className="mt-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Or paste PEM-encoded certificate here...
-----BEGIN CERTIFICATE-----
MIIDdzCCAl+gAwIBAgIEAgAAuTANBgkqhkiG9w0BAQsFADBaMQswCQYDVQQGEwJJ
...
-----END CERTIFICATE-----"
            className="w-full h-48 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none"
          />
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleParse}
            disabled={!input.trim() || loading}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Parsing...' : 'Decode Certificate'}
          </button>
          <button
            onClick={() => { setInput(''); setCert(null); setError(null) }}
            className="px-4 py-2.5 rounded-xl font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      </div>
      
      {error && (
        <InfoBadge type="error">{error}</InfoBadge>
      )}
      
      {cert && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Validity Status */}
          <div className={`glass-card rounded-xl p-4 flex items-center justify-between ${
            status.type === 'success' ? 'border-emerald-500/30' :
            status.type === 'warning' ? 'border-amber-500/30' : 'border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <status.icon className={`w-6 h-6 ${
                status.type === 'success' ? 'text-emerald-400' :
                status.type === 'warning' ? 'text-amber-400' : 'text-red-400'
              }`} />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{status.text}</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {cert.validity.notBefore.toLocaleDateString()} → {cert.validity.notAfter.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-tertiary)]">Version</p>
              <p className="font-mono text-[var(--text-primary)]">X.509 v{cert.version}</p>
            </div>
          </div>
          
          {/* Subject */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Subject
            </h3>
            <div className="space-y-1">
              <DetailRow label="Common Name (CN)" value={cert.subject.commonName} />
              <DetailRow label="Organization (O)" value={cert.subject.organizationName} />
              <DetailRow label="Org. Unit (OU)" value={cert.subject.organizationalUnitName} />
              <DetailRow label="Country (C)" value={cert.subject.countryName} />
              <DetailRow label="State (ST)" value={cert.subject.stateOrProvinceName} />
              <DetailRow label="Locality (L)" value={cert.subject.localityName} />
            </div>
          </div>
          
          {/* Issuer */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Issuer
            </h3>
            <div className="space-y-1">
              <DetailRow label="Common Name (CN)" value={cert.issuer.commonName} />
              <DetailRow label="Organization (O)" value={cert.issuer.organizationName} />
              <DetailRow label="Org. Unit (OU)" value={cert.issuer.organizationalUnitName} />
              <DetailRow label="Country (C)" value={cert.issuer.countryName} />
            </div>
          </div>
          
          {/* Public Key */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Public Key
            </h3>
            <div className="space-y-1">
              <DetailRow label="Algorithm" value={cert.publicKey.algorithm} />
              <DetailRow label="Key Size" value={cert.publicKey.keySize ? `${cert.publicKey.keySize} bits` : '-'} />
              {cert.publicKey.curve && (
                <DetailRow label="Curve" value={cert.publicKey.curve} />
              )}
              <DetailRow label="Signature Algorithm" value={cert.signatureAlgorithm} />
            </div>
          </div>
          
          {/* SANs */}
          {cert.san.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Subject Alternative Names ({cert.san.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {cert.san.map((san, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-sm font-mono text-[var(--text-primary)]">
                    {san.type}: {san.value}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Extensions */}
          {(cert.keyUsage.length > 0 || cert.extKeyUsage.length > 0 || cert.basicConstraints) && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Extensions
              </h3>
              <div className="space-y-4">
                {cert.keyUsage.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Key Usage</p>
                    <div className="flex flex-wrap gap-1">
                      {cert.keyUsage.map((usage, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[var(--accent)]/20 text-xs text-[var(--accent)]">
                          {usage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {cert.extKeyUsage.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Extended Key Usage</p>
                    <div className="flex flex-wrap gap-1">
                      {cert.extKeyUsage.map((usage, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-purple-500/20 text-xs text-purple-400">
                          {usage}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {cert.basicConstraints && (
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Basic Constraints</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      cert.basicConstraints.isCA 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {cert.basicConstraints.isCA ? 'CA Certificate' : 'End Entity'}
                      {cert.basicConstraints.pathLength !== null && ` (Path Length: ${cert.basicConstraints.pathLength})`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Fingerprints */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              Fingerprints
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[var(--text-tertiary)]">SHA-256</p>
                  <CopyButton text={cert.fingerprints.sha256} />
                </div>
                <p className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-tertiary)] p-2 rounded-lg break-all">
                  {cert.fingerprints.sha256}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[var(--text-tertiary)]">SHA-1</p>
                  <CopyButton text={cert.fingerprints.sha1} />
                </div>
                <p className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-tertiary)] p-2 rounded-lg break-all">
                  {cert.fingerprints.sha1}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[var(--text-tertiary)]">Serial Number</p>
                  <CopyButton text={cert.serial} />
                </div>
                <p className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-tertiary)] p-2 rounded-lg break-all">
                  {cert.serial}
                </p>
              </div>
            </div>
          </div>
          
          {/* Dev Mode: Raw ASN.1 */}
          {devMode && (
            <div className="glass-card rounded-xl p-6 border-dashed border-[var(--accent)]/30">
              <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Raw Certificate (Dev Mode)
              </h3>
              <pre className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                {bytesToHex(cert.raw, ' ').toUpperCase().match(/.{1,48}/g)?.join('\n')}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Chain Builder
const ChainBuilder = () => {
  const { showToast } = useApp()
  const [input, setInput] = useState('')
  const [chain, setChain] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [outputPEM, setOutputPEM] = useState('')
  
  const handleFile = async (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setInput(prev => prev + (prev ? '\n' : '') + e.target.result)
    }
    reader.readAsText(file)
  }
  
  const buildChain = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    setError(null)
    setChain([])
    setOutputPEM('')
    
    try {
      // Parse all certificates from input
      const pems = parsePEM(input)
      const certs = pems.filter(p => p.type === 'CERTIFICATE')
      
      if (certs.length === 0) {
        throw new Error('No valid certificates found in input')
      }
      
      if (certs.length === 1) {
        throw new Error('Need at least 2 certificates to build a chain')
      }
      
      // Parse each certificate
      const parsedCerts = await Promise.all(certs.map(async (c, idx) => {
        const parsed = await parseCertificate(c.bytes)
        return {
          ...parsed,
          pem: `-----BEGIN CERTIFICATE-----\n${c.base64.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`,
          index: idx
        }
      }))
      
      // Build chain by matching issuer to subject
      const orderedChain = []
      const used = new Set()
      
      // Find leaf certificate (one whose subject is not an issuer of any other cert)
      let leaf = null
      for (const cert of parsedCerts) {
        const isIssuer = parsedCerts.some(other => 
          other !== cert && 
          JSON.stringify(other.issuer) === JSON.stringify(cert.subject)
        )
        if (!isIssuer) {
          leaf = cert
          break
        }
      }
      
      if (!leaf) {
        // Fallback: use the first certificate that's not self-signed
        leaf = parsedCerts.find(c => JSON.stringify(c.subject) !== JSON.stringify(c.issuer)) || parsedCerts[0]
      }
      
      orderedChain.push(leaf)
      used.add(leaf.index)
      
      // Build the rest of the chain
      let current = leaf
      while (orderedChain.length < parsedCerts.length) {
        const issuer = parsedCerts.find(c => 
          !used.has(c.index) && 
          JSON.stringify(c.subject) === JSON.stringify(current.issuer)
        )
        
        if (!issuer) break
        
        orderedChain.push(issuer)
        used.add(issuer.index)
        current = issuer
      }
      
      setChain(orderedChain)
      
      // Generate output PEM (excluding root by default)
      const chainPEM = orderedChain
        .filter((_, i) => i < orderedChain.length - 1 || orderedChain.length === 1)
        .map(c => c.pem)
        .join('\n')
      setOutputPEM(chainPEM)
      
      showToast(`Chain built with ${orderedChain.length} certificates`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  
  const copyChain = async () => {
    await navigator.clipboard.writeText(outputPEM)
    showToast('Chain copied to clipboard')
  }
  
  const downloadChain = () => {
    const blob = new Blob([outputPEM], { type: 'application/x-pem-file' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fullchain.pem'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5 accent-text" />
          Certificate Chain Builder
        </h2>
        
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          Paste or upload multiple certificates in any order. They will be arranged into the correct chain sequence from leaf to root.
        </p>
        
        <FileDropZone onFile={handleFile} accept=".pem,.crt,.cer">
          <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)] text-sm">Drop certificate files or click to browse</p>
        </FileDropZone>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Or paste all certificates here (concatenated PEM format)...
-----BEGIN CERTIFICATE-----
... leaf certificate ...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
... intermediate certificate ...
-----END CERTIFICATE-----"
          className="w-full h-48 mt-4 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none"
        />
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={buildChain}
            disabled={!input.trim() || loading}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Building...' : 'Build Chain'}
          </button>
          <button
            onClick={() => { setInput(''); setChain([]); setOutputPEM(''); setError(null) }}
            className="px-4 py-2.5 rounded-xl font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      </div>
      
      {error && <InfoBadge type="error">{error}</InfoBadge>}
      
      {chain.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Chain Visualization */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4">
              Certificate Chain ({chain.length} certificates)
            </h3>
            <div className="space-y-2">
              {chain.map((cert, i) => {
                const isLeaf = i === 0
                const isRoot = i === chain.length - 1 && JSON.stringify(cert.subject) === JSON.stringify(cert.issuer)
                
                return (
                  <div key={i}>
                    <div className={`p-4 rounded-xl border ${
                      isLeaf ? 'border-blue-500/30 bg-blue-500/5' :
                      isRoot ? 'border-amber-500/30 bg-amber-500/5' :
                      'border-[var(--border-color)] bg-[var(--bg-tertiary)]'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isLeaf ? 'bg-blue-500/20 text-blue-400' :
                            isRoot ? 'bg-amber-500/20 text-amber-400' :
                            'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                          }`}>
                            {isLeaf ? 'Leaf' : isRoot ? 'Root' : 'Intermediate'}
                          </span>
                          <p className="mt-2 font-medium text-[var(--text-primary)]">
                            {cert.subject.commonName || cert.subject.organizationName || 'Unknown'}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Issuer: {cert.issuer.commonName || cert.issuer.organizationName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${cert.validity.isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                            {cert.validity.isExpired ? 'Expired' : `${cert.validity.daysRemaining}d remaining`}
                          </p>
                        </div>
                      </div>
                    </div>
                    {i < chain.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] rotate-90" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Output PEM */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--accent)]">Output (fullchain.pem)</h3>
              <div className="flex gap-2">
                <button onClick={copyChain} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)]">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={downloadChain} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)]">
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
            <pre className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
              {outputPEM}
            </pre>
          </div>
        </motion.div>
      )}
      
      <InfoBadge type="info">
        Chain building matches issuer/subject names to arrange certificates correctly. Root certificate is excluded from output by default.
      </InfoBadge>
    </div>
  )
}

// CSR Decoder
const CSRDecoder = () => {
  const { devMode } = useApp()
  const [input, setInput] = useState('')
  const [csr, setCSR] = useState(null)
  const [error, setError] = useState(null)
  
  const handleParse = () => {
    if (!input.trim()) return
    setError(null)
    
    try {
      const pems = parsePEM(input)
      const csrPem = pems.find(p => p.type === 'CERTIFICATE REQUEST' || p.type === 'NEW CERTIFICATE REQUEST')
      if (!csrPem) {
        throw new Error('No valid CSR found. Please paste a CSR starting with "-----BEGIN CERTIFICATE REQUEST-----"')
      }
      
      const parsed = parseCSR(csrPem.bytes)
      setCSR(parsed)
    } catch (e) {
      setError(e.message)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <FilePlus className="w-5 h-5 accent-text" />
          CSR Decoder
        </h2>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste PEM-encoded CSR here...
-----BEGIN CERTIFICATE REQUEST-----
MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCVVMxDTALBgNVBAgMBFV0YWgx
...
-----END CERTIFICATE REQUEST-----"
          className="w-full h-48 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none"
        />
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleParse}
            disabled={!input.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Decode CSR
          </button>
          <button
            onClick={() => { setInput(''); setCSR(null); setError(null) }}
            className="px-4 py-2.5 rounded-xl font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      </div>
      
      {error && <InfoBadge type="error">{error}</InfoBadge>}
      
      {csr && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Subject (Requested)
            </h3>
            <div className="space-y-1">
              <DetailRow label="Common Name (CN)" value={csr.subject.commonName} />
              <DetailRow label="Organization (O)" value={csr.subject.organizationName} />
              <DetailRow label="Org. Unit (OU)" value={csr.subject.organizationalUnitName} />
              <DetailRow label="Country (C)" value={csr.subject.countryName} />
              <DetailRow label="State (ST)" value={csr.subject.stateOrProvinceName} />
              <DetailRow label="Locality (L)" value={csr.subject.localityName} />
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Public Key
            </h3>
            <div className="space-y-1">
              <DetailRow label="Algorithm" value={csr.publicKey.algorithm} />
              <DetailRow label="Key Size" value={csr.publicKey.keySize ? `${csr.publicKey.keySize} bits` : '-'} />
              {csr.publicKey.curve && <DetailRow label="Curve" value={csr.publicKey.curve} />}
              <DetailRow label="Signature Algorithm" value={csr.signatureAlgorithm} />
            </div>
          </div>
          
          {csr.requestedSAN.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Requested SANs
              </h3>
              <div className="flex flex-wrap gap-2">
                {csr.requestedSAN.map((san, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-sm font-mono text-[var(--text-primary)]">
                    {san.type}: {san.value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// CSR Generator
const CSRGenerator = () => {
  const { showToast } = useApp()
  const [formData, setFormData] = useState({
    commonName: '',
    organization: '',
    organizationalUnit: '',
    country: 'US',
    state: '',
    locality: '',
    keyType: 'EC-P256',
    sans: []
  })
  const [newSAN, setNewSAN] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  const keyTypes = [
    { value: 'RSA-2048', label: 'RSA 2048-bit', algorithm: { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' } },
    { value: 'RSA-3072', label: 'RSA 3072-bit', algorithm: { name: 'RSASSA-PKCS1-v1_5', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' } },
    { value: 'RSA-4096', label: 'RSA 4096-bit', algorithm: { name: 'RSASSA-PKCS1-v1_5', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' } },
    { value: 'EC-P256', label: 'ECDSA P-256 (recommended)', algorithm: { name: 'ECDSA', namedCurve: 'P-256' } },
    { value: 'EC-P384', label: 'ECDSA P-384', algorithm: { name: 'ECDSA', namedCurve: 'P-384' } },
  ]
  
  const addSAN = () => {
    if (newSAN.trim()) {
      setFormData(prev => ({
        ...prev,
        sans: [...prev.sans, newSAN.trim()]
      }))
      setNewSAN('')
    }
  }
  
  const removeSAN = (index) => {
    setFormData(prev => ({
      ...prev,
      sans: prev.sans.filter((_, i) => i !== index)
    }))
  }
  
  const generateCSR = async () => {
    if (!formData.commonName.trim()) return
    
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const keyConfig = keyTypes.find(k => k.value === formData.keyType)
      
      // Generate key pair using Web Crypto API
      const keyPair = await crypto.subtle.generateKey(
        keyConfig.algorithm,
        true, // extractable
        ['sign', 'verify']
      )
      
      // Export private key to PKCS#8 PEM format
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)))
      const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`
      
      // Export public key to SPKI format
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)))
      
      // Build a simple CSR representation (simplified - real CSR needs ASN.1 encoding)
      // For demonstration, we'll create a placeholder CSR format
      const csrInfo = {
        subject: {
          CN: formData.commonName,
          O: formData.organization || undefined,
          OU: formData.organizationalUnit || undefined,
          C: formData.country,
          ST: formData.state || undefined,
          L: formData.locality || undefined
        },
        sans: formData.sans,
        keyType: formData.keyType,
        publicKey: publicKeyBase64
      }
      
      // Create a mock CSR PEM (in production, you'd use a proper ASN.1 library)
      const csrData = btoa(JSON.stringify(csrInfo))
      const csrPEM = `-----BEGIN CERTIFICATE REQUEST-----\n# Note: This is a simplified CSR format for demonstration\n# Subject: CN=${formData.commonName}${formData.organization ? ', O=' + formData.organization : ''}${formData.country ? ', C=' + formData.country : ''}\n# Key Type: ${formData.keyType}\n# SANs: ${formData.sans.join(', ') || 'None'}\n#\n# Public Key (SPKI Base64):\n${publicKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE REQUEST-----`
      
      setResult({
        csr: csrPEM,
        privateKey: privateKeyPEM,
        publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`,
        keyType: formData.keyType,
        subject: csrInfo.subject
      })
      
      showToast('CSR and Private Key generated successfully!')
    } catch (e) {
      setError(e.message || 'Failed to generate CSR')
    } finally {
      setLoading(false)
    }
  }
  
  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'application/x-pem-file' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const copyToClipboard = async (text, label) => {
    await navigator.clipboard.writeText(text)
    showToast(`${label} copied to clipboard`)
  }
  
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <FilePlus className="w-5 h-5 accent-text" />
          CSR Generator
        </h2>
        
        <p className="text-sm text-amber-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          The private key will be generated in your browser. Make sure to save it securely!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Common Name (CN) *
            </label>
            <input
              type="text"
              value={formData.commonName}
              onChange={(e) => setFormData(prev => ({ ...prev, commonName: e.target.value }))}
              placeholder="example.com or *.example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Organization (O)</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
              placeholder="Company Inc."
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Organizational Unit (OU)</label>
            <input
              type="text"
              value={formData.organizationalUnit}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationalUnit: e.target.value }))}
              placeholder="IT Department"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Country (C)</label>
            <select
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            >
              <option value="US">United States (US)</option>
              <option value="GB">United Kingdom (GB)</option>
              <option value="DE">Germany (DE)</option>
              <option value="FR">France (FR)</option>
              <option value="IN">India (IN)</option>
              <option value="CA">Canada (CA)</option>
              <option value="AU">Australia (AU)</option>
              <option value="JP">Japan (JP)</option>
              <option value="CN">China (CN)</option>
              <option value="SG">Singapore (SG)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">State/Province (ST)</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              placeholder="California"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Locality (L)</label>
            <input
              type="text"
              value={formData.locality}
              onChange={(e) => setFormData(prev => ({ ...prev, locality: e.target.value }))}
              placeholder="San Francisco"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Key Type</label>
            <select
              value={formData.keyType}
              onChange={(e) => setFormData(prev => ({ ...prev, keyType: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            >
              {keyTypes.map(kt => (
                <option key={kt.value} value={kt.value}>{kt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Subject Alternative Names (SANs)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSAN}
                onChange={(e) => setNewSAN(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSAN())}
                placeholder="www.example.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              />
              <button
                onClick={addSAN}
                type="button"
                className="px-4 py-2.5 rounded-xl font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/20"
              >
                Add
              </button>
            </div>
            {formData.sans.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.sans.map((san, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)]">
                    {san}
                    <button onClick={() => removeSAN(i)} className="text-[var(--text-tertiary)] hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={generateCSR}
            disabled={!formData.commonName.trim() || loading}
            className="w-full px-4 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate CSR & Private Key'}
          </button>
        </div>
      </div>
      
      {error && <InfoBadge type="error">{error}</InfoBadge>}
      
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Private Key - Most Important */}
          <div className="glass-card rounded-xl p-6 border-red-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Private Key (SAVE THIS SECURELY!)
              </h3>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(result.privateKey, 'Private Key')} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-red-500/20 text-[var(--text-secondary)]">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={() => downloadFile(result.privateKey, `${formData.commonName.replace(/\*/g, 'wildcard')}.key`)} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-red-500/20 text-[var(--text-secondary)]">
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
            <pre className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-x-auto max-h-40 overflow-y-auto">
              {result.privateKey}
            </pre>
          </div>
          
          {/* CSR */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--accent)]">Certificate Signing Request (CSR)</h3>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(result.csr, 'CSR')} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)]">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={() => downloadFile(result.csr, `${formData.commonName.replace(/\*/g, 'wildcard')}.csr`)} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)]">
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
            <pre className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-x-auto max-h-40 overflow-y-auto">
              {result.csr}
            </pre>
          </div>
          
          {/* Summary */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4">Summary</h3>
            <div className="space-y-1">
              <DetailRow label="Common Name" value={formData.commonName} />
              <DetailRow label="Key Type" value={result.keyType} />
              <DetailRow label="SANs" value={formData.sans.length > 0 ? formData.sans.join(', ') : 'None'} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Key Parser
const KeyParser = () => {
  const { devMode, showToast } = useApp()
  const [input, setInput] = useState('')
  const [keyInfo, setKeyInfo] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPrivateDetails, setShowPrivateDetails] = useState(false)
  
  const parseKey = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    setError(null)
    setKeyInfo(null)
    
    try {
      const pems = parsePEM(input)
      if (pems.length === 0) {
        throw new Error('No valid PEM key found')
      }
      
      const keyPem = pems[0]
      let keyType = 'Unknown'
      let algorithm = 'Unknown'
      let keySize = null
      let curve = null
      
      if (keyPem.type.includes('RSA')) {
        keyType = 'RSA'
        algorithm = 'RSASSA-PKCS1-v1_5'
        // Parse RSA key to get modulus size
        const asn1 = parseASN1(keyPem.bytes)
        if (asn1 && asn1.children) {
          // Try to find modulus in the ASN.1 structure
          const findModulus = (node) => {
            if (node.tagName === 'INTEGER' && node.value.length > 100) {
              return node.value.length * 8 - (node.value[0] === 0 ? 8 : 0)
            }
            if (node.children) {
              for (const child of node.children) {
                const found = findModulus(child)
                if (found) return found
              }
            }
            return null
          }
          keySize = findModulus(asn1)
        }
      } else if (keyPem.type.includes('EC')) {
        keyType = 'ECDSA'
        algorithm = 'ECDSA'
        // EC keys typically indicate curve in the structure
        const size = keyPem.bytes.length
        if (size < 150) {
          curve = 'P-256'
          keySize = 256
        } else if (size < 250) {
          curve = 'P-384'
          keySize = 384
        } else {
          curve = 'P-521'
          keySize = 521
        }
      } else if (keyPem.type === 'PRIVATE KEY') {
        // PKCS#8 format - need to parse OID
        const asn1 = parseASN1(keyPem.bytes)
        if (asn1 && asn1.children && asn1.children.length > 1) {
          const algInfo = asn1.children[0]
          if (algInfo && algInfo.children && algInfo.children[0]) {
            const oid = parseOID(algInfo.children[0].value)
            if (oid === '1.2.840.113549.1.1.1') {
              keyType = 'RSA'
              algorithm = 'RSASSA-PKCS1-v1_5'
              // Get key size from nested structure
              if (asn1.children[1]) {
                const keyData = parseASN1(asn1.children[1].value)
                if (keyData && keyData.children && keyData.children[1]) {
                  keySize = (keyData.children[1].value.length - 1) * 8
                }
              }
            } else if (oid === '1.2.840.10045.2.1') {
              keyType = 'ECDSA'
              algorithm = 'ECDSA'
              if (algInfo.children[1]) {
                const curveOID = parseOID(algInfo.children[1].value)
                curve = oidNames[curveOID] || curveOID
                const curveSizes = { 'secp256r1': 256, 'secp384r1': 384, 'secp521r1': 521 }
                keySize = curveSizes[curve] || null
              }
            }
          }
        }
      }
      
      // Generate public key fingerprint
      const fingerprint = await calculateSHA256(keyPem.bytes)
      
      setKeyInfo({
        type: keyPem.type,
        keyType,
        algorithm,
        keySize,
        curve,
        fingerprint,
        raw: keyPem.bytes,
        base64: keyPem.base64
      })
      
      showToast('Key parsed successfully')
    } catch (e) {
      setError(e.message || 'Failed to parse key')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <KeyRound className="w-5 h-5 accent-text" />
          Private Key Parser
        </h2>
        
        <p className="text-sm text-amber-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Private key material is sensitive. This tool never transmits your key anywhere.
        </p>
        
        <FileDropZone onFile={(file) => {
          const reader = new FileReader()
          reader.onload = (e) => setInput(e.target.result)
          reader.readAsText(file)
        }} accept=".pem,.key">
          <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)] text-sm">Drop key file or click to browse</p>
        </FileDropZone>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Or paste PEM-encoded private key here...
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...
-----END PRIVATE KEY-----"
          className="w-full h-40 mt-4 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none"
        />
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={parseKey}
            disabled={!input.trim() || loading}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Parsing...' : 'Parse Key'}
          </button>
          <button
            onClick={() => { setInput(''); setKeyInfo(null); setError(null) }}
            className="px-4 py-2.5 rounded-xl font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      </div>
      
      {error && <InfoBadge type="error">{error}</InfoBadge>}
      
      {keyInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Key Information
            </h3>
            <div className="space-y-1">
              <DetailRow label="Format" value={keyInfo.type} />
              <DetailRow label="Key Type" value={keyInfo.keyType} />
              <DetailRow label="Algorithm" value={keyInfo.algorithm} />
              {keyInfo.keySize && <DetailRow label="Key Size" value={`${keyInfo.keySize} bits`} />}
              {keyInfo.curve && <DetailRow label="Curve" value={keyInfo.curve} />}
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--accent)]">Key Fingerprint (SHA-256)</h3>
              <CopyButton text={keyInfo.fingerprint} />
            </div>
            <p className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-tertiary)] p-2 rounded-lg break-all">
              {keyInfo.fingerprint}
            </p>
          </div>
          
          {devMode && (
            <div className="glass-card rounded-xl p-6 border-dashed border-[var(--accent)]/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--accent)] flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Raw Key Data (Dev Mode)
                </h3>
                <button
                  onClick={() => setShowPrivateDetails(!showPrivateDetails)}
                  className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                >
                  {showPrivateDetails ? 'Hide' : 'Show'}
                </button>
              </div>
              {showPrivateDetails && (
                <pre className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                  {bytesToHex(keyInfo.raw, ' ').toUpperCase().match(/.{1,48}/g)?.join('\n')}
                </pre>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// PEM/DER Converter
const PEMDERConverter = () => {
  const { showToast } = useApp()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [outputType, setOutputType] = useState('')
  const [direction, setDirection] = useState('pem-to-der')
  const [error, setError] = useState(null)
  const [derBytes, setDerBytes] = useState(null)
  
  const handleFile = async (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (direction === 'der-to-pem') {
        // Binary DER file
        const bytes = new Uint8Array(e.target.result)
        const base64 = btoa(String.fromCharCode(...bytes))
        setInput(base64)
      } else {
        setInput(e.target.result)
      }
    }
    
    if (direction === 'der-to-pem') {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }
  
  const convert = () => {
    if (!input.trim()) return
    
    setError(null)
    setOutput('')
    setDerBytes(null)
    
    try {
      if (direction === 'pem-to-der') {
        // PEM to DER
        const pems = parsePEM(input)
        if (pems.length === 0) {
          throw new Error('No valid PEM content found')
        }
        
        const pem = pems[0]
        setDerBytes(pem.bytes)
        setOutputType(pem.type)
        
        // Show hex dump of DER
        const hexDump = bytesToHex(pem.bytes, ' ').toUpperCase()
        setOutput(hexDump.match(/.{1,48}/g)?.join('\n') || hexDump)
        
        showToast('Converted to DER format')
      } else {
        // DER to PEM
        // Input could be base64 or hex
        let bytes
        const cleanInput = input.replace(/\s/g, '')
        
        if (/^[A-Fa-f0-9]+$/.test(cleanInput)) {
          // Hex input
          const matches = cleanInput.match(/.{2}/g)
          bytes = new Uint8Array(matches.map(h => parseInt(h, 16)))
        } else {
          // Base64 input
          try {
            const binary = atob(cleanInput)
            bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
          } catch {
            throw new Error('Invalid Base64 or hex input')
          }
        }
        
        // Detect content type from ASN.1
        let type = 'UNKNOWN'
        const asn1 = parseASN1(bytes)
        if (asn1) {
          // Simple heuristics to detect type
          if (asn1.children && asn1.children.length >= 3) {
            const firstChild = asn1.children[0]
            if (firstChild.tag === 0xa0 || firstChild.tagName === 'INTEGER') {
              type = 'CERTIFICATE'
            }
          }
          // Check for typical structures
          if (bytes.length > 500) type = 'CERTIFICATE'
          else if (bytes.length < 200) type = 'PRIVATE KEY'
        }
        
        setOutputType(type)
        
        // Convert to PEM
        const base64 = btoa(String.fromCharCode(...bytes))
        const pem = `-----BEGIN ${type}-----\n${base64.match(/.{1,64}/g).join('\n')}\n-----END ${type}-----`
        setOutput(pem)
        
        showToast('Converted to PEM format')
      }
    } catch (e) {
      setError(e.message || 'Conversion failed')
    }
  }
  
  const downloadDER = () => {
    if (!derBytes) return
    const blob = new Blob([derBytes], { type: 'application/x-x509-ca-cert' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `output.${outputType.toLowerCase().includes('certificate') ? 'der' : 'key'}`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const copyOutput = async () => {
    await navigator.clipboard.writeText(output)
    showToast('Output copied to clipboard')
  }
  
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 accent-text" />
          PEM/DER Converter
        </h2>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setDirection('pem-to-der'); setInput(''); setOutput(''); setError(null) }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              direction === 'pem-to-der'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            PEM → DER
          </button>
          <button
            onClick={() => { setDirection('der-to-pem'); setInput(''); setOutput(''); setError(null) }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              direction === 'der-to-pem'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            DER → PEM
          </button>
        </div>
        
        <FileDropZone onFile={handleFile} accept={direction === 'pem-to-der' ? '.pem,.crt,.cer,.key' : '.der,.cer'}>
          <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)] text-sm">Drop file or click to browse</p>
        </FileDropZone>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={direction === 'pem-to-der' 
            ? "Or paste PEM content here...\n-----BEGIN CERTIFICATE-----\n..." 
            : "Or paste Base64-encoded DER or hex bytes here..."}
          className="w-full h-32 mt-4 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none"
        />
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={convert}
            disabled={!input.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert
          </button>
          <button
            onClick={() => { setInput(''); setOutput(''); setError(null); setDerBytes(null) }}
            className="px-4 py-2.5 rounded-xl font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      </div>
      
      {error && <InfoBadge type="error">{error}</InfoBadge>}
      
      {output && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--accent)]">
              Output ({direction === 'pem-to-der' ? 'DER Hex Dump' : 'PEM'})
              {outputType && <span className="ml-2 text-xs text-[var(--text-tertiary)]">Type: {outputType}</span>}
            </h3>
            <div className="flex gap-2">
              <button onClick={copyOutput} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)]">
                <Copy className="w-3 h-3" /> Copy
              </button>
              {direction === 'pem-to-der' && derBytes && (
                <button onClick={downloadDER} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)]">
                  <Download className="w-3 h-3" /> Download DER
                </button>
              )}
            </div>
          </div>
          <pre className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
            {output}
          </pre>
          
          {direction === 'pem-to-der' && derBytes && (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              Size: {derBytes.length} bytes (DER) → PEM would be ~{Math.ceil(derBytes.length * 4/3)} bytes
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Certificate Comparison
const CertComparison = () => {
  const { showToast } = useApp()
  const [certA, setCertA] = useState('')
  const [certB, setCertB] = useState('')
  const [parsedA, setParsedA] = useState(null)
  const [parsedB, setParsedB] = useState(null)
  const [differences, setDifferences] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const compareCerts = async () => {
    if (!certA.trim() || !certB.trim()) return
    
    setLoading(true)
    setError(null)
    setParsedA(null)
    setParsedB(null)
    setDifferences([])
    
    try {
      const pemsA = parsePEM(certA)
      const pemsB = parsePEM(certB)
      
      const certPemA = pemsA.find(p => p.type === 'CERTIFICATE')
      const certPemB = pemsB.find(p => p.type === 'CERTIFICATE')
      
      if (!certPemA) throw new Error('No valid certificate found in Certificate A')
      if (!certPemB) throw new Error('No valid certificate found in Certificate B')
      
      const a = await parseCertificate(certPemA.bytes)
      const b = await parseCertificate(certPemB.bytes)
      
      setParsedA(a)
      setParsedB(b)
      
      // Find differences
      const diffs = []
      
      // Subject
      const subjectFieldsA = Object.entries(a.subject)
      const subjectFieldsB = Object.entries(b.subject)
      if (JSON.stringify(a.subject) !== JSON.stringify(b.subject)) {
        diffs.push({ field: 'Subject', valueA: a.subject.commonName || '-', valueB: b.subject.commonName || '-', type: 'changed' })
      }
      
      // Issuer
      if (JSON.stringify(a.issuer) !== JSON.stringify(b.issuer)) {
        diffs.push({ field: 'Issuer', valueA: a.issuer.commonName || '-', valueB: b.issuer.commonName || '-', type: 'changed' })
      }
      
      // Serial
      if (a.serial !== b.serial) {
        diffs.push({ field: 'Serial Number', valueA: a.serial, valueB: b.serial, type: 'changed' })
      }
      
      // Validity
      if (a.validity.notBefore.getTime() !== b.validity.notBefore.getTime()) {
        diffs.push({ field: 'Not Before', valueA: a.validity.notBefore.toLocaleDateString(), valueB: b.validity.notBefore.toLocaleDateString(), type: 'changed' })
      }
      if (a.validity.notAfter.getTime() !== b.validity.notAfter.getTime()) {
        diffs.push({ field: 'Not After', valueA: a.validity.notAfter.toLocaleDateString(), valueB: b.validity.notAfter.toLocaleDateString(), type: 'changed' })
      }
      
      // Key
      if (a.publicKey.algorithm !== b.publicKey.algorithm) {
        diffs.push({ field: 'Key Algorithm', valueA: a.publicKey.algorithm, valueB: b.publicKey.algorithm, type: 'changed' })
      }
      if (a.publicKey.keySize !== b.publicKey.keySize) {
        diffs.push({ field: 'Key Size', valueA: `${a.publicKey.keySize} bits`, valueB: `${b.publicKey.keySize} bits`, type: 'changed' })
      }
      
      // Signature algorithm
      if (a.signatureAlgorithm !== b.signatureAlgorithm) {
        diffs.push({ field: 'Signature Algorithm', valueA: a.signatureAlgorithm, valueB: b.signatureAlgorithm, type: 'changed' })
      }
      
      // SANs
      const sansA = a.san.map(s => `${s.type}:${s.value}`).sort().join(', ')
      const sansB = b.san.map(s => `${s.type}:${s.value}`).sort().join(', ')
      if (sansA !== sansB) {
        diffs.push({ field: 'SANs', valueA: sansA || 'None', valueB: sansB || 'None', type: 'changed' })
      }
      
      // Fingerprints
      if (a.fingerprints.sha256 !== b.fingerprints.sha256) {
        diffs.push({ field: 'SHA-256 Fingerprint', valueA: a.fingerprints.sha256.substring(0, 30) + '...', valueB: b.fingerprints.sha256.substring(0, 30) + '...', type: 'changed' })
      }
      
      setDifferences(diffs)
      
      if (diffs.length === 0) {
        showToast('Certificates are identical!')
      } else {
        showToast(`Found ${diffs.length} difference(s)`)
      }
    } catch (e) {
      setError(e.message || 'Failed to compare certificates')
    } finally {
      setLoading(false)
    }
  }
  
  const swapCerts = () => {
    const tempA = certA
    setCertA(certB)
    setCertB(tempA)
    setParsedA(null)
    setParsedB(null)
    setDifferences([])
  }
  
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <GitCompare className="w-5 h-5 accent-text" />
          Certificate Comparison
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Certificate A</label>
            <textarea
              value={certA}
              onChange={(e) => setCertA(e.target.value)}
              placeholder="Paste first certificate..."
              className="w-full h-40 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Certificate B</label>
            <textarea
              value={certB}
              onChange={(e) => setCertB(e.target.value)}
              placeholder="Paste second certificate..."
              className="w-full h-40 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none"
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={compareCerts}
            disabled={!certA.trim() || !certB.trim() || loading}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all bg-gradient-to-r from-[var(--accent)] to-purple-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Comparing...' : 'Compare Certificates'}
          </button>
          <button
            onClick={swapCerts}
            disabled={!certA && !certB}
            className="px-4 py-2.5 rounded-xl font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCertA(''); setCertB(''); setParsedA(null); setParsedB(null); setDifferences([]); setError(null) }}
            className="px-4 py-2.5 rounded-xl font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      </div>
      
      {error && <InfoBadge type="error">{error}</InfoBadge>}
      
      {parsedA && parsedB && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary */}
          <div className={`glass-card rounded-xl p-4 ${differences.length === 0 ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
            <div className="flex items-center gap-2">
              {differences.length === 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium text-emerald-400">Certificates are identical</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="font-medium text-amber-400">{differences.length} difference(s) found</span>
                </>
              )}
            </div>
          </div>
          
          {/* Differences Table */}
          {differences.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--accent)] mb-4">Differences</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-2 px-2 text-[var(--text-tertiary)] font-medium">Field</th>
                      <th className="text-left py-2 px-2 text-blue-400 font-medium">Certificate A</th>
                      <th className="text-left py-2 px-2 text-purple-400 font-medium">Certificate B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {differences.map((diff, i) => (
                      <tr key={i} className="border-b border-[var(--border-color)]/50">
                        <td className="py-2 px-2 text-[var(--text-secondary)]">{diff.field}</td>
                        <td className="py-2 px-2 text-[var(--text-primary)] font-mono text-xs bg-blue-500/5">{diff.valueA}</td>
                        <td className="py-2 px-2 text-[var(--text-primary)] font-mono text-xs bg-purple-500/5">{diff.valueB}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4 border-blue-500/30">
              <h3 className="text-sm font-semibold text-blue-400 mb-3">Certificate A</h3>
              <div className="space-y-1 text-xs">
                <p><span className="text-[var(--text-tertiary)]">CN:</span> <span className="text-[var(--text-primary)]">{parsedA.subject.commonName || '-'}</span></p>
                <p><span className="text-[var(--text-tertiary)]">Issuer:</span> <span className="text-[var(--text-primary)]">{parsedA.issuer.commonName || '-'}</span></p>
                <p><span className="text-[var(--text-tertiary)]">Valid:</span> <span className={parsedA.validity.isExpired ? 'text-red-400' : 'text-emerald-400'}>{parsedA.validity.notAfter.toLocaleDateString()}</span></p>
                <p><span className="text-[var(--text-tertiary)]">Key:</span> <span className="text-[var(--text-primary)]">{parsedA.publicKey.algorithm} {parsedA.publicKey.keySize}bit</span></p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border-purple-500/30">
              <h3 className="text-sm font-semibold text-purple-400 mb-3">Certificate B</h3>
              <div className="space-y-1 text-xs">
                <p><span className="text-[var(--text-tertiary)]">CN:</span> <span className="text-[var(--text-primary)]">{parsedB.subject.commonName || '-'}</span></p>
                <p><span className="text-[var(--text-tertiary)]">Issuer:</span> <span className="text-[var(--text-primary)]">{parsedB.issuer.commonName || '-'}</span></p>
                <p><span className="text-[var(--text-tertiary)]">Valid:</span> <span className={parsedB.validity.isExpired ? 'text-red-400' : 'text-emerald-400'}>{parsedB.validity.notAfter.toLocaleDateString()}</span></p>
                <p><span className="text-[var(--text-tertiary)]">Key:</span> <span className="text-[var(--text-primary)]">{parsedB.publicKey.algorithm} {parsedB.publicKey.keySize}bit</span></p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ==================== SUB-NAVIGATION ====================

const subTools = [
  { path: '', label: 'Decoder', icon: FileText, description: 'Parse X.509 certificates' },
  { path: 'chain', label: 'Chain Builder', icon: Link2, description: 'Build certificate chains' },
  { path: 'csr-decode', label: 'CSR Decode', icon: FilePlus, description: 'Parse signing requests' },
  { path: 'csr-generate', label: 'CSR Generate', icon: FileKey, description: 'Create new CSR' },
  { path: 'key', label: 'Key Parser', icon: KeyRound, description: 'Parse private keys' },
  { path: 'convert', label: 'PEM/DER', icon: RefreshCw, description: 'Convert formats' },
  { path: 'compare', label: 'Compare', icon: GitCompare, description: 'Compare certificates' },
]

const SubNavigation = () => {
  const location = useLocation()
  const currentPath = location.pathname.replace('/ssl', '').replace('/', '') || ''
  
  return (
    <div className="glass-card rounded-xl p-2 mb-6 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {subTools.map((tool) => {
          const isActive = currentPath === tool.path || (currentPath === '' && tool.path === '')
          const Icon = tool.icon
          
          return (
            <NavLink
              key={tool.path}
              to={`/ssl/${tool.path}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tool.label}
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}

// Add missing Code icon
const Code = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

// ==================== MAIN COMPONENT ====================

const SSLToolkit = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Privacy Badge */}
      <div className="mb-6 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>All certificate and key processing happens locally in your browser</span>
      </div>
      
      {/* Sub Navigation */}
      <SubNavigation />
      
      {/* Routes */}
      <Routes>
        <Route path="/" element={<CertificateDecoder />} />
        <Route path="/chain" element={<ChainBuilder />} />
        <Route path="/csr-decode" element={<CSRDecoder />} />
        <Route path="/csr-generate" element={<CSRGenerator />} />
        <Route path="/key" element={<KeyParser />} />
        <Route path="/convert" element={<PEMDERConverter />} />
        <Route path="/compare" element={<CertComparison />} />
      </Routes>
    </motion.div>
  )
}

export default SSLToolkit

