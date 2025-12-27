import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import {
  Braces, Copy, Download, ChevronRight, ChevronDown,
  Minimize2, Maximize2, GitCompare, Search, Filter,
  RefreshCw, FileJson, AlertTriangle, CheckCircle,
  TreePine
} from 'lucide-react'

// Format JSON with syntax highlighting
function formatJSON(obj, indent = 2) {
  return JSON.stringify(obj, null, indent)
}

// Syntax highlight JSON string
function highlightJSON(jsonStr) {
  return jsonStr
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="highlight-key">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="highlight-string">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="highlight-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="highlight-boolean">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="highlight-null">$1</span>')
    .replace(/([{}\[\]])/g, '<span class="highlight-bracket">$1</span>')
}

// Calculate JSON stats
function getJSONStats(obj, depth = 0) {
  const stats = {
    maxDepth: depth,
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    keys: 0
  }

  function traverse(value, currentDepth) {
    stats.maxDepth = Math.max(stats.maxDepth, currentDepth)

    if (value === null) {
      stats.nulls++
    } else if (Array.isArray(value)) {
      stats.arrays++
      value.forEach(item => traverse(item, currentDepth + 1))
    } else if (typeof value === 'object') {
      stats.objects++
      stats.keys += Object.keys(value).length
      Object.values(value).forEach(v => traverse(v, currentDepth + 1))
    } else if (typeof value === 'string') {
      stats.strings++
    } else if (typeof value === 'number') {
      stats.numbers++
    } else if (typeof value === 'boolean') {
      stats.booleans++
    }
  }

  traverse(obj, depth)
  return stats
}

// Simple path query
function queryJSON(obj, path) {
  if (!path || path === '.') return obj
  
  const parts = path
    .replace(/^\.*/, '')
    .split(/\.|\[|\]/)
    .filter(Boolean)

  let result = obj
  for (const part of parts) {
    if (result === null || result === undefined) return undefined
    
    if (part === '*') {
      if (Array.isArray(result)) {
        return result
      } else if (typeof result === 'object') {
        return Object.values(result)
      }
      return undefined
    }

    result = result[part]
  }
  return result
}

