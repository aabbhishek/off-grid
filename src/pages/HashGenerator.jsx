import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import {
  Hash, Copy, CheckCircle, XCircle, AlertTriangle,
  FileText, Upload, RefreshCw, Info, Shield
} from 'lucide-react'

// Pure JavaScript MD5 implementation
function md5(string) {
  function md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3]
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586)
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330)
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426)
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983)
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417)
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162)
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101)
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329)
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632)
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302)
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083)
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848)
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690)
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501)
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784)
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734)
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463)
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556)
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353)
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640)
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222)
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189)
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835)
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651)
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415)
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055)
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606)
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799)
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744)
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649)
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379)
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551)
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3])
  }
  function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b) }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t) }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t) }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t) }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t) }
  function md5blk_array(a) {
    const md5blks = []
    for (let i = 0; i < 64; i += 4) md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24)
    return md5blks
  }
  function rhex(n) {
    const hex_chr = '0123456789abcdef'; let s = ''
    for (let j = 0; j < 4; j++) s += hex_chr.charAt((n >> (j * 8 + 4)) & 0x0F) + hex_chr.charAt((n >> (j * 8)) & 0x0F)
    return s
  }
  function hex(x) { return x.map(rhex).join('') }
  function add32(a, b) { return (a + b) & 0xFFFFFFFF }
  function md5_vm(data) {
    const n = data.length; let state = [1732584193, -271733879, -1732584194, 271733878]; let i
    for (i = 64; i <= n; i += 64) md5cycle(state, md5blk_array(data.slice(i - 64, i)))
    const tail = data.slice(i - 64); const padded = new Array(64).fill(0)
    for (let j = 0; j < tail.length; j++) padded[j] = tail[j]; padded[tail.length] = 0x80
    if (tail.length >= 55) { md5cycle(state, md5blk_array(padded)); padded.fill(0) }
    const bits = n * 8
    padded[56] = bits & 0xFF; padded[57] = (bits >>> 8) & 0xFF; padded[58] = (bits >>> 16) & 0xFF; padded[59] = (bits >>> 24) & 0xFF
    md5cycle(state, md5blk_array(padded)); return hex(state)
  }
  return md5_vm(Array.from(new TextEncoder().encode(string)))
}

