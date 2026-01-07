import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import {
  Braces, Copy, Download, ChevronRight, ChevronDown,
  Minimize2, Maximize2, GitCompare, Search, Filter,
  RefreshCw, FileJson, AlertTriangle, CheckCircle,
  TreePine, Upload, Link, Database, Table2, BarChart3,
  Network, X, ArrowUpDown, ChevronLeft, ChevronsLeft,
  ChevronsRight, FileDown, PieChart, LineChart,
  LayoutGrid, ZoomIn, ZoomOut, Move, Info, Plus, Trash2,
  Settings2, Radar, Activity, TrendingUp, Layers, Code, Play
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart as ReLineChart, Line,
  PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, RadarChart, Radar as RadarComponent, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, Treemap,
  ComposedChart, Scatter
} from 'recharts'

// Theme colors for charts
const CHART_COLORS = [
  '#10b981', // emerald
  '#f472b6', // pink
  '#a78bfa', // purple
  '#60a5fa', // blue
  '#fbbf24', // amber
  '#f87171', // red
  '#22d3ee', // cyan
  '#84cc16', // lime
  '#fb923c', // orange
  '#e879f9', // fuchsia
]

// Sample JSON data for quick testing
const SAMPLE_DATA = {
  nested: {
    users: [
      { id: 1, name: "John Doe", email: "john@example.com", age: 30, active: true, score: 85 },
      { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25, active: false, score: 92 },
      { id: 3, name: "Bob Wilson", email: "bob@example.com", age: 35, active: true, score: 78 }
    ],
    metadata: { total: 3, page: 1, perPage: 10 }
  },
  array: [
    { product: "Laptop", sales: 120, revenue: 120000, profit: 24000, month: "Jan" },
    { product: "Phone", sales: 250, revenue: 87500, profit: 17500, month: "Feb" },
    { product: "Tablet", sales: 80, revenue: 32000, profit: 8000, month: "Mar" },
    { product: "Watch", sales: 150, revenue: 45000, profit: 13500, month: "Apr" },
    { product: "Headphones", sales: 200, revenue: 30000, profit: 9000, month: "May" }
  ],
  simple: {
    totalUsers: 1250,
    activeUsers: 890,
    newUsers: 156,
    churned: 45,
    revenue: 125000,
    expenses: 78000,
    profit: 47000,
    growth: 12.5
  },
  config: {
    database: { host: "localhost", port: 5432, name: "mydb" },
    cache: { enabled: true, ttl: 3600 },
    features: ["auth", "api", "webhooks"]
  }
}

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

// Detect if data is suitable for table view
function detectTableData(obj) {
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
    const keys = new Set()
    let isConsistent = true
    obj.forEach(item => {
      if (typeof item !== 'object' || item === null) {
        isConsistent = false
      } else {
        Object.keys(item).forEach(k => keys.add(k))
      }
    })
    if (isConsistent && keys.size > 0) {
      return { suitable: true, columns: Array.from(keys), rows: obj }
    }
  }
  return { suitable: false }
}

// Detect chartable data from arrays
function detectArrayChartData(obj) {
  const tableData = detectTableData(obj)
  if (!tableData.suitable) return { suitable: false }
  
  const numericColumns = tableData.columns.filter(col => 
    tableData.rows.some(row => typeof row[col] === 'number')
  )
  const stringColumns = tableData.columns.filter(col =>
    tableData.rows.some(row => typeof row[col] === 'string')
  )
  
  if (numericColumns.length > 0) {
    return {
      suitable: true,
      type: 'array',
      numericColumns,
      stringColumns,
      rows: tableData.rows
    }
  }
  return { suitable: false }
}

// Detect chartable data from simple objects (key-value pairs)
function detectObjectChartData(obj) {
  if (obj === null || Array.isArray(obj) || typeof obj !== 'object') {
    return { suitable: false }
  }
  
  const entries = Object.entries(obj)
  const numericEntries = entries.filter(([, v]) => typeof v === 'number')
  
  if (numericEntries.length >= 2) {
    return {
      suitable: true,
      type: 'object',
      data: numericEntries.map(([key, value]) => ({ name: key, value })),
      total: numericEntries.reduce((sum, [, v]) => sum + v, 0)
    }
  }
  return { suitable: false }
}

// Find all chartable paths in JSON
function findChartablePaths(obj, currentPath = '') {
  const paths = []
  
  if (obj === null || typeof obj !== 'object') return paths
  
  // Check current level
  const arrayData = detectArrayChartData(obj)
  if (arrayData.suitable) {
    paths.push({ path: currentPath || 'root', type: 'array', data: arrayData })
  }
  
  const objectData = detectObjectChartData(obj)
  if (objectData.suitable) {
    paths.push({ path: currentPath || 'root', type: 'object', data: objectData })
  }
  
  // Recurse into children
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      paths.push(...findChartablePaths(item, `${currentPath}[${i}]`))
    })
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key
      paths.push(...findChartablePaths(value, newPath))
    })
  }
  
  return paths
}

