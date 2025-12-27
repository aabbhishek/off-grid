import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import {
  Fingerprint, Copy, Download, RefreshCw, CheckCircle,
  XCircle, Info, Clock, Shuffle, List
} from 'lucide-react'

// Generate UUID v4 (random)
function uuidv4() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return formatUUID(bytes)
}

// Generate UUID v7 (timestamp + random)
function uuidv7() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const timestamp = Date.now()
  bytes[0] = (timestamp / 0x10000000000) & 0xff
  bytes[1] = (timestamp / 0x100000000) & 0xff
  bytes[2] = (timestamp / 0x1000000) & 0xff
  bytes[3] = (timestamp / 0x10000) & 0xff
  bytes[4] = (timestamp / 0x100) & 0xff
  bytes[5] = timestamp & 0xff
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return formatUUID(bytes)
}

// Generate UUID v1 (timestamp-based)
function uuidv1() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const now = Date.now()
  const gregorianOffset = 122192928000000000n
  const timestamp = BigInt(now) * 10000n + gregorianOffset
  bytes[0] = Number((timestamp >> 24n) & 0xffn)
  bytes[1] = Number((timestamp >> 16n) & 0xffn)
  bytes[2] = Number((timestamp >> 8n) & 0xffn)
  bytes[3] = Number(timestamp & 0xffn)
  bytes[4] = Number((timestamp >> 40n) & 0xffn)
  bytes[5] = Number((timestamp >> 32n) & 0xffn)
  bytes[6] = Number((timestamp >> 56n) & 0x0fn) | 0x10
  bytes[7] = Number((timestamp >> 48n) & 0xffn)
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  bytes[10] = bytes[10] | 0x01
  return formatUUID(bytes)
}

function uuidNil() { return '00000000-0000-0000-0000-000000000000' }