async function hashWithCrypto(algorithm, data) {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const algorithms = [
  { id: 'md5', name: 'MD5', bits: 128, status: 'broken', statusColor: 'text-red-500', color: 'from-red-500 to-orange-500', compute: (data) => Promise.resolve(md5(data)) },
  { id: 'sha1', name: 'SHA-1', bits: 160, status: 'deprecated', statusColor: 'text-amber-500', color: 'from-amber-500 to-yellow-500', compute: (data) => hashWithCrypto('SHA-1', data) },
  { id: 'sha256', name: 'SHA-256', bits: 256, status: 'secure', statusColor: 'text-emerald-500', color: 'from-emerald-500 to-teal-500', compute: (data) => hashWithCrypto('SHA-256', data) },
  { id: 'sha384', name: 'SHA-384', bits: 384, status: 'secure', statusColor: 'text-emerald-500', color: 'from-cyan-500 to-blue-500', compute: (data) => hashWithCrypto('SHA-384', data) },
  { id: 'sha512', name: 'SHA-512', bits: 512, status: 'secure', statusColor: 'text-emerald-500', color: 'from-blue-500 to-indigo-500', compute: (data) => hashWithCrypto('SHA-512', data) }
]

export default function HashGenerator() {
  const { devMode, copyToClipboard, showToast } = useApp()
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState({})
  const [compareHash, setCompareHash] = useState('')
  const [matchResult, setMatchResult] = useState(null)
  const [outputFormat, setOutputFormat] = useState('lowercase')
  const [mode, setMode] = useState('text')
  const [file, setFile] = useState(null)
  const [isHashing, setIsHashing] = useState(false)
  const [hashTimes, setHashTimes] = useState({})

  useEffect(() => {
    if (!input && mode === 'text') { setHashes({}); setHashTimes({}); return }
    if (mode === 'text') computeAllHashes(input)
  }, [input, mode])

  const computeAllHashes = async (data) => {
    setIsHashing(true)
    const results = {}, times = {}
    for (const algo of algorithms) {
      try {
        const start = performance.now()
        results[algo.id] = await algo.compute(data)
        times[algo.id] = performance.now() - start
      } catch (e) { results[algo.id] = 'Error: ' + e.message }
    }
    setHashes(results); setHashTimes(times); setIsHashing(false)
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile); setIsHashing(true)
    const reader = new FileReader()
    reader.onload = async (event) => { await computeAllHashes(event.target.result) }
    reader.readAsText(selectedFile)
  }

  const formatHash = (hash) => {
    if (!hash || hash.startsWith('Error')) return hash
    switch (outputFormat) {
      case 'uppercase': return hash.toUpperCase()
      case 'base64': const bytes = hash.match(/.{2}/g)?.map(b => parseInt(b, 16)) || []; return btoa(String.fromCharCode(...bytes))
      default: return hash
    }
  }

  useEffect(() => {
    if (!compareHash.trim()) { setMatchResult(null); return }
    const normalizedCompare = compareHash.toLowerCase().replace(/[^a-f0-9]/g, '')
    let found = null
    for (const [id, hash] of Object.entries(hashes)) {
      if (hash && !hash.startsWith('Error') && hash.toLowerCase() === normalizedCompare) { found = id; break }
    }
    setMatchResult(found)
  }, [compareHash, hashes])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500">
          <Hash className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">Hash Generator</h1>
          <p className="text-sm text-[var(--text-secondary)]">Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex gap-4">
          <button onClick={() => setMode('text')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${mode === 'text' ? 'glass-button-primary' : 'text-[var(--text-secondary)]'}`}>
            <FileText className="w-4 h-4" />Text Input
          </button>
          <button onClick={() => setMode('file')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${mode === 'file' ? 'glass-button-primary' : 'text-[var(--text-secondary)]'}`}>
            <Upload className="w-4 h-4" />File Input
          </button>
        </div>
      </div>

      {/* Input section */}
      <div className="glass-card rounded-2xl p-6">
        {mode === 'text' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-[var(--text-primary)]">Input Text</label>
              <button onClick={() => setInput('')} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Clear</button>
            </div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter text to hash..." className="glass-input min-h-[150px] resize-y font-mono text-sm" />
            <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2">
              <span>{input.length} characters</span>
              <span>{new TextEncoder().encode(input).length} bytes</span>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <input type="file" onChange={handleFileChange} className="hidden" id="file-input" />
            <label htmlFor="file-input" className="cursor-pointer inline-flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent)] transition-colors">
              <Upload className="w-12 h-12 text-[var(--text-tertiary)]" />
              <span className="text-[var(--text-secondary)]">Click to select a file or drag and drop</span>
            </label>
            {file && <div className="mt-4 text-sm text-[var(--text-secondary)]">Selected: <span className="accent-text">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)</div>}
          </div>
        )}
      </div>

      {/* Output format selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--text-tertiary)]">Output format:</span>
          <div className="flex rounded-xl overflow-hidden border border-[var(--border-color)]">
            {['lowercase', 'uppercase', 'base64'].map(fmt => (
              <button key={fmt} onClick={() => setOutputFormat(fmt)} className={`px-3 py-1.5 text-xs ${outputFormat === fmt ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)]'}`}>
                {fmt === 'lowercase' ? 'lowercase' : fmt === 'uppercase' ? 'UPPERCASE' : 'Base64'}
              </button>
            ))}
          </div>
        </div>
        {isHashing && <div className="flex items-center gap-2 accent-text text-sm"><RefreshCw className="w-4 h-4 animate-spin" />Computing...</div>}
      </div>

      {/* Hash results */}
      <div className="space-y-3">
        {algorithms.map((algo) => {
          const hash = hashes[algo.id]
          const formattedHash = formatHash(hash)
          const isMatch = matchResult === algo.id

          return (
            <motion.div key={algo.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`glass-card rounded-2xl p-4 ${isMatch ? 'ring-2 ring-emerald-500' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${algo.color}`}>
                    <Hash className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">{algo.name}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">{algo.bits} bits</span>
                  <span className={`text-xs flex items-center gap-1 ${algo.statusColor}`}>
                    {algo.status === 'broken' && <AlertTriangle className="w-3 h-3" />}{algo.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {devMode && hashTimes[algo.id] && <span className="text-xs text-[var(--text-tertiary)]">{hashTimes[algo.id].toFixed(2)}ms</span>}
                  {hash && !hash.startsWith('Error') && <button onClick={() => copyToClipboard(formattedHash)} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><Copy className="w-4 h-4" /></button>}
                </div>
              </div>
              {hash ? <code className={`block text-xs break-all font-mono ${hash.startsWith('Error') ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>{formattedHash}</code> : <code className="block text-xs text-[var(--text-tertiary)] font-mono">Enter text to generate hash</code>}
              {isMatch && <div className="mt-2 flex items-center gap-2 text-emerald-500 text-sm"><CheckCircle className="w-4 h-4" />Hash matches!</div>}
            </motion.div>
          )
        })}
      </div>

      {/* Hash comparison */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4"><Shield className="w-4 h-4 accent-text" /><label className="text-sm font-medium text-[var(--text-primary)]">Compare Hash</label></div>
        <input type="text" value={compareHash} onChange={(e) => setCompareHash(e.target.value)} placeholder="Paste a hash to compare..." className="glass-input font-mono text-sm" />
        {compareHash && (
          <div className={`mt-3 flex items-center gap-2 ${matchResult ? 'text-emerald-500' : 'text-red-500'}`}>
            {matchResult ? <><CheckCircle className="w-4 h-4" /><span>Matches {algorithms.find(a => a.id === matchResult)?.name}!</span></> : <><XCircle className="w-4 h-4" /><span>No match found</span></>}
          </div>
        )}
      </div>

      {/* Dev Mode: Algorithm comparison */}
      {devMode && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4"><Info className="w-4 h-4 accent-text" /><h3 className="text-sm font-medium text-[var(--text-primary)]">Algorithm Comparison (Dev Mode)</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border-color)]"><th className="p-2">Algorithm</th><th className="p-2">Output Size</th><th className="p-2">Block Size</th><th className="p-2">Status</th></tr></thead>
              <tbody>
                <tr className="border-b border-[var(--border-color)]"><td className="p-2 accent-text">MD5</td><td className="p-2 text-[var(--text-secondary)]">128 bits</td><td className="p-2 text-[var(--text-secondary)]">512 bits</td><td className="p-2 text-red-500">Broken</td></tr>
                <tr className="border-b border-[var(--border-color)]"><td className="p-2 accent-text">SHA-1</td><td className="p-2 text-[var(--text-secondary)]">160 bits</td><td className="p-2 text-[var(--text-secondary)]">512 bits</td><td className="p-2 text-amber-500">Deprecated</td></tr>
                <tr className="border-b border-[var(--border-color)]"><td className="p-2 accent-text">SHA-256</td><td className="p-2 text-[var(--text-secondary)]">256 bits</td><td className="p-2 text-[var(--text-secondary)]">512 bits</td><td className="p-2 text-emerald-500">Secure</td></tr>
                <tr className="border-b border-[var(--border-color)]"><td className="p-2 accent-text">SHA-384</td><td className="p-2 text-[var(--text-secondary)]">384 bits</td><td className="p-2 text-[var(--text-secondary)]">1024 bits</td><td className="p-2 text-emerald-500">Secure</td></tr>
                <tr><td className="p-2 accent-text">SHA-512</td><td className="p-2 text-[var(--text-secondary)]">512 bits</td><td className="p-2 text-[var(--text-secondary)]">1024 bits</td><td className="p-2 text-emerald-500">Secure</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