// Tree Node component
function TreeNode({ name, value, path, depth = 0, onSelect, selectedPath, searchTerm }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isObject = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)
  const isSelected = selectedPath === path
  
  const matchesSearch = searchTerm && (
    String(name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (!isObject && String(value).toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    if (searchTerm && matchesSearch) {
      setExpanded(true)
    }
  }, [searchTerm, matchesSearch])

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
        className={`tree-item ${isSelected ? 'selected' : ''} ${matchesSearch ? 'bg-yellow-500/20 rounded' : ''}`}
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
                  searchTerm={searchTerm}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Table View Component
function TableView({ data, onExport }) {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterText, setFilterText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState([])
  
  const tableData = useMemo(() => detectTableData(data), [data])
  
  useEffect(() => {
    if (tableData.suitable) {
      setVisibleColumns(tableData.columns)
    }
  }, [tableData.columns?.join(',')])
  
  const filteredAndSortedRows = useMemo(() => {
    if (!tableData.suitable) return []
    
    let rows = [...tableData.rows]
    
    if (filterText) {
      rows = rows.filter(row => 
        Object.values(row).some(v => 
          String(v).toLowerCase().includes(filterText.toLowerCase())
        )
      )
    }
    
    if (sortColumn) {
      rows.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        const comparison = aVal < bVal ? -1 : 1
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }
    
    return rows
  }, [tableData.rows, filterText, sortColumn, sortDirection])
  
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAndSortedRows.slice(start, start + pageSize)
  }, [filteredAndSortedRows, page, pageSize])
  
  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize)
  
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  const exportCSV = () => {
    const headers = visibleColumns.join(',')
    const rows = filteredAndSortedRows.map(row => 
      visibleColumns.map(col => {
        const val = row[col]
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val ?? ''
      }).join(',')
    )
    const csv = [headers, ...rows].join('\n')
    onExport(csv, 'data.csv', 'text/csv')
  }
  
  if (!tableData.suitable) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--text-tertiary)]">
        <Table2 className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">Data is not suitable for table view</p>
        <p className="text-xs mt-1">Table view requires an array of objects</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => { setFilterText(e.target.value); setPage(1) }}
            placeholder="Filter rows..."
            className="glass-input pl-9 text-sm w-full"
          />
        </div>
        
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
          className="glass-input text-xs px-3 py-2"
        >
          <option value={10}>10 rows</option>
          <option value={25}>25 rows</option>
          <option value={50}>50 rows</option>
          <option value={100}>100 rows</option>
        </select>
        
        <button onClick={exportCSV} className="glass-button text-xs py-2">
          <FileDown className="w-3 h-3" />
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              {visibleColumns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{col}</span>
                    {sortColumn === col && (
                      <ArrowUpDown className={`w-3 h-3 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, i) => (
              <tr key={i} className="border-t border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]/50">
                {visibleColumns.map(col => (
                  <td key={col} className="px-4 py-3 text-[var(--text-primary)]">
                    {renderCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <span>
          Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, filteredAndSortedRows.length)} of {filteredAndSortedRows.length}
        </span>
        
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3">Page {page} of {totalPages || 1}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function renderCellValue(value) {
  if (value === null) return <span className="text-gray-500 italic">null</span>
  if (value === undefined) return <span className="text-gray-500 italic">—</span>
  if (typeof value === 'boolean') {
    return value ? 
      <span className="text-emerald-400">✓</span> : 
      <span className="text-red-400">✗</span>
  }
  if (typeof value === 'number') {
    return <span className="text-orange-400 font-mono">{value.toLocaleString()}</span>
  }
  if (typeof value === 'object') {
    return (
      <span className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs">
        {Array.isArray(value) ? `[${value.length}]` : `{${Object.keys(value).length}}`}
      </span>
    )
  }
  return <span className="truncate max-w-xs block">{String(value)}</span>
}

// Custom tooltip for Recharts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

// Chart View Component with Recharts
function ChartView({ data }) {
  const [chartType, setChartType] = useState('bar')
  const [xAxis, setXAxis] = useState('')
  const [yAxes, setYAxes] = useState([])
  const [innerRadius, setInnerRadius] = useState(60)
  
  const arrayChartData = useMemo(() => detectArrayChartData(data), [data])
  const objectChartData = useMemo(() => detectObjectChartData(data), [data])
  
  const isArrayData = arrayChartData.suitable
  const isObjectData = objectChartData.suitable
  
  useEffect(() => {
    if (isArrayData) {
      if (!xAxis && arrayChartData.stringColumns.length > 0) {
        setXAxis(arrayChartData.stringColumns[0])
      }
      if (yAxes.length === 0 && arrayChartData.numericColumns.length > 0) {
        setYAxes([arrayChartData.numericColumns[0]])
      }
    }
  }, [arrayChartData, isArrayData])
  
  const chartData = useMemo(() => {
    if (isArrayData) {
      return arrayChartData.rows
    }
    if (isObjectData) {
      return objectChartData.data
    }
    return []
  }, [isArrayData, isObjectData, arrayChartData, objectChartData])
  
  const addYAxis = (col) => {
    if (!yAxes.includes(col)) {
      setYAxes([...yAxes, col])
    }
  }
  
  const removeYAxis = (col) => {
    setYAxes(yAxes.filter(y => y !== col))
  }
  
  if (!isArrayData && !isObjectData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--text-tertiary)]">
        <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">Data is not suitable for charts</p>
        <p className="text-xs mt-1">Charts require numeric values</p>
      </div>
    )
  }
  
  const chartTypes = isArrayData ? [
    { id: 'bar', icon: BarChart3, label: 'Bar' },
    { id: 'line', icon: LineChart, label: 'Line' },
    { id: 'area', icon: TrendingUp, label: 'Area' },
    { id: 'composed', icon: Activity, label: 'Composed' },
    { id: 'radar', icon: Radar, label: 'Radar' },
  ] : [
    { id: 'doughnut', icon: PieChart, label: 'Doughnut' },
    { id: 'pie', icon: PieChart, label: 'Pie' },
    { id: 'bar', icon: BarChart3, label: 'Bar' },
    { id: 'treemap', icon: Layers, label: 'Treemap' },
  ]
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
          {chartTypes.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setChartType(id)}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${
                chartType === id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        
        {isArrayData && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] font-medium">X Axis:</span>
              <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} className="glass-input text-xs px-3 py-2">
                <option value="">Select field</option>
                {arrayChartData.stringColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--text-secondary)] font-medium">Y Axis:</span>
              <select onChange={(e) => e.target.value && addYAxis(e.target.value)} value="" className="glass-input text-xs px-3 py-2">
                <option value="">+ Add field</option>
                {arrayChartData.numericColumns.filter(c => !yAxes.includes(c)).map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              
              {yAxes.map((y, i) => (
                <span key={y} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '30', color: CHART_COLORS[i % CHART_COLORS.length] }}>
                  {y}
                  <button onClick={() => removeYAxis(y)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
        
        {(chartType === 'doughnut' || chartType === 'pie') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">Inner Radius:</span>
            <input
              type="range"
              min="0"
              max="80"
              value={innerRadius}
              onChange={(e) => setInnerRadius(Number(e.target.value))}
              className="w-24 accent-[var(--accent)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">{innerRadius}%</span>
          </div>
        )}
      </div>
      
      {/* Chart */}
      <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 min-h-[350px]">
        <ResponsiveContainer width="100%" height={350}>
          {/* Array-based charts */}
          {isArrayData && chartType === 'bar' && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey={xAxis} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {yAxes.map((y, i) => (
                <Bar key={y} dataKey={y} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
          
          {isArrayData && chartType === 'line' && (
            <ReLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey={xAxis} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {yAxes.map((y, i) => (
                <Line key={y} type="monotone" dataKey={y} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ fill: CHART_COLORS[i % CHART_COLORS.length] }} />
              ))}
            </ReLineChart>
          )}
          
          {isArrayData && chartType === 'area' && (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey={xAxis} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {yAxes.map((y, i) => (
                <Area key={y} type="monotone" dataKey={y} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.3} />
              ))}
            </AreaChart>
          )}
          
          {isArrayData && chartType === 'composed' && (
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey={xAxis} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {yAxes.map((y, i) => {
                if (i % 3 === 0) return <Bar key={y} dataKey={y} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                if (i % 3 === 1) return <Line key={y} type="monotone" dataKey={y} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} />
                return <Area key={y} type="monotone" dataKey={y} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.3} />
              })}
            </ComposedChart>
          )}
          
          {isArrayData && chartType === 'radar' && (
            <RadarChart data={chartData}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis dataKey={xAxis} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {yAxes.map((y, i) => (
                <RadarComponent key={y} name={y} dataKey={y} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.3} />
              ))}
            </RadarChart>
          )}
          
          {/* Object-based charts */}
          {isObjectData && (chartType === 'doughnut' || chartType === 'pie') && (
            <RePieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={chartType === 'doughnut' ? `${innerRadius}%` : 0}
                outerRadius="80%"
                paddingAngle={2}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'var(--text-tertiary)' }}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RePieChart>
          )}
          
          {isObjectData && chartType === 'bar' && (
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
          
          {isObjectData && chartType === 'treemap' && (
            <Treemap
              data={chartData}
              dataKey="value"
              nameKey="name"
              aspectRatio={4 / 3}
              stroke="var(--bg-primary)"
              content={({ x, y, width, height, name, value, index }) => (
                <g>
                  <rect x={x} y={y} width={width} height={height} fill={CHART_COLORS[index % CHART_COLORS.length]} rx={4} />
                  {width > 50 && height > 30 && (
                    <>
                      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="white" fontSize={11} fontWeight="500">
                        {name}
                      </text>
                      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="white" fontSize={10} opacity={0.8}>
                        {value?.toLocaleString()}
                      </text>
                    </>
                  )}
                </g>
              )}
            />
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Legend for object data */}
      {isObjectData && (
        <div className="flex flex-wrap gap-4 justify-center text-xs">
          {chartData.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-[var(--text-secondary)]">{item.name}: {item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Sample transform functions
const TRANSFORM_TEMPLATES = {
  identity: `// Return data as-is
return data;`,
  sumByKey: `// Sum values grouped by a key
// Example: Group sales by product
const result = {};
if (Array.isArray(data)) {
  data.forEach(item => {
    const key = item.category || item.name || 'Other';
    result[key] = (result[key] || 0) + (item.value || item.amount || 1);
  });
}
return Object.entries(result).map(([name, value]) => ({ name, value }));`,
  extractNumeric: `// Extract all numeric values from object
const result = [];
function extract(obj, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'number') {
      result.push({ name: prefix + key, value });
    } else if (typeof value === 'object' && value !== null) {
      extract(value, prefix + key + '.');
    }
  }
}
extract(data);
return result;`,
  flatten: `// Flatten nested arrays
function flatten(arr) {
  return arr.reduce((acc, item) => {
    if (Array.isArray(item)) {
      return acc.concat(flatten(item));
    }
    return acc.concat(item);
  }, []);
}
return Array.isArray(data) ? flatten(data) : data;`,
  topN: `// Get top N items by value
const n = 5; // Change this number
if (!Array.isArray(data)) return data;
return [...data]
  .sort((a, b) => (b.value || b.amount || 0) - (a.value || a.amount || 0))
  .slice(0, n);`,
  aggregate: `// Aggregate array data
if (!Array.isArray(data)) return data;
const numericKeys = Object.keys(data[0] || {}).filter(k => typeof data[0][k] === 'number');
const result = {};
numericKeys.forEach(key => {
  const values = data.map(d => d[key]).filter(v => typeof v === 'number');
  result[key + '_sum'] = values.reduce((a, b) => a + b, 0);
  result[key + '_avg'] = result[key + '_sum'] / values.length;
  result[key + '_min'] = Math.min(...values);
  result[key + '_max'] = Math.max(...values);
});
return result;`
}

// Custom Visualizer Component
function CustomVisualizer({ data, devMode }) {
  const [configs, setConfigs] = useState([])
  const [transformCode, setTransformCode] = useState(TRANSFORM_TEMPLATES.identity)
  const [transformedData, setTransformedData] = useState(null)
  const [transformError, setTransformError] = useState(null)
  const [showTransform, setShowTransform] = useState(false)
  
  const chartablePaths = useMemo(() => findChartablePaths(data), [data])
  const transformedPaths = useMemo(() => {
    if (transformedData) {
      return findChartablePaths(transformedData)
    }
    return []
  }, [transformedData])
  
  const allPaths = useMemo(() => {
    const paths = [...chartablePaths]
    transformedPaths.forEach(tp => {
      paths.push({ ...tp, path: `transformed.${tp.path}`, isTransformed: true })
    })
    return paths
  }, [chartablePaths, transformedPaths])
  
  const executeTransform = () => {
    try {
      // Create a safe function from the code
      const fn = new Function('data', transformCode)
      const result = fn(data)
      setTransformedData(result)
      setTransformError(null)
    } catch (err) {
      setTransformError(err.message)
      setTransformedData(null)
    }
  }
  
  const addVisualization = () => {
    const defaultPath = allPaths[0]
    if (defaultPath) {
      setConfigs([...configs, {
        id: Date.now(),
        path: defaultPath.path,
        title: `Chart ${configs.length + 1}`,
        isTransformed: defaultPath.isTransformed || false
      }])
    } else {
      // Allow adding even without chartable paths
      setConfigs([...configs, {
        id: Date.now(),
        path: 'root',
        title: `Chart ${configs.length + 1}`,
        isTransformed: false
      }])
    }
  }
  
  const removeVisualization = (id) => {
    setConfigs(configs.filter(c => c.id !== id))
  }
  
  const updateConfig = (id, updates) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, ...updates } : c))
  }
  
  const getDataForPath = (path, isTransformed) => {
    const sourceData = isTransformed ? transformedData : data
    if (!sourceData) return null
    
    const cleanPath = path.replace(/^transformed\./, '')
    if (cleanPath === 'root') return sourceData
    return queryJSON(sourceData, cleanPath)
  }
  
  return (
    <div className="space-y-6">
      {/* Dev Mode: Transform Code Editor */}
      {devMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTransform(!showTransform)}
              className="flex items-center gap-2 text-sm font-medium text-orange-400 hover:text-orange-300"
            >
              <Code className="w-4 h-4" />
              {showTransform ? 'Hide' : 'Show'} JS Transform Editor
              <ChevronDown className={`w-4 h-4 transition-transform ${showTransform ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <AnimatePresence>
            {showTransform && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border-2 border-dashed border-orange-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium text-orange-400">Data Transform (Dev Mode)</span>
                    </div>
                    <select
                      onChange={(e) => setTransformCode(TRANSFORM_TEMPLATES[e.target.value])}
                      className="glass-input text-xs px-2 py-1"
                    >
                      <option value="identity">Identity (no change)</option>
                      <option value="sumByKey">Sum by Key</option>
                      <option value="extractNumeric">Extract Numeric</option>
                      <option value="flatten">Flatten Arrays</option>
                      <option value="topN">Top N Items</option>
                      <option value="aggregate">Aggregate Stats</option>
                    </select>
                  </div>
                  
                  <div className="text-xs text-[var(--text-tertiary)] p-2 rounded bg-[var(--bg-secondary)]">
                    <strong>Tip:</strong> Write JavaScript to transform <code className="text-orange-400">data</code> variable. Return the transformed result.
                  </div>
                  
                  <textarea
                    value={transformCode}
                    onChange={(e) => setTransformCode(e.target.value)}
                    className="glass-input min-h-[150px] font-mono text-xs w-full"
                    placeholder="// Write your transform code here..."
                  />
                  
                  <div className="flex items-center gap-3">
                    <button onClick={executeTransform} className="glass-button text-xs py-2 bg-orange-500/20 border-orange-500/30 text-orange-400">
                      <Play className="w-3 h-3" />
                      Run Transform
                    </button>
                    {transformedData && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Transform successful
                      </span>
                    )}
                    {transformError && (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {transformError}
                      </span>
                    )}
                  </div>
                  
                  {transformedData && (
                    <div className="p-3 rounded-lg bg-[var(--bg-secondary)] max-h-[150px] overflow-auto">
                      <div className="text-xs text-[var(--text-tertiary)] mb-1">Transformed Output Preview:</div>
                      <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                        {JSON.stringify(transformedData, null, 2).slice(0, 500)}
                        {JSON.stringify(transformedData, null, 2).length > 500 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-[var(--text-secondary)]">
          {allPaths.length > 0 ? (
            <>Found {allPaths.length} chartable data path{allPaths.length > 1 ? 's' : ''}</>
          ) : (
            <>No chartable paths found - add visualizations manually</>
          )}
        </div>
        <button onClick={addVisualization} className="glass-button text-xs py-2">
          <Plus className="w-3 h-3" />
          Add Visualization
        </button>
      </div>
      
      {/* Available Paths */}
      {allPaths.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allPaths.slice(0, 12).map((p, i) => (
            <span
              key={i}
              className={`px-2 py-1 rounded-lg text-xs ${
                p.isTransformed
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              <code>{p.path}</code>
              <span className="ml-1 opacity-60">({p.type})</span>
            </span>
          ))}
          {allPaths.length > 12 && (
            <span className="px-2 py-1 rounded-lg text-xs bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
              +{allPaths.length - 12} more
            </span>
          )}
        </div>
      )}
      
      {/* Visualization Grid */}
      {configs.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)]">
          <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click "Add Visualization" to create custom charts</p>
          {devMode && <p className="text-xs mt-1 text-orange-400">Use JS Transform to reshape data for charting</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {configs.map(config => {
            const chartData = getDataForPath(config.path, config.isTransformed)
            const availablePaths = config.isTransformed ? transformedPaths : chartablePaths
            return (
              <div key={config.id} className={`rounded-xl p-4 space-y-3 ${config.isTransformed ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-[var(--bg-tertiary)]'}`}>
                {/* Config Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) => updateConfig(config.id, { title: e.target.value })}
                      className="bg-transparent text-sm font-medium text-[var(--text-primary)] border-none outline-none"
                    />
                  </div>
                  <button onClick={() => removeVisualization(config.id)} className="text-[var(--text-tertiary)] hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Data Source Switch */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-tertiary)]">Data Source:</span>
                  <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
                    <button
                      onClick={() => updateConfig(config.id, { isTransformed: false, path: 'root' })}
                      className={`px-3 py-1 text-xs font-medium transition-all ${
                        !config.isTransformed 
                          ? 'bg-[var(--accent)] text-white' 
                          : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => updateConfig(config.id, { isTransformed: true, path: 'root' })}
                      disabled={!transformedData}
                      className={`px-3 py-1 text-xs font-medium transition-all ${
                        config.isTransformed 
                          ? 'bg-orange-500 text-white' 
                          : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                    >
                      Transformed
                    </button>
                  </div>
                  {!transformedData && devMode && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">(Run transform first)</span>
                  )}
                </div>
                
                {/* Data Path Selection */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                    <span className="text-xs text-[var(--text-tertiary)]">Path:</span>
                    <select
                      value={config.path}
                      onChange={(e) => updateConfig(config.id, { path: e.target.value })}
                      className="glass-input text-xs px-2 py-1 flex-1"
                    >
                      <option value="root">root</option>
                      {availablePaths.map((p, i) => (
                        <option key={i} value={p.path}>
                          {p.path} ({p.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Chart */}
                <div className="min-h-[200px]">
                  {chartData ? (
                    <ChartView data={chartData} />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-[var(--text-tertiary)] text-sm">
                      {config.isTransformed ? 'Run transform first' : 'No data at path'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Graph View Component
function GraphView({ data }) {
  const containerRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState(null)
  
  const nodes = useMemo(() => {
    const result = []
    let id = 0
    
    function traverse(value, name, parentId = null, depth = 0) {
      const nodeId = id++
      const isObject = value !== null && typeof value === 'object'
      const isArray = Array.isArray(value)
      
      result.push({
        id: nodeId,
        name: name ?? 'root',
        parentId,
        depth,
        isObject,
        isArray,
        value: isObject ? null : value,
        childCount: isObject ? (isArray ? value.length : Object.keys(value).length) : 0
      })
      
      if (isObject && depth < 4) {
        const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value)
        entries.slice(0, 20).forEach(([key, val]) => {
          traverse(val, String(key), nodeId, depth + 1)
        })
      }
      
      return nodeId
    }
    
    traverse(data, null)
    return result
  }, [data])
  
  const positionedNodes = useMemo(() => {
    const depthGroups = {}
    nodes.forEach(node => {
      if (!depthGroups[node.depth]) depthGroups[node.depth] = []
      depthGroups[node.depth].push(node)
    })
    
    const maxDepth = Math.max(...Object.keys(depthGroups).map(Number))
    const width = 800
    const height = 500
    const levelHeight = height / (maxDepth + 2)
    
    return nodes.map(node => {
      const siblings = depthGroups[node.depth]
      const index = siblings.indexOf(node)
      const levelWidth = width / (siblings.length + 1)
      
      return {
        ...node,
        x: levelWidth * (index + 1),
        y: levelHeight * (node.depth + 1)
      }
    })
  }, [nodes])
  
  const edges = useMemo(() => {
    return positionedNodes
      .filter(n => n.parentId !== null)
      .map(node => {
        const parent = positionedNodes.find(n => n.id === node.parentId)
        return parent ? { from: parent, to: node } : null
      })
      .filter(Boolean)
  }, [positionedNodes])
  
  const getNodeColor = (node) => {
    if (node.isArray) return '#a78bfa'
    if (node.isObject) return '#60a5fa'
    if (typeof node.value === 'string') return '#34d399'
    if (typeof node.value === 'number') return '#fbbf24'
    if (typeof node.value === 'boolean') return '#22d3ee'
    return '#9ca3af'
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setZoom(z => Math.min(z * 1.2, 3))} className="glass-button text-xs py-2">
          <ZoomIn className="w-3 h-3" />
        </button>
        <button onClick={() => setZoom(z => Math.max(z / 1.2, 0.3))} className="glass-button text-xs py-2">
          <ZoomOut className="w-3 h-3" />
        </button>
        <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }} className="glass-button text-xs py-2">
          <Move className="w-3 h-3" />
          Reset
        </button>
        <span className="text-xs text-[var(--text-tertiary)]">
          {nodes.length} nodes • Zoom: {(zoom * 100).toFixed(0)}%
        </span>
      </div>
      
      <div ref={containerRef} className="bg-[var(--bg-tertiary)] rounded-xl overflow-hidden relative" style={{ height: 400 }}>
        <svg viewBox={`${-offset.x / zoom} ${-offset.y / zoom} ${800 / zoom} ${500 / zoom}`} className="w-full h-full" style={{ cursor: 'grab' }}>
          {edges.map((edge, i) => (
            <line key={i} x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y} stroke="var(--border-color)" strokeWidth={1 / zoom} />
          ))}
          
          {positionedNodes.map(node => (
            <g key={node.id} onClick={() => setSelectedNode(node)} className="cursor-pointer">
              {node.isObject ? (
                <rect x={node.x - 20} y={node.y - 12} width={40} height={24} rx={node.isArray ? 2 : 6} fill={getNodeColor(node)} className="transition-all hover:opacity-80" />
              ) : (
                <circle cx={node.x} cy={node.y} r={10} fill={getNodeColor(node)} className="transition-all hover:opacity-80" />
              )}
              <text x={node.x} y={node.y + 4} textAnchor="middle" fill="white" fontSize={10 / zoom} fontWeight="500">
                {node.isObject
                  ? (node.isArray ? `[${node.childCount}]` : `{${node.childCount}}`)
                  : (String(node.value).length > 4 ? String(node.value).slice(0, 4) + '..' : String(node.value))
                }
              </text>
              <text x={node.x} y={node.y - 18} textAnchor="middle" fill="var(--text-tertiary)" fontSize={9 / zoom}>
                {node.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      {selectedNode && (
        <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">{selectedNode.name}</span>
            <button onClick={() => setSelectedNode(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-[var(--text-secondary)] space-y-1">
            <p>Type: {selectedNode.isArray ? 'Array' : selectedNode.isObject ? 'Object' : typeof selectedNode.value}</p>
            {selectedNode.isObject && <p>Children: {selectedNode.childCount}</p>}
            {!selectedNode.isObject && <p>Value: {JSON.stringify(selectedNode.value)}</p>}
            <p>Depth: {selectedNode.depth}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Tab button component
function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button onClick={onClick} className={`tab-button flex items-center gap-2 ${active ? 'active' : ''}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

// View mode button
function ViewButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} title={label} className={`px-2 py-1.5 text-xs flex items-center gap-1 ${active ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
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
  const [treeSearch, setTreeSearch] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [fetchUrl, setFetchUrl] = useState('')
  const [fetchLoading, setFetchLoading] = useState(false)
  const [visualizeMode, setVisualizeMode] = useState('chart')
  const fileInputRef = useRef(null)

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

  const downloadFile = (content, filename, mimeType = 'application/json') => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded!')
  }

  const handleFileDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setInput(e.target.result)
    }
    reader.readAsText(file)
  }, [])

  const handleFetchUrl = async () => {
    if (!fetchUrl) return
    setFetchLoading(true)
    try {
      const response = await fetch(fetchUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setInput(JSON.stringify(data, null, 2))
      showToast('JSON fetched successfully!')
    } catch (err) {
      showToast(`Failed to fetch: ${err.message}`)
    } finally {
      setFetchLoading(false)
    }
  }

  const loadSample = (key) => {
    setInput(JSON.stringify(SAMPLE_DATA[key], null, 2))
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
          <Braces className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">JSON Toolkit</h1>
          <p className="text-sm text-[var(--text-secondary)]">Format, visualize, query and compare JSON data</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-px">
        <TabButton active={tab === 'format'} onClick={() => setTab('format')} icon={FileJson}>Format</TabButton>
        <TabButton active={tab === 'visualize'} onClick={() => setTab('visualize')} icon={LayoutGrid}>Visualize</TabButton>
        <TabButton active={tab === 'query'} onClick={() => setTab('query')} icon={Filter}>Query</TabButton>
        <TabButton active={tab === 'diff'} onClick={() => setTab('diff')} icon={GitCompare}>Diff</TabButton>
      </div>

      {/* Format Tab */}
      {tab === 'format' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-primary)]">Input JSON</label>
              <button onClick={() => setInput('')} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Clear</button>
            </div>

            <div className="flex flex-wrap gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileDrop} accept=".json,.txt" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="glass-button text-xs py-1.5">
                <Upload className="w-3 h-3" />Upload
              </button>
              <button onClick={() => loadSample('nested')} className="glass-button text-xs py-1.5">
                <Database className="w-3 h-3" />Nested
              </button>
              <button onClick={() => loadSample('array')} className="glass-button text-xs py-1.5">
                <BarChart3 className="w-3 h-3" />Array
              </button>
              <button onClick={() => loadSample('simple')} className="glass-button text-xs py-1.5">
                <PieChart className="w-3 h-3" />Simple
              </button>
            </div>

            <div className="flex gap-2">
              <input type="text" value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} placeholder="https://api.example.com/data.json" className="glass-input flex-1 text-xs" />
              <button onClick={handleFetchUrl} disabled={fetchLoading} className="glass-button text-xs py-2">
                {fetchLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Link className="w-3 h-3" />}
              </button>
            </div>

            <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={handleFileDrop} className={`relative ${isDragging ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-primary)]' : ''}`}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder='{"key": "value"} or drag & drop a JSON file' className="glass-input min-h-[300px] resize-y font-mono text-xs w-full" />
              {isDragging && (
                <div className="absolute inset-0 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[var(--accent)]" />
                </div>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
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

          <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Output</label>
                {parsed && <span className="status-valid text-xs py-0.5"><CheckCircle className="w-3 h-3" />Valid</span>}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
                  <ViewButton active={viewMode === 'formatted'} onClick={() => setViewMode('formatted')} icon={Maximize2} label="Format" />
                  <ViewButton active={viewMode === 'tree'} onClick={() => setViewMode('tree')} icon={TreePine} label="Tree" />
                  <ViewButton active={viewMode === 'minified'} onClick={() => setViewMode('minified')} icon={Minimize2} label="Min" />
                </div>

                {viewMode === 'formatted' && (
                  <select value={indent} onChange={(e) => setIndent(Number(e.target.value))} className="glass-input px-2 py-1 text-xs w-20">
                    <option value={2}>2 sp</option>
                    <option value={4}>4 sp</option>
                  </select>
                )}
              </div>
            </div>

            {viewMode === 'tree' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input type="text" value={treeSearch} onChange={(e) => setTreeSearch(e.target.value)} placeholder="Search in tree..." className="glass-input pl-9 text-xs w-full" />
              </div>
            )}

            <div className="min-h-[300px] max-h-[500px] overflow-auto">
              {viewMode === 'tree' && parsed ? (
                <div className="p-2"><TreeNode value={parsed} path="" onSelect={handleNodeSelect} selectedPath={selectedPath} searchTerm={treeSearch} /></div>
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
                <button onClick={() => downloadFile(formatted, 'data.json')} className="glass-button text-xs py-2"><Download className="w-3 h-3" />Download</button>
              </div>
            )}

            {parsed && devMode && (
              <div className="text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-color)]">
                <span>Formatted: {formatted.length.toLocaleString()} bytes</span>
                <span className="mx-2">|</span>
                <span>Minified: {minified.length.toLocaleString()} bytes</span>
                <span className="mx-2">|</span>
                <span>Ratio: {((1 - minified.length / formatted.length) * 100).toFixed(1)}% smaller</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visualize Tab */}
      {tab === 'visualize' && (
        <div className="space-y-6">
          {!parsed ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Braces className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No JSON to visualize</h3>
              <p className="text-sm text-[var(--text-secondary)]">Go to Format tab and enter some JSON data first</p>
            </div>
          ) : (
            <>
              <div className="inline-flex glass-card rounded-2xl p-2">
                <div className="flex gap-1">
                  {[
                    { id: 'chart', icon: BarChart3, label: 'Charts' },
                    { id: 'table', icon: Table2, label: 'Table' },
                    { id: 'graph', icon: Network, label: 'Graph' },
                    { id: 'custom', icon: Settings2, label: 'Builder' }
                  ].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setVisualizeMode(id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${visualizeMode === id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 sm:p-6">
                {visualizeMode === 'table' && <TableView data={parsed} onExport={downloadFile} />}
                {visualizeMode === 'chart' && <ChartView data={parsed} />}
                {visualizeMode === 'graph' && <GraphView data={parsed} />}
                {visualizeMode === 'custom' && <CustomVisualizer data={parsed} devMode={devMode} />}
              </div>

              {devMode && visualizeMode !== 'custom' && (
                <div className="glass-card rounded-2xl p-4 sm:p-6 border-dashed border-2 border-orange-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-orange-400">Data Statistics (Dev Mode)</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-[var(--text-tertiary)]">Total Nodes</div>
                      <div className="text-lg font-bold text-[var(--text-primary)]">{stats?.objects + stats?.arrays + stats?.strings + stats?.numbers + stats?.booleans + stats?.nulls}</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-tertiary)]">Max Depth</div>
                      <div className="text-lg font-bold text-[var(--text-primary)]">{stats?.maxDepth}</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-tertiary)]">Memory (est.)</div>
                      <div className="text-lg font-bold text-[var(--text-primary)]">{(minified.length / 1024).toFixed(1)} KB</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-tertiary)]">Numeric Fields</div>
                      <div className="text-lg font-bold text-[var(--text-primary)]">{stats?.numbers}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Query Tab */}
      {tab === 'query' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <Search className="w-5 h-5 accent-text" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter path query (e.g., .users[0].name)" className="glass-input flex-1" />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setQuery('.')} className="badge cursor-pointer hover:opacity-80">root</button>
              <button onClick={() => setQuery('.*')} className="badge cursor-pointer hover:opacity-80">all keys</button>
            </div>

            {queryResult && (
              <div className="code-block max-h-[400px] overflow-auto">
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
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <label className="text-sm font-medium text-[var(--text-primary)] mb-4 block">Original JSON</label>
              <textarea value={diffInput1} onChange={(e) => setDiffInput1(e.target.value)} placeholder='{"key": "original"}' className="glass-input min-h-[200px] resize-y font-mono text-xs w-full" />
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <label className="text-sm font-medium text-[var(--text-primary)] mb-4 block">Modified JSON</label>
              <textarea value={diffInput2} onChange={(e) => setDiffInput2(e.target.value)} placeholder='{"key": "modified"}' className="glass-input min-h-[200px] resize-y font-mono text-xs w-full" />
            </div>
          </div>

          {diffInput1 && diffInput2 && (
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Differences</h3>
              {(() => {
                const diffs = getDiff()
                if (!diffs) return <div className="text-red-500 text-sm">Invalid JSON in one or both inputs</div>
                if (diffs.length === 0) return <div className="flex items-center gap-2 text-emerald-500"><CheckCircle className="w-4 h-4" />No differences found</div>
                return (
                  <div className="space-y-2 max-h-[400px] overflow-auto">
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
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-4 h-4 accent-text" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Inferred TypeScript Interface (Dev Mode)</h3>
          </div>
          <pre className="code-block text-xs max-h-[300px] overflow-auto">{inferTypeScript(parsed)}</pre>
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