function formatUUID(bytes) {
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function parseUUID(uuid) {
  const cleaned = uuid.toLowerCase().replace(/[^a-f0-9]/g, '')
  if (cleaned.length !== 32) return null
  const bytes = []
  for (let i = 0; i < 32; i += 2) bytes.push(parseInt(cleaned.slice(i, i + 2), 16))
  const version = (bytes[6] >> 4) & 0x0f
  const variant = (bytes[8] >> 6) & 0x03
  let timestamp = null
  if (version === 7) {
    const ms = (bytes[0] * 0x10000000000) + (bytes[1] * 0x100000000) + (bytes[2] * 0x1000000) + (bytes[3] * 0x10000) + (bytes[4] * 0x100) + bytes[5]
    timestamp = new Date(ms)
  }
  return { version, variant, timestamp, bytes, isValid: variant === 2 && version >= 1 && version <= 7 }
}

const formats = {
  standard: (uuid) => uuid,
  noDashes: (uuid) => uuid.replace(/-/g, ''),
  braces: (uuid) => `{${uuid}}`,
  urn: (uuid) => `urn:uuid:${uuid}`,
  uppercase: (uuid) => uuid.toUpperCase()
}

const versions = [
  { id: 'v4', name: 'UUID v4', description: 'Random UUID using crypto.getRandomValues()', color: 'from-purple-500 to-pink-500', generate: uuidv4 },
  { id: 'v7', name: 'UUID v7', description: 'Timestamp + random, sortable, ideal for databases', color: 'from-cyan-500 to-blue-500', generate: uuidv7 },
  { id: 'v1', name: 'UUID v1', description: 'Timestamp-based with pseudo-random node', color: 'from-orange-500 to-red-500', generate: uuidv1 },
  { id: 'nil', name: 'Nil UUID', description: 'All zeros, used as placeholder', color: 'from-slate-500 to-gray-600', generate: uuidNil }
]

export default function UUIDGenerator() {
  const { devMode, copyToClipboard, showToast } = useApp()
  const [version, setVersion] = useState('v4')
  const [format, setFormat] = useState('standard')
  const [currentUUID, setCurrentUUID] = useState(uuidv4())
  const [batchCount, setBatchCount] = useState(10)
  const [batchUUIDs, setBatchUUIDs] = useState([])
  const [validateInput, setValidateInput] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [showBatch, setShowBatch] = useState(false)

  const generate = useCallback(() => {
    const versionConfig = versions.find(v => v.id === version)
    if (versionConfig) setCurrentUUID(versionConfig.generate())
  }, [version])

  const generateBatch = useCallback(() => {
    const versionConfig = versions.find(v => v.id === version)
    if (versionConfig) {
      const uuids = []
      for (let i = 0; i < batchCount; i++) uuids.push(versionConfig.generate())
      setBatchUUIDs(uuids)
    }
  }, [version, batchCount])

  const validate = useCallback(() => {
    if (!validateInput.trim()) { setValidationResult(null); return }
    setValidationResult(parseUUID(validateInput))
  }, [validateInput])

  const formattedUUID = currentUUID ? formats[format](currentUUID) : ''

  const downloadBatch = (as = 'txt') => {
    let content, type, ext
    if (as === 'json') { content = JSON.stringify(batchUUIDs.map(u => formats[format](u)), null, 2); type = 'application/json'; ext = 'json' }
    else { content = batchUUIDs.map(u => formats[format](u)).join('\n'); type = 'text/plain'; ext = 'txt' }
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `uuids.${ext}`; a.click()
    URL.revokeObjectURL(url); showToast('Downloaded!')
  }

  const currentVersion = versions.find(v => v.id === version)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500">
          <Fingerprint className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">UUID Generator</h1>
          <p className="text-sm text-[var(--text-secondary)]">Generate UUIDs v1, v4, and v7 with batch mode</p>
        </div>
      </div>

      {/* Version selector */}
      <div className="glass-card rounded-2xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => { setVersion(v.id); setCurrentUUID(v.generate()) }}
              className={`p-4 rounded-xl text-left transition-all ${version === v.id ? 'text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              style={version === v.id ? { background: `linear-gradient(135deg, var(--tw-gradient-stops))`, '--tw-gradient-from': v.color.split(' ')[0].replace('from-', '').replace('-500', '-500'), '--tw-gradient-to': v.color.split(' ')[1].replace('to-', '').replace('-500', '-500') } : {}}
            >
              <div className="font-medium text-sm">{v.name}</div>
              <div className="text-xs opacity-70 mt-1">{v.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Single UUID generator */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-[var(--text-primary)]">Generated UUID</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="glass-input px-3 py-1.5 text-xs w-36">
            <option value="standard">Standard</option>
            <option value="noDashes">No Dashes</option>
            <option value="braces">{`{Braces}`}</option>
            <option value="urn">URN</option>
            <option value="uppercase">UPPERCASE</option>
          </select>
        </div>

        <motion.div
          key={currentUUID}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] font-mono text-lg accent-text text-center select-all cursor-pointer"
          onClick={() => copyToClipboard(formattedUUID)}
        >
          {formattedUUID}
        </motion.div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={generate} className="glass-button-primary"><RefreshCw className="w-4 h-4" />Generate</button>
          <button onClick={() => copyToClipboard(formattedUUID)} className="glass-button" disabled={!currentUUID}><Copy className="w-4 h-4" />Copy</button>
          <button onClick={() => setShowBatch(!showBatch)} className="glass-button"><List className="w-4 h-4" />Batch Mode</button>
        </div>
      </div>

      {/* Batch generation */}
      <AnimatePresence>
        {showBatch && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-[var(--text-primary)]">Batch Generation</label>
              <div className="flex items-center gap-4">
                <input type="number" min="1" max="1000" value={batchCount} onChange={(e) => setBatchCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))} className="glass-input w-24 px-3 py-1.5 text-sm" />
                <button onClick={generateBatch} className="glass-button-primary text-sm py-2"><Shuffle className="w-4 h-4" />Generate {batchCount}</button>
              </div>
            </div>

            {batchUUIDs.length > 0 && (
              <>
                <textarea value={batchUUIDs.map(u => formats[format](u)).join('\n')} readOnly className="glass-input min-h-[200px] max-h-[400px] resize-y font-mono text-xs" />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => copyToClipboard(batchUUIDs.map(u => formats[format](u)).join('\n'))} className="glass-button text-sm py-2"><Copy className="w-4 h-4" />Copy All</button>
                  <button onClick={() => downloadBatch('txt')} className="glass-button text-sm py-2"><Download className="w-4 h-4" />Download TXT</button>
                  <button onClick={() => downloadBatch('json')} className="glass-button text-sm py-2"><Download className="w-4 h-4" />Download JSON</button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* UUID Validator */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4"><CheckCircle className="w-4 h-4 accent-text" /><label className="text-sm font-medium text-[var(--text-primary)]">Validate UUID</label></div>
        <div className="flex gap-3">
          <input type="text" value={validateInput} onChange={(e) => { setValidateInput(e.target.value); setValidationResult(null) }} onBlur={validate} placeholder="Paste a UUID to validate..." className="glass-input flex-1 font-mono" />
          <button onClick={validate} className="glass-button">Validate</button>
        </div>

        <AnimatePresence>
          {validationResult && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-4 p-4 rounded-xl ${validationResult.isValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <div className={`flex items-center gap-2 mb-3 ${validationResult.isValid ? 'text-emerald-500' : 'text-red-500'}`}>
                {validationResult.isValid ? <><CheckCircle className="w-5 h-5" /><span className="font-medium">Valid UUID</span></> : <><XCircle className="w-5 h-5" /><span className="font-medium">Invalid UUID</span></>}
              </div>
              {validationResult.isValid && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-[var(--text-tertiary)]">Version:</span><span className="ml-2 accent-text">v{validationResult.version}</span></div>
                  <div><span className="text-[var(--text-tertiary)]">Variant:</span><span className="ml-2 text-[var(--text-primary)]">RFC 4122</span></div>
                  {validationResult.timestamp && <div className="col-span-2"><span className="text-[var(--text-tertiary)]">Timestamp:</span><span className="ml-2 text-[var(--text-primary)]">{validationResult.timestamp.toISOString()}</span></div>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dev Mode: Structure breakdown */}
      {devMode && currentUUID && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4"><Info className="w-4 h-4 accent-text" /><h3 className="text-sm font-medium text-[var(--text-primary)]">UUID Structure (Dev Mode)</h3></div>
          <div className="font-mono text-sm mb-4">
            {(() => {
              const parts = currentUUID.split('-')
              const colors = ['bg-blue-500/20 text-blue-400', 'bg-emerald-500/20 text-emerald-400', 'bg-amber-500/20 text-amber-400', 'bg-purple-500/20 text-purple-400', 'bg-pink-500/20 text-pink-400']
              return (
                <div className="flex flex-wrap gap-1 items-center">
                  {parts.map((part, i) => (
                    <span key={i}>
                      <span className={`px-2 py-1 rounded ${colors[i]}`}>{part}</span>
                      {i < parts.length - 1 && <span className="text-[var(--text-tertiary)] mx-0.5">-</span>}
                    </span>
                  ))}
                </div>
              )
            })()}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"><div className="text-blue-400 font-medium">time_low</div><div className="text-[var(--text-tertiary)]">32 bits</div></div>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"><div className="text-emerald-400 font-medium">time_mid</div><div className="text-[var(--text-tertiary)]">16 bits</div></div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"><div className="text-amber-400 font-medium">time_hi + version</div><div className="text-[var(--text-tertiary)]">4 + 12 bits</div></div>
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20"><div className="text-purple-400 font-medium">clock_seq + variant</div><div className="text-[var(--text-tertiary)]">2 + 14 bits</div></div>
            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 md:col-span-2"><div className="text-pink-400 font-medium">node</div><div className="text-[var(--text-tertiary)]">48 bits</div></div>
          </div>
        </div>
      )}

      {/* Dev Mode: Version comparison */}
      {devMode && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 accent-text" /><h3 className="text-sm font-medium text-[var(--text-primary)]">Version Comparison (Dev Mode)</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border-color)]"><th className="p-2">Version</th><th className="p-2">Sortable</th><th className="p-2">Has Timestamp</th><th className="p-2">Best For</th></tr></thead>
              <tbody>
                <tr className="border-b border-[var(--border-color)]"><td className="p-2 accent-text">v1</td><td className="p-2 text-amber-500">Partial</td><td className="p-2 text-emerald-500">Yes (100ns)</td><td className="p-2 text-[var(--text-secondary)]">Legacy systems</td></tr>
                <tr className="border-b border-[var(--border-color)]"><td className="p-2 accent-text">v4</td><td className="p-2 text-red-500">No</td><td className="p-2 text-red-500">No</td><td className="p-2 text-[var(--text-secondary)]">General purpose</td></tr>
                <tr><td className="p-2 accent-text">v7</td><td className="p-2 text-emerald-500">Yes</td><td className="p-2 text-emerald-500">Yes (ms)</td><td className="p-2 text-[var(--text-secondary)]">Database primary keys</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