// Tree Node component
function TreeNode({ name, value, path, depth = 0, onSelect, selectedPath }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isObject = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)
  const isSelected = selectedPath === path

  const getTypeIcon = () => {
    if (value === null) return '∅'
    if (isArray) return `[${value.length}]`
    if (isObject) return `{${Object.keys(value).length}}`
    if (typeof value === 'string') return '"'
    if (typeof value === 'number') return '#'
    if (typeof value === 'boolean') return '⊤'
    return '?'
  }

  const getTypeColor = () => {
    if (value === null) return 'text-gray-500'
    if (isArray) return 'text-purple-500'
    if (isObject) return 'text-blue-500'
    if (typeof value === 'string') return 'text-emerald-500'
    if (typeof value === 'number') return 'text-orange-500'
    if (typeof value === 'boolean') return 'text-cyan-500'
    return 'text-gray-400'
  }

  return (
    <div className="select-none">
      <div
        className={`tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(path, value)}
      >
        {isObject ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="w-4 h-4 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {name !== undefined && (
          <span className="accent-text text-sm">{name}</span>
        )}

        {name !== undefined && <span className="text-[var(--text-tertiary)] mx-1">:</span>}

        <span className={`text-xs ${getTypeColor()}`}>{getTypeIcon()}</span>

        {!isObject && (
          <span className={`text-sm ml-2 truncate max-w-xs ${getTypeColor()}`}>
            {typeof value === 'string' ? `"${value}"` : String(value)}
          </span>
        )}
      </div>

      <AnimatePresence>
        {expanded && isObject && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {(isArray ? value : Object.entries(value)).map((item, index) => {
              const [key, val] = isArray ? [index, item] : item
              const childPath = `${path}${isArray ? `[${key}]` : `.${key}`}`
              return (
                <TreeNode
                  key={key}
                  name={isArray ? index : key}
                  value={val}
                  path={childPath}
                  depth={depth + 1}
                  onSelect={onSelect}
                  selectedPath={selectedPath}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Tab button component
function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`tab-button flex items-center gap-2 ${active ? 'active' : ''}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

export default function JSONFormatter() {
  const { devMode, copyToClipboard, showToast } = useApp()
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState(null)
  const [indent, setIndent] = useState(2)
  const [viewMode, setViewMode] = useState('formatted')
  const [tab, setTab] = useState('format')
  const [selectedPath, setSelectedPath] = useState('')
  const [selectedValue, setSelectedValue] = useState(null)
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [diffInput1, setDiffInput1] = useState('')
  const [diffInput2, setDiffInput2] = useState('')

  // Parse JSON
  useEffect(() => {
    if (!input.trim()) {
      setParsed(null)
      setError(null)
      return
    }

    try {
      const result = JSON.parse(input)
      setParsed(result)
      setError(null)
    } catch (e) {
      setParsed(null)
      const match = e.message.match(/position (\d+)/)
      if (match) {
        const pos = parseInt(match[1])
        const lines = input.substring(0, pos).split('\n')
        const line = lines.length
        const col = lines[lines.length - 1].length + 1
        setError(`${e.message} (line ${line}, col ${col})`)
      } else {
        setError(e.message)
      }
    }
  }, [input])

  // Query execution
  useEffect(() => {
    if (!parsed || !query) {
      setQueryResult(null)
      return
    }

    try {
      const result = queryJSON(parsed, query)
      setQueryResult({ success: true, data: result })
    } catch (e) {
      setQueryResult({ success: false, error: e.message })
    }
  }, [parsed, query])

  const stats = useMemo(() => {
    if (!parsed) return null
    return getJSONStats(parsed)
  }, [parsed])

  const formatted = useMemo(() => {
    if (!parsed) return ''
    return formatJSON(parsed, indent)
  }, [parsed, indent])

  const minified = useMemo(() => {
    if (!parsed) return ''
    return JSON.stringify(parsed)
  }, [parsed])

  const handleNodeSelect = (path, value) => {
    setSelectedPath(path)
    setSelectedValue(value)
  }

  const downloadJSON = (content, filename) => {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'data.json'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded!')
  }

  const getDiff = () => {
    try {
      const obj1 = JSON.parse(diffInput1)
      const obj2 = JSON.parse(diffInput2)
      return findDifferences(obj1, obj2)
    } catch {
      return null
    }
  }

  function findDifferences(obj1, obj2, path = '') {
    const diffs = []
    const keys1 = new Set(Object.keys(obj1 || {}))
    const keys2 = new Set(Object.keys(obj2 || {}))
    const allKeys = new Set([...keys1, ...keys2])

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key
      const val1 = obj1?.[key]
      const val2 = obj2?.[key]

      if (!keys1.has(key)) {
        diffs.push({ type: 'added', path: currentPath, value: val2 })
      } else if (!keys2.has(key)) {
        diffs.push({ type: 'removed', path: currentPath, value: val1 })
      } else if (typeof val1 !== typeof val2) {
        diffs.push({ type: 'changed', path: currentPath, old: val1, new: val2 })
      } else if (typeof val1 === 'object' && val1 !== null) {
        diffs.push(...findDifferences(val1, val2, currentPath))
      } else if (val1 !== val2) {
        diffs.push({ type: 'changed', path: currentPath, old: val1, new: val2 })
      }
    }

    return diffs
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
          <Braces className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">JSON Formatter</h1>
          <p className="text-sm text-[var(--text-secondary)]">Format, validate, query and compare JSON</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-color)] pb-px">
        <TabButton active={tab === 'format'} onClick={() => setTab('format')} icon={FileJson}>Format</TabButton>
        <TabButton active={tab === 'query'} onClick={() => setTab('query')} icon={Filter}>Query</TabButton>
        <TabButton active={tab === 'diff'} onClick={() => setTab('diff')} icon={GitCompare}>Diff</TabButton>
      </div>

      {/* Format Tab */}
      {tab === 'format' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-primary)]">Input JSON</label>
              <button onClick={() => setInput('')} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Clear</button>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"key": "value", "array": [1, 2, 3]}'
              className="glass-input min-h-[400px] resize-y font-mono text-xs"
            />

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

            {stats && (
              <div className="flex flex-wrap gap-4 text-xs text-[var(--text-tertiary)]">
                <span>Depth: {stats.maxDepth}</span>
                <span>Objects: {stats.objects}</span>
                <span>Arrays: {stats.arrays}</span>
                <span>Keys: {stats.keys}</span>
              </div>
            )}
          </div>

          {/* Output */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Output</label>
                {parsed && <span className="status-valid text-xs py-0.5"><CheckCircle className="w-3 h-3" />Valid</span>}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
                  <button onClick={() => setViewMode('formatted')} className={`px-2 py-1 text-xs ${viewMode === 'formatted' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)]'}`}><Maximize2 className="w-3 h-3" /></button>
                  <button onClick={() => setViewMode('tree')} className={`px-2 py-1 text-xs ${viewMode === 'tree' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)]'}`}><TreePine className="w-3 h-3" /></button>
                  <button onClick={() => setViewMode('minified')} className={`px-2 py-1 text-xs ${viewMode === 'minified' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)]'}`}><Minimize2 className="w-3 h-3" /></button>
                </div>

                {viewMode === 'formatted' && (
                  <select value={indent} onChange={(e) => setIndent(Number(e.target.value))} className="glass-input px-2 py-1 text-xs w-24">
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                  </select>
                )}
              </div>
            </div>

            <div className="min-h-[400px] max-h-[600px] overflow-auto">
              {viewMode === 'tree' && parsed ? (
                <div className="p-2"><TreeNode value={parsed} path="" onSelect={handleNodeSelect} selectedPath={selectedPath} /></div>
              ) : viewMode === 'minified' && parsed ? (
                <pre className="code-block whitespace-pre-wrap break-all text-xs">{minified}</pre>
              ) : parsed ? (
                <pre className="code-block whitespace-pre-wrap text-xs" dangerouslySetInnerHTML={{ __html: highlightJSON(formatted) }} />
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-tertiary)]">Enter valid JSON to format</div>
              )}
            </div>

            {viewMode === 'tree' && selectedPath && (
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-xs accent-text mb-2">Path: {selectedPath || '(root)'}</div>
                <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">{JSON.stringify(selectedValue, null, 2)}</pre>
              </div>
            )}

            {parsed && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => copyToClipboard(viewMode === 'minified' ? minified : formatted)} className="glass-button text-xs py-2"><Copy className="w-3 h-3" />Copy</button>
                <button onClick={() => downloadJSON(formatted, 'data.json')} className="glass-button text-xs py-2"><Download className="w-3 h-3" />Download</button>
              </div>
            )}

            {parsed && devMode && (
              <div className="text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-color)]">
                <span>Formatted: {formatted.length} bytes</span>
                <span className="mx-2">|</span>
                <span>Minified: {minified.length} bytes</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Query Tab */}
      {tab === 'query' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <Search className="w-5 h-5 accent-text" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter path query (e.g., .users[0].name)" className="glass-input flex-1" />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setQuery('.')} className="badge cursor-pointer hover:opacity-80">root</button>
              <button onClick={() => setQuery('.*')} className="badge cursor-pointer hover:opacity-80">all keys</button>
            </div>

            {queryResult && (
              <div className="code-block">
                {queryResult.success ? (
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(queryResult.data, null, 2)}</pre>
                ) : (
                  <div className="text-red-500 text-sm">{queryResult.error}</div>
                )}
              </div>
            )}

            {!parsed && <div className="text-center py-8 text-[var(--text-tertiary)]">Enter JSON in the Format tab first</div>}
          </div>
        </div>
      )}

      {/* Diff Tab */}
      {tab === 'diff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <label className="text-sm font-medium text-[var(--text-primary)] mb-4 block">Original JSON</label>
              <textarea value={diffInput1} onChange={(e) => setDiffInput1(e.target.value)} placeholder='{"key": "original"}' className="glass-input min-h-[200px] resize-y font-mono text-xs" />
            </div>

            <div className="glass-card rounded-2xl p-6">
              <label className="text-sm font-medium text-[var(--text-primary)] mb-4 block">Modified JSON</label>
              <textarea value={diffInput2} onChange={(e) => setDiffInput2(e.target.value)} placeholder='{"key": "modified"}' className="glass-input min-h-[200px] resize-y font-mono text-xs" />
            </div>
          </div>

          {diffInput1 && diffInput2 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Differences</h3>
              {(() => {
                const diffs = getDiff()
                if (!diffs) return <div className="text-red-500 text-sm">Invalid JSON in one or both inputs</div>
                if (diffs.length === 0) return <div className="flex items-center gap-2 text-emerald-500"><CheckCircle className="w-4 h-4" />No differences found</div>
                return (
                  <div className="space-y-2">
                    {diffs.map((diff, i) => (
                      <div key={i} className={`p-3 rounded-xl text-sm ${diff.type === 'added' ? 'bg-emerald-500/10 border border-emerald-500/20' : diff.type === 'removed' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium uppercase ${diff.type === 'added' ? 'text-emerald-500' : diff.type === 'removed' ? 'text-red-500' : 'text-amber-500'}`}>{diff.type}</span>
                          <code className="text-[var(--text-primary)]">{diff.path}</code>
                        </div>
                        {diff.type === 'changed' ? (
                          <div className="text-xs space-y-1">
                            <div><span className="text-red-500">-</span> {JSON.stringify(diff.old)}</div>
                            <div><span className="text-emerald-500">+</span> {JSON.stringify(diff.new)}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--text-secondary)]">{JSON.stringify(diff.value)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Dev Mode: Schema inference */}
      {devMode && parsed && tab === 'format' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-4 h-4 accent-text" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Inferred TypeScript Interface (Dev Mode)</h3>
          </div>
          <pre className="code-block text-xs">{inferTypeScript(parsed)}</pre>
          <button onClick={() => copyToClipboard(inferTypeScript(parsed))} className="glass-button text-xs py-2 mt-4"><Copy className="w-3 h-3" />Copy Interface</button>
        </div>
      )}
    </motion.div>
  )
}

function inferTypeScript(obj, name = 'Root', indent = 0) {
  const spaces = '  '.repeat(indent)
  if (obj === null) return 'null'
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 'unknown[]'
    const itemType = inferTypeScript(obj[0], name + 'Item', indent)
    return itemType.includes('\n') ? `Array<${itemType}>` : `${itemType}[]`
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj)
    if (entries.length === 0) return 'Record<string, unknown>'
    const lines = entries.map(([key, value]) => {
      const type = inferTypeScript(value, key, indent + 1)
      return `${spaces}  ${key}: ${type};`
    })
    return `{\n${lines.join('\n')}\n${spaces}}`
  }
  if (typeof obj === 'string') return 'string'
  if (typeof obj === 'number') return 'number'
  if (typeof obj === 'boolean') return 'boolean'
  return 'unknown'
}
