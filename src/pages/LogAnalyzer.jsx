import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import {
  FileText, Upload, Search, Filter, Download, Copy, X,
  ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Info,
  Bug, CheckCircle, Clock, List, Table2, Activity, BarChart3,
  PieChart, RefreshCw, Trash2, Eye, EyeOff, Play, Pause,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronsRight, ChevronLeft,
  Calendar, Layers, Zap, GitBranch, FileDown, Settings2,
  Braces, Globe, Server
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart as RePieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, AreaChart, Area
} from 'recharts'

// Log level colors and icons
const LOG_LEVELS = {
  TRACE: { color: '#9ca3af', bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Bug },
  DEBUG: { color: '#60a5fa', bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Bug },
  INFO: { color: '#34d399', bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: Info },
  WARN: { color: '#fbbf24', bg: 'bg-amber-500/20', text: 'text-amber-400', icon: AlertTriangle },
  ERROR: { color: '#f87171', bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
  FATAL: { color: '#ef4444', bg: 'bg-red-600/20', text: 'text-red-500', icon: AlertCircle },
  UNPARSED: { color: '#6b7280', bg: 'bg-gray-600/20', text: 'text-gray-500', icon: AlertTriangle },
}

const CHART_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#f472b6']

// Sample log data
const SAMPLE_LOGS = {
  json: `{"timestamp":"2024-01-15T10:23:45.123Z","level":"INFO","message":"Application started successfully","service":"api-gateway","version":"2.1.0"}
{"timestamp":"2024-01-15T10:23:45.456Z","level":"DEBUG","message":"Loading configuration from environment","service":"api-gateway","config":"production"}
{"timestamp":"2024-01-15T10:23:46.789Z","level":"INFO","message":"Database connection established","service":"api-gateway","database":"postgres","pool_size":10}
{"timestamp":"2024-01-15T10:23:47.012Z","level":"INFO","message":"Redis cache connected","service":"api-gateway","host":"redis-cluster"}
{"timestamp":"2024-01-15T10:23:48.345Z","level":"WARN","message":"Rate limiter threshold approaching","service":"api-gateway","current":850,"limit":1000}
{"timestamp":"2024-01-15T10:23:49.678Z","level":"INFO","message":"Health check endpoint registered","service":"api-gateway","path":"/health"}
{"timestamp":"2024-01-15T10:23:50.901Z","level":"DEBUG","message":"JWT validation middleware initialized","service":"api-gateway","algorithm":"RS256"}
{"timestamp":"2024-01-15T10:23:52.234Z","level":"ERROR","message":"Failed to connect to external service","service":"api-gateway","url":"https://payment.api.com","error":"ECONNREFUSED"}
{"timestamp":"2024-01-15T10:23:53.567Z","level":"WARN","message":"Retrying connection to external service","service":"api-gateway","attempt":1,"max_attempts":3}
{"timestamp":"2024-01-15T10:23:55.890Z","level":"INFO","message":"External service connection restored","service":"api-gateway","url":"https://payment.api.com"}
{"timestamp":"2024-01-15T10:23:57.123Z","level":"INFO","message":"Request processed","service":"api-gateway","method":"POST","path":"/api/users","status":201,"duration_ms":45}
{"timestamp":"2024-01-15T10:23:58.456Z","level":"INFO","message":"Request processed","service":"api-gateway","method":"GET","path":"/api/products","status":200,"duration_ms":12}
{"timestamp":"2024-01-15T10:24:00.789Z","level":"ERROR","message":"Validation failed","service":"api-gateway","method":"POST","path":"/api/orders","error":"Invalid product ID","user_id":"usr_123"}
{"timestamp":"2024-01-15T10:24:02.012Z","level":"INFO","message":"Cache hit","service":"api-gateway","key":"product:456","ttl":3600}
{"timestamp":"2024-01-15T10:24:03.345Z","level":"DEBUG","message":"Metrics exported","service":"api-gateway","endpoint":"/metrics","format":"prometheus"}`,

  apache: `192.168.1.100 - - [15/Jan/2024:10:23:45 +0000] "GET /index.html HTTP/1.1" 200 2326 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
192.168.1.101 - admin [15/Jan/2024:10:23:46 +0000] "POST /api/login HTTP/1.1" 200 156 "https://example.com/login" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
192.168.1.102 - - [15/Jan/2024:10:23:47 +0000] "GET /api/products?page=1 HTTP/1.1" 200 4521 "https://example.com/shop" "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)"
192.168.1.103 - - [15/Jan/2024:10:23:48 +0000] "GET /static/style.css HTTP/1.1" 304 0 "https://example.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
192.168.1.104 - - [15/Jan/2024:10:23:49 +0000] "GET /api/user/profile HTTP/1.1" 401 89 "-" "PostmanRuntime/7.29.0"
192.168.1.100 - - [15/Jan/2024:10:23:50 +0000] "POST /api/cart/add HTTP/1.1" 201 234 "https://example.com/product/123" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
192.168.1.105 - - [15/Jan/2024:10:23:51 +0000] "GET /admin/dashboard HTTP/1.1" 403 78 "-" "Mozilla/5.0 (Linux; Android 11)"
192.168.1.101 - admin [15/Jan/2024:10:23:52 +0000] "GET /admin/users HTTP/1.1" 200 8934 "https://example.com/admin" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
192.168.1.106 - - [15/Jan/2024:10:23:53 +0000] "GET /nonexistent HTTP/1.1" 404 162 "-" "curl/7.68.0"
192.168.1.102 - - [15/Jan/2024:10:23:54 +0000] "POST /api/checkout HTTP/1.1" 500 89 "https://example.com/cart" "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)"
192.168.1.107 - - [15/Jan/2024:10:23:55 +0000] "GET /robots.txt HTTP/1.1" 200 156 "-" "Googlebot/2.1"
192.168.1.100 - - [15/Jan/2024:10:23:56 +0000] "GET /api/products/456 HTTP/1.1" 200 1234 "https://example.com/shop" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`,

  application: `2024-01-15 10:23:45.123 [INFO] [main] com.myapp.Application - Starting MyApplication v3.2.1
2024-01-15 10:23:45.456 [DEBUG] [main] com.myapp.config.DatabaseConfig - Initializing database connection pool
2024-01-15 10:23:46.789 [INFO] [main] com.myapp.config.DatabaseConfig - Database pool initialized with 10 connections
2024-01-15 10:23:47.012 [INFO] [main] com.myapp.service.CacheService - Redis connection established
2024-01-15 10:23:48.345 [WARN] [scheduler-1] com.myapp.jobs.CleanupJob - Cleanup job running behind schedule by 5 minutes
2024-01-15 10:23:49.678 [INFO] [http-nio-8080-exec-1] com.myapp.controller.UserController - User login successful: user_id=12345
2024-01-15 10:23:50.901 [DEBUG] [http-nio-8080-exec-2] com.myapp.service.ProductService - Fetching products with filter: category=electronics
2024-01-15 10:23:52.234 [ERROR] [http-nio-8080-exec-3] com.myapp.service.PaymentService - Payment processing failed
java.lang.RuntimeException: Connection timeout to payment gateway
    at com.myapp.service.PaymentService.processPayment(PaymentService.java:156)
    at com.myapp.controller.OrderController.createOrder(OrderController.java:89)
    at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:897)
Caused by: java.net.SocketTimeoutException: Read timed out
    at java.net.SocketInputStream.socketRead0(Native Method)
    at com.myapp.client.PaymentClient.charge(PaymentClient.java:45)
    ... 12 more
2024-01-15 10:23:53.567 [WARN] [http-nio-8080-exec-3] com.myapp.controller.OrderController - Order creation failed, notifying user
2024-01-15 10:23:54.890 [INFO] [http-nio-8080-exec-4] com.myapp.controller.UserController - User profile updated: user_id=67890
2024-01-15 10:23:56.123 [DEBUG] [cache-refresh-1] com.myapp.service.CacheService - Cache refresh completed for key: product_catalog
2024-01-15 10:23:57.456 [INFO] [metrics-1] com.myapp.monitoring.MetricsExporter - Metrics exported: requests=1523, errors=12, avg_latency=45ms
2024-01-15 10:23:58.789 [ERROR] [scheduler-2] com.myapp.jobs.EmailJob - Failed to send email notification
javax.mail.MessagingException: Could not connect to SMTP host
    at com.myapp.service.EmailService.send(EmailService.java:78)
    at com.myapp.jobs.EmailJob.execute(EmailJob.java:34)
2024-01-15 10:24:00.012 [INFO] [main] com.myapp.Application - Application ready to serve requests`,

  syslog: `<134>Jan 15 10:23:45 webserver01 nginx[1234]: 192.168.1.100 - - "GET /api/health HTTP/1.1" 200 15
<134>Jan 15 10:23:46 webserver01 nginx[1234]: 192.168.1.101 - - "POST /api/data HTTP/1.1" 201 2048
<131>Jan 15 10:23:47 dbserver01 postgres[5678]: LOG: checkpoint starting: time
<131>Jan 15 10:23:48 dbserver01 postgres[5678]: LOG: checkpoint complete: wrote 156 buffers
<132>Jan 15 10:23:49 appserver01 myapp[9012]: WARN: Memory usage at 85%
<134>Jan 15 10:23:50 webserver01 nginx[1234]: 192.168.1.102 - - "GET /static/app.js HTTP/1.1" 304 0
<131>Jan 15 10:23:51 authserver01 sshd[3456]: Accepted publickey for admin from 10.0.0.50 port 52341
<129>Jan 15 10:23:52 appserver01 myapp[9012]: ERROR: Database query timeout after 30s
<132>Jan 15 10:23:53 loadbalancer haproxy[7890]: Server backend/web1 is DOWN, reason: Layer4 timeout
<134>Jan 15 10:23:54 webserver02 nginx[2345]: 192.168.1.103 - - "GET /api/users HTTP/1.1" 200 4096
<131>Jan 15 10:23:55 dbserver01 postgres[5678]: LOG: connection received: host=appserver01
<132>Jan 15 10:23:56 loadbalancer haproxy[7890]: Server backend/web1 is UP, reason: Layer4 check passed
<134>Jan 15 10:23:57 webserver01 nginx[1234]: 192.168.1.104 - - "DELETE /api/cache HTTP/1.1" 204 0
<129>Jan 15 10:23:58 appserver01 myapp[9012]: CRITICAL: Disk space below 10%
<134>Jan 15 10:23:59 webserver01 nginx[1234]: 192.168.1.100 - - "GET /api/metrics HTTP/1.1" 200 8192`
}

// Format display config (for chips/tags)
const FORMAT_DISPLAY = {
  log4j: { name: 'Spark/Log4j', color: 'bg-orange-500/20 text-orange-400', icon: '⚡' },
  python: { name: 'Python', color: 'bg-blue-500/20 text-blue-400', icon: '🐍' },
  logback: { name: 'Logback', color: 'bg-green-500/20 text-green-400', icon: '☕' },
  springboot: { name: 'Spring', color: 'bg-emerald-500/20 text-emerald-400', icon: '🍃' },
  ndjson: { name: 'JSON', color: 'bg-yellow-500/20 text-yellow-400', icon: '{}' },
  apache: { name: 'Apache', color: 'bg-red-500/20 text-red-400', icon: '🪶' },
  syslog: { name: 'Syslog', color: 'bg-purple-500/20 text-purple-400', icon: '📋' },
  generic: { name: 'Generic', color: 'bg-gray-500/20 text-gray-400', icon: '📝' },
}

// Log format patterns
const LOG_PATTERNS = {
  // JSON formats
  ndjson: {
    name: 'JSON Lines (NDJSON)',
    detect: (line) => {
      try {
        JSON.parse(line)
        return true
      } catch { return false }
    },
    parse: (line) => {
      try {
        const obj = JSON.parse(line)
        
        // Reject if not an object (e.g., arrays, primitives)
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
          return null
        }
        
        // Check if it has at least some meaningful log structure
        const hasLevel = obj.level !== undefined || obj.severity !== undefined || obj.lvl !== undefined
        const hasMessage = obj.message !== undefined || obj.msg !== undefined || obj.text !== undefined || obj.log !== undefined
        const hasTimestamp = obj.timestamp !== undefined || obj.time !== undefined || obj.ts !== undefined || obj['@timestamp'] !== undefined || obj.date !== undefined
        
        // If it has none of these, it's probably not a log entry
        if (!hasLevel && !hasMessage && !hasTimestamp) {
          return null
        }
        
        // Get message, ensuring it's a string
        let message = obj.message || obj.msg || obj.text || obj.log
        if (message && typeof message === 'object') {
          message = JSON.stringify(message)
        } else if (!message) {
          message = JSON.stringify(obj)
        }
        // Get timestamp, converting if needed
        let timestamp = obj.timestamp || obj.time || obj.ts || obj['@timestamp'] || obj.date
        if (typeof timestamp === 'number') {
          timestamp = new Date(timestamp).toISOString()
        }
        return {
          timestamp,
          level: normalizeLevel(obj.level || obj.severity || obj.lvl),
          message: String(message),
          source: String(obj.source || obj.logger || obj.name || obj.component || ''),
          fields: obj
        }
      } catch { return null }
    }
  },
  
  // Apache Combined Log Format
  apache: {
    name: 'Apache/Nginx Combined',
    pattern: /^(\S+) \S+ \S+ \[([^\]]+)\] "([^"]*)" (\d+) (\d+|-) "([^"]*)" "([^"]*)"/,
    detect: (line) => LOG_PATTERNS.apache.pattern.test(line),
    parse: (line) => {
      const match = line.match(LOG_PATTERNS.apache.pattern)
      if (!match) return null
      const [, ip, timestamp, request, status, bytes, referer, userAgent] = match
      const statusNum = parseInt(status)
      return {
        timestamp,
        level: statusNum >= 500 ? 'ERROR' : statusNum >= 400 ? 'WARN' : 'INFO',
        message: `${request} - ${status}`,
        source: ip,
        fields: { ip, timestamp, request, status: statusNum, bytes: parseInt(bytes) || 0, referer, userAgent }
      }
    }
  },
  
  // Syslog format
  syslog: {
    name: 'Syslog',
    pattern: /^<(\d+)>(\w{3}\s+\d+\s+[\d:]+)\s+(\S+)\s+(\S+?)(?:\[(\d+)\])?:\s*(.*)$/,
    detect: (line) => LOG_PATTERNS.syslog.pattern.test(line) || /^\w{3}\s+\d+\s+[\d:]+/.test(line),
    parse: (line) => {
      const match = line.match(LOG_PATTERNS.syslog.pattern)
      if (match) {
        const [, priority, timestamp, hostname, tag, pid, message] = match
        const severity = parseInt(priority) & 0x07
        const level = ['FATAL', 'FATAL', 'ERROR', 'ERROR', 'WARN', 'INFO', 'INFO', 'DEBUG'][severity] || 'INFO'
        return { timestamp, level, message, source: `${hostname}/${tag}`, fields: { priority, hostname, tag, pid, message } }
      }
      // Simple syslog without priority
      const simpleMatch = line.match(/^(\w{3}\s+\d+\s+[\d:]+)\s+(\S+)\s+(.*)$/)
      if (simpleMatch) {
        const [, timestamp, source, message] = simpleMatch
        return { timestamp, level: detectLevelFromMessage(message), message, source, fields: {} }
      }
      return null
    }
  },
  
  // Log4j / Spark / Java short date format: YY/MM/DD HH:mm:ss LEVEL ClassName: message
  log4j: {
    name: 'Log4j/Spark',
    // Matches: 26/01/18 23:39:23 WARN NativeCodeLoader: Unable to load...
    pattern: /^(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+(\S+?):\s*(.*)$/i,
    detect: (line) => /^\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+/i.test(line),
    parse: (line) => {
      const match = line.match(LOG_PATTERNS.log4j.pattern)
      if (match) {
        const [, timestamp, level, source, message] = match
        // Convert YY/MM/DD to full date (assume 2000s)
        const [datePart, timePart] = timestamp.split(/\s+/)
        const [yy, mm, dd] = datePart.split('/')
        const fullYear = parseInt(yy) < 70 ? `20${yy}` : `19${yy}`
        const fullTimestamp = `${fullYear}-${mm}-${dd} ${timePart}`
        return { timestamp: fullTimestamp, level: normalizeLevel(level), message, source, fields: { className: source } }
      }
      return null
    }
  },
  
  // Python logging format: YYYY-MM-DD HH:mm:ss - logger - LEVEL - message
  python: {
    name: 'Python Logging',
    // Matches: 2026-01-18 23:39:24 - root - INFO - Logging initialized
    pattern: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+-\s+(\S+)\s+-\s+(TRACE|DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\s+-\s+(.*)$/i,
    detect: (line) => /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+-\s+\S+\s+-\s+(TRACE|DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\s+-\s+/i.test(line),
    parse: (line) => {
      const match = line.match(LOG_PATTERNS.python.pattern)
      if (match) {
        const [, timestamp, logger, level, message] = match
        return { timestamp, level: normalizeLevel(level), message, source: logger, fields: { logger } }
      }
      return null
    }
  },
  
  // Logback / SLF4J format: timestamp LEVEL [thread] logger - message
  logback: {
    name: 'Logback/SLF4J',
    // Matches: 2026-01-18 10:15:30.123 INFO [main] com.example.App - Starting
    pattern: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+\[([^\]]+)\]\s+(\S+)\s+-\s+(.*)$/i,
    detect: (line) => /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?\s+(TRACE|DEBUG|INFO|WARN|ERROR)\s+\[/.test(line),
    parse: (line) => {
      const match = line.match(LOG_PATTERNS.logback.pattern)
      if (match) {
        const [, timestamp, level, thread, logger, message] = match
        return { timestamp, level: normalizeLevel(level), message, source: logger, fields: { thread, logger } }
      }
      return null
    }
  },
  
  // Spring Boot format: timestamp LEVEL pid --- [thread] logger : message
  springboot: {
    name: 'Spring Boot',
    // Matches: 2026-01-18 10:15:30.123  INFO 12345 --- [main] c.e.App : Starting
    pattern: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+(\d+)\s+---\s+\[([^\]]+)\]\s+(\S+)\s+:\s+(.*)$/i,
    detect: (line) => /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?\s+\w+\s+\d+\s+---\s+\[/.test(line),
    parse: (line) => {
      const match = line.match(LOG_PATTERNS.springboot.pattern)
      if (match) {
        const [, timestamp, level, pid, thread, logger, message] = match
        return { timestamp, level: normalizeLevel(level), message, source: logger, fields: { pid, thread, logger } }
      }
      return null
    }
  },
  
  // Generic timestamp format
  generic: {
    name: 'Generic Timestamp',
    pattern: /^[\[\(]?(\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s*[\]\)]?\s*[\[\(]?(\w+)[\]\)]?\s*[-:]\s*(.*)$/,
    detect: (line) => LOG_PATTERNS.generic.pattern.test(line) || /^\d{4}[-/]\d{2}[-/]\d{2}/.test(line),
    parse: (line) => {
      const match = line.match(LOG_PATTERNS.generic.pattern)
      if (match) {
        const [, timestamp, level, message] = match
        return { timestamp, level: normalizeLevel(level), message, source: '', fields: {} }
      }
      // Fallback: just timestamp at start
      const tsMatch = line.match(/^[\[\(]?(\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s*[\]\)]?\s*(.*)$/)
      if (tsMatch) {
        const [, timestamp, rest] = tsMatch
        return { timestamp, level: detectLevelFromMessage(rest), message: rest, source: '', fields: {} }
      }
      return null
    }
  },
  
  // Plain text (fallback)
  plain: {
    name: 'Plain Text',
    detect: () => true,
    parse: (line, index) => ({
      timestamp: null,
      level: detectLevelFromMessage(line),
      message: line,
      source: '',
      lineNumber: index + 1,
      fields: {}
    })
  }
}

// Normalize log level
function normalizeLevel(level) {
  if (!level) return 'INFO'
  const upper = String(level).toUpperCase()
  
  // Handle numeric levels (Pino/Bunyan)
  if (!isNaN(level)) {
    const num = parseInt(level)
    if (num <= 10) return 'TRACE'
    if (num <= 20) return 'DEBUG'
    if (num <= 30) return 'INFO'
    if (num <= 40) return 'WARN'
    if (num <= 50) return 'ERROR'
    return 'FATAL'
  }
  
  if (upper.includes('TRACE') || upper.includes('VERBOSE')) return 'TRACE'
  if (upper.includes('DEBUG')) return 'DEBUG'
  if (upper.includes('INFO') || upper.includes('NOTICE')) return 'INFO'
  if (upper.includes('WARN')) return 'WARN'
  if (upper.includes('ERROR') || upper.includes('ERR') || upper.includes('SEVERE')) return 'ERROR'
  if (upper.includes('FATAL') || upper.includes('CRIT') || upper.includes('EMERG') || upper.includes('PANIC')) return 'FATAL'
  return 'INFO'
}

// Detect level from message content
function detectLevelFromMessage(message) {
  const upper = message.toUpperCase()
  if (upper.includes('ERROR') || upper.includes('EXCEPTION') || upper.includes('FAILED')) return 'ERROR'
  if (upper.includes('WARN')) return 'WARN'
  if (upper.includes('DEBUG')) return 'DEBUG'
  if (upper.includes('FATAL') || upper.includes('PANIC') || upper.includes('CRITICAL')) return 'FATAL'
  return 'INFO'
}

// Detect stack trace
function isStackTraceLine(line) {
  // Only detect actual stack trace lines, not config output
  const trimmed = line.trim()
  
  // Java/JS: "at package.Class.method(File.java:123)"
  if (/^\s+at\s+[\w.$]+\s*\(/.test(line)) return true
  
  // Python: '  File "path", line N'
  if (/^\s+File\s+"/.test(line)) return true
  
  // Traceback header
  if (/^Traceback\s+\(/.test(line)) return true
  
  // Java "Caused by:" 
  if (/^Caused by:/.test(line)) return true
  
  // Java "... N more"
  if (/^\s+\.{3}\s+\d+\s+more/.test(line)) return true
  
  return false
}

// Parse logs with auto-detection
function parseLogs(content) {
  // Normalize line endings (handle Windows CRLF, old Mac CR, and Unix LF)
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalizedContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return { entries: [], format: 'empty', stats: {} }
  
  // Sample first 50 lines for format detection
  const sampleSize = Math.min(50, lines.length)
  const sample = lines.slice(0, sampleSize)
  
  // Score all formats and rank them
  const formatScores = []
  for (const [formatName, format] of Object.entries(LOG_PATTERNS)) {
    if (formatName === 'plain') continue
    
    let score = 0
    for (const line of sample) {
      if (format.detect(line)) score++
    }
    
    if (score > 0) {
      formatScores.push({ name: formatName, format, score })
    }
  }
  
  // Sort by score descending - best format first
  formatScores.sort((a, b) => b.score - a.score)
  
  const bestFormat = formatScores.length > 0 ? formatScores[0].name : 'plain'
  const bestScore = formatScores.length > 0 ? formatScores[0].score : 0
  
  // Get formats to try (all detected formats + fallbacks)
  const formatsToTry = formatScores.map(f => f.format)
  
  const entries = []
  let currentStackTrace = []
  let lastEntry = null
  const formatUsage = {} // Track which formats were used
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Skip empty lines or whitespace-only lines
    if (!line.trim()) continue
    
    // Check if this is a stack trace continuation
    if (isStackTraceLine(line) && lastEntry && lastEntry.level !== 'UNPARSED') {
      currentStackTrace.push(line)
      continue
    }
    
    // If we have accumulated stack trace, attach to last entry
    if (currentStackTrace.length > 0 && lastEntry) {
      lastEntry.stackTrace = currentStackTrace.join('\n')
      currentStackTrace = []
    }
    
    let parsed = null
    let usedFormat = null
    
    // Try each detected format in order of confidence
    for (const format of formatsToTry) {
      if (format.detect(line)) {
        try {
          parsed = format.parse(line, i)
          if (parsed) {
            usedFormat = format.name
            break
          }
        } catch (e) {
          // Try next format
        }
      }
    }
    
    // If no detected format worked, try all formats as fallback
    if (!parsed) {
      for (const [formatName, format] of Object.entries(LOG_PATTERNS)) {
        if (formatName === 'plain') continue
        if (format.detect(line)) {
          try {
            parsed = format.parse(line, i)
            if (parsed) {
              usedFormat = formatName
              break
            }
          } catch (e) {
            // Try next format
          }
        }
      }
    }
    
    if (parsed) {
      parsed.raw = line
      parsed.lineNumber = i + 1
      parsed.id = i
      parsed.detectedFormat = usedFormat
      // Track format usage
      formatUsage[usedFormat] = (formatUsage[usedFormat] || 0) + 1
      // Ensure message is always a string
      if (parsed.message && typeof parsed.message === 'object') {
        parsed.message = JSON.stringify(parsed.message)
      }
      entries.push(parsed)
      lastEntry = parsed
    } else {
      // Line couldn't be parsed - create an UNPARSED entry
      const unparsedEntry = {
        id: i,
        lineNumber: i + 1,
        level: 'UNPARSED',
        message: 'Unable to parse this line',
        timestamp: null,
        source: '',
        raw: line,
        fields: {},
        unparsed: true
      }
      entries.push(unparsedEntry)
      // Don't set lastEntry for unparsed - we don't want stack traces attached to them
    }
  }
  
  // Attach any remaining stack trace
  if (currentStackTrace.length > 0 && lastEntry) {
    lastEntry.stackTrace = currentStackTrace.join('\n')
  }
  
  // Calculate stats
  const unparsedCount = entries.filter(e => e.level === 'UNPARSED').length
  const parsedEntries = entries.filter(e => e.level !== 'UNPARSED')
  
  // Determine primary format (most used)
  const primaryFormat = Object.entries(formatUsage).sort((a, b) => b[1] - a[1])[0]
  const primaryFormatName = primaryFormat ? LOG_PATTERNS[primaryFormat[0]]?.name : 'Plain Text'
  const isMixedFormat = Object.keys(formatUsage).length > 1
  
  const stats = {
    total: entries.length,
    parsed: parsedEntries.length,
    unparsed: unparsedCount,
    byLevel: {},
    timeRange: { start: null, end: null },
    formatName: isMixedFormat ? `Mixed (${Object.keys(formatUsage).length} formats)` : primaryFormatName,
    formatBreakdown: formatUsage,
    confidence: Math.round((bestScore / sampleSize) * 100),
    isMixedFormat
  }
  
  for (const entry of entries) {
    stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1
    if (entry.timestamp) {
      const ts = new Date(entry.timestamp)
      if (!isNaN(ts)) {
        if (!stats.timeRange.start || ts < stats.timeRange.start) stats.timeRange.start = ts
        if (!stats.timeRange.end || ts > stats.timeRange.end) stats.timeRange.end = ts
      }
    }
  }
  
  return { entries, format: bestFormat, stats }
}

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// Helper to safely convert any value to displayable string
function safeStringify(value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return '[Object]'
    }
  }
  return String(value)
}

// Extract debug-important fields from JSON error logs
function extractDebugInfo(entry) {
  const debugInfo = {
    httpInfo: [],      // URLs, status codes, methods
    errorInfo: [],     // Error messages, types
    contextInfo: [],   // Hostname, PID, context, service
    securityInfo: [],  // Tokens, keys (masked)
    requestInfo: [],   // Request/response bodies
    metadata: []       // Other useful metadata
  }
  
  // Deep search function to find values in nested objects
  const deepSearch = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      const lowerKey = key.toLowerCase()
      
      if (typeof value === 'string') {
        // URL detection
        if (lowerKey.includes('url') || value.match(/^https?:\/\//)) {
          debugInfo.httpInfo.push({ label: 'URL', value, path: currentPath, icon: '🔗' })
        }
        // Status/Response code in string
        else if (lowerKey === 'message' && value.includes('status code')) {
          const codeMatch = value.match(/status code (\d+)/)
          if (codeMatch) {
            debugInfo.httpInfo.push({ label: 'Status Message', value, path: currentPath, icon: '📝' })
          }
        }
        // Error message
        else if (lowerKey === 'message' || lowerKey === 'error' || lowerKey === 'msg') {
          // Try to parse if it's JSON string
          if (value.startsWith('{')) {
            try {
              const parsed = JSON.parse(value)
              deepSearch(parsed, currentPath + '(parsed)')
            } catch {}
          }
          debugInfo.errorInfo.push({ label: key, value: value.slice(0, 200), path: currentPath, icon: '❌' })
        }
        // Stack trace
        else if (lowerKey === 'stack' || lowerKey === 'stacktrace') {
          debugInfo.errorInfo.push({ label: 'Stack Trace', value, path: currentPath, icon: '📚', isStack: true })
        }
        // Method
        else if (lowerKey === 'method' && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(value.toUpperCase())) {
          debugInfo.httpInfo.push({ label: 'Method', value: value.toUpperCase(), path: currentPath, icon: '📤' })
        }
        // Token/Key detection (mask them)
        else if (lowerKey.includes('token') || lowerKey.includes('key') || lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('api_token')) {
          const masked = value.length > 8 ? value.slice(0, 4) + '****' + value.slice(-4) : '****'
          debugInfo.securityInfo.push({ label: key, value: masked, originalValue: value, path: currentPath, icon: '🔐', sensitive: true })
        }
        // Context info
        else if (['hostname', 'host', 'context', 'service', 'name', 'label'].includes(lowerKey)) {
          debugInfo.contextInfo.push({ label: key, value, path: currentPath, icon: '🏷️' })
        }
        // Body/Response content (try to parse JSON)
        else if (lowerKey === 'body' || lowerKey === 'response' || lowerKey === 'request') {
          if (value.startsWith('{') || value.startsWith('[')) {
            try {
              const parsed = JSON.parse(value)
              deepSearch(parsed, currentPath + '(parsed)')
              debugInfo.requestInfo.push({ label: key, value: JSON.stringify(parsed, null, 2), path: currentPath, icon: '📦', isJson: true })
            } catch {
              debugInfo.requestInfo.push({ label: key, value, path: currentPath, icon: '📦' })
            }
          } else if (value) {
            debugInfo.requestInfo.push({ label: key, value, path: currentPath, icon: '📦' })
          }
        }
      } else if (typeof value === 'number') {
        // Status code
        if (lowerKey.includes('status') || lowerKey.includes('code') || lowerKey === 'responsecode') {
          const isError = value >= 400
          debugInfo.httpInfo.push({ 
            label: key, 
            value: String(value), 
            path: currentPath, 
            icon: isError ? '🔴' : '🟢',
            highlight: isError ? 'error' : 'success'
          })
        }
        // PID
        else if (lowerKey === 'pid') {
          debugInfo.contextInfo.push({ label: 'PID', value: String(value), path: currentPath, icon: '⚙️' })
        }
        // Level (Pino style)
        else if (lowerKey === 'level') {
          debugInfo.contextInfo.push({ label: 'Level', value: String(value), path: currentPath, icon: '📊' })
        }
        // Time
        else if (lowerKey === 'time' && value > 1000000000000) {
          debugInfo.contextInfo.push({ 
            label: 'Time', 
            value: new Date(value).toISOString(), 
            path: currentPath, 
            icon: '🕐' 
          })
        }
      } else if (typeof value === 'boolean') {
        if (lowerKey.includes('handle') || lowerKey.includes('report') || lowerKey.includes('retry')) {
          debugInfo.metadata.push({ label: key, value: String(value), path: currentPath, icon: '🔘' })
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recurse into nested objects
        if (lowerKey === 'err' || lowerKey === 'error') {
          deepSearch(value, currentPath)
        } else if (lowerKey === 'metadata' || lowerKey === 'state') {
          deepSearch(value, currentPath)
        } else if (lowerKey === 'response' || lowerKey === 'request') {
          deepSearch(value, currentPath)
        } else if (lowerKey === 'link') {
          deepSearch(value, currentPath)
        } else {
          deepSearch(value, currentPath)
        }
      }
    }
  }
  
  // Parse raw line if JSON
  try {
    const parsed = JSON.parse(entry.raw)
    deepSearch(parsed)
  } catch {
    // Not JSON, try to extract from fields
    if (entry.fields) {
      deepSearch(entry.fields)
    }
  }
  
  // Also check entry.fields directly
  if (entry.fields) {
    deepSearch(entry.fields, 'fields')
  }
  
  // Deduplicate by value
  const dedupe = (arr) => {
    const seen = new Set()
    return arr.filter(item => {
      const key = item.label + ':' + item.value
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  
  return {
    httpInfo: dedupe(debugInfo.httpInfo),
    errorInfo: dedupe(debugInfo.errorInfo),
    contextInfo: dedupe(debugInfo.contextInfo),
    securityInfo: dedupe(debugInfo.securityInfo),
    requestInfo: dedupe(debugInfo.requestInfo),
    metadata: dedupe(debugInfo.metadata)
  }
}

// Sensitive Value Component with toggle
function SensitiveValue({ masked, original, copyToClipboard }) {
  const [revealed, setRevealed] = useState(false)
  
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-amber-400 break-all">
        {revealed ? original : masked}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setRevealed(!revealed) }}
        className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        title={revealed ? 'Hide value' : 'Reveal value'}
      >
        {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
      {revealed && (
        <button
          onClick={(e) => { 
            e.stopPropagation()
            if (copyToClipboard) {
              copyToClipboard(original)
            } else {
              navigator.clipboard.writeText(original)
            }
          }}
          className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          title="Copy to clipboard"
        >
          <Copy className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

// Debug Info Section Component
function DebugInfoSection({ title, items, icon, color = 'blue', copyToClipboard }) {
  if (!items || items.length === 0) return null
  
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    amber: 'border-amber-500/30 bg-amber-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10',
    gray: 'border-gray-500/30 bg-gray-500/10'
  }
  
  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-[var(--text-secondary)]">
        <span>{icon}</span>
        <span>{title}</span>
        <span className="text-[var(--text-tertiary)]">({items.length})</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="text-[var(--text-tertiary)] flex-shrink-0">{item.label}:</span>
            {item.sensitive && item.originalValue ? (
              <SensitiveValue 
                masked={safeStringify(item.value)} 
                original={safeStringify(item.originalValue)} 
                copyToClipboard={copyToClipboard}
              />
            ) : item.isStack ? (
              <details className="flex-1 min-w-0">
                <summary className="text-[var(--text-secondary)] cursor-pointer hover:text-[var(--accent)]">
                  Click to expand stack trace
                </summary>
                <pre className="mt-1 p-2 rounded bg-[var(--bg-secondary)] text-red-400 text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[200px] overflow-y-auto">
                  {safeStringify(item.value)}
                </pre>
              </details>
            ) : item.isJson ? (
              <details className="flex-1 min-w-0">
                <summary className="text-[var(--text-secondary)] cursor-pointer hover:text-[var(--accent)]">
                  Click to expand JSON
                </summary>
                <pre className="mt-1 p-2 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[200px] overflow-y-auto">
                  {safeStringify(item.value)}
                </pre>
              </details>
            ) : (
              <span className={`font-mono break-all ${
                item.highlight === 'error' ? 'text-red-400 font-semibold' : 
                item.highlight === 'success' ? 'text-green-400' :
                item.sensitive ? 'text-amber-400' :
                'text-[var(--text-secondary)]'
              }`}>
                {safeStringify(item.value)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Log Entry Component
function LogEntry({ entry, expanded, onToggle, onFilter, searchTerm, devMode, copyToClipboard, showFormatChip }) {
  const levelConfig = LOG_LEVELS[entry.level] || LOG_LEVELS.INFO
  const Icon = levelConfig.icon
  const formatInfo = entry.detectedFormat ? FORMAT_DISPLAY[entry.detectedFormat] : null
  
  const highlightText = (text) => {
    if (!searchTerm || !text) return text
    const parts = String(text).split(new RegExp(`(${searchTerm})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={i} className="bg-yellow-500/50 text-yellow-200 rounded px-0.5">{part}</mark>
        : part
    )
  }
  
  // Extract debug info for dev mode
  const debugInfo = useMemo(() => {
    if (!devMode || !expanded) return null
    return extractDebugInfo(entry)
  }, [devMode, expanded, entry])
  
  const hasDebugInfo = debugInfo && (
    debugInfo.httpInfo.length > 0 ||
    debugInfo.errorInfo.length > 0 ||
    debugInfo.contextInfo.length > 0 ||
    debugInfo.securityInfo.length > 0 ||
    debugInfo.requestInfo.length > 0 ||
    debugInfo.metadata.length > 0
  )
  
  return (
    <div className={`border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]/50 transition-colors overflow-hidden ${expanded ? 'bg-[var(--bg-tertiary)]/30' : ''}`}>
      <div 
        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer min-w-0"
        onClick={onToggle}
      >
        <button className="mt-0.5 text-[var(--text-tertiary)] flex-shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {entry.unparsed ? (
          // Special display for unparsed entries
          <>
            <div className="px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 bg-gray-600/20 text-gray-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              UNPARSED
            </div>
            <span className="text-xs sm:text-sm text-gray-500 flex-1 truncate min-w-0 italic">
              Unable to parse this line
            </span>
          </>
        ) : (
          // Normal entry display
          <>
            <div className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${levelConfig.bg} ${levelConfig.text}`}>
              {entry.level}
            </div>
            
            {/* Format type chip for mixed logs */}
            {showFormatChip && formatInfo && (
              <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${formatInfo.color} hidden sm:flex items-center gap-1`} title={`Detected as ${formatInfo.name}`}>
                <span>{formatInfo.icon}</span>
                <span className="hidden lg:inline">{formatInfo.name}</span>
              </div>
            )}
            
            {entry.timestamp && (
              <span className="text-xs text-[var(--text-tertiary)] font-mono flex-shrink-0 hidden sm:inline">
                {safeStringify(entry.timestamp).length > 19 ? safeStringify(entry.timestamp).slice(0, 19) : safeStringify(entry.timestamp)}
              </span>
            )}
            
            {entry.source && (
              <span 
                className="text-xs text-[var(--accent)] cursor-pointer hover:underline truncate max-w-[120px] sm:max-w-[200px] hidden md:inline"
                onClick={(e) => { e.stopPropagation(); onFilter('source', entry.source) }}
                title={safeStringify(entry.source)}
              >
                [{safeStringify(entry.source)}]
              </span>
            )}
            
            <span className="text-xs sm:text-sm text-[var(--text-primary)] flex-1 truncate min-w-0">
              {highlightText(safeStringify(entry.message))}
            </span>
          </>
        )}
        
        <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0 hidden sm:inline">#{entry.lineNumber}</span>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-10 pb-3 space-y-3">
              {entry.unparsed ? (
                // Unparsed entry: show only raw log
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>This line could not be parsed. Raw content shown below:</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto text-gray-300">
                    {safeStringify(entry.raw)}
                  </pre>
                </div>
              ) : (
                // Normal entry content
                <>
                  {/* Full message */}
                  <div className="p-3 rounded-lg bg-[var(--bg-secondary)] font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto text-[var(--text-secondary)]">
                    {highlightText(safeStringify(entry.message))}
                  </div>
                  
                  {/* Dev Mode: Auto-detected Debug Info */}
                  {devMode && hasDebugInfo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[var(--accent)]">
                        <Zap className="w-3 h-3" />
                        <span className="font-medium">Auto-detected Debug Info</span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        <DebugInfoSection 
                          title="HTTP Info" 
                          items={debugInfo.httpInfo} 
                          icon="🌐" 
                          color="blue" 
                        />
                        <DebugInfoSection 
                          title="Error Details" 
                          items={debugInfo.errorInfo} 
                          icon="⚠️" 
                          color="red" 
                        />
                        <DebugInfoSection 
                          title="Context" 
                          items={debugInfo.contextInfo} 
                          icon="📋" 
                          color="gray" 
                        />
                        <DebugInfoSection 
                          title="Security (Masked)" 
                          items={debugInfo.securityInfo} 
                          icon="🔒" 
                          color="amber" 
                          copyToClipboard={copyToClipboard}
                        />
                        <DebugInfoSection 
                          title="Request/Response" 
                          items={debugInfo.requestInfo} 
                          icon="📨" 
                          color="purple" 
                        />
                        <DebugInfoSection 
                          title="Metadata" 
                          items={debugInfo.metadata} 
                          icon="🏷️" 
                          color="green" 
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Stack trace */}
                  {entry.stackTrace && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto text-red-400 max-h-[300px] overflow-y-auto">
                      {safeStringify(entry.stackTrace)}
                    </div>
                  )}
                  
                  {/* Fields */}
                  {entry.fields && Object.keys(entry.fields).length > 0 && !entry.unparsed && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(entry.fields).slice(0, 10).map(([key, value]) => (
                        <span 
                          key={key}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--bg-tertiary)] cursor-pointer hover:bg-[var(--bg-secondary)]"
                          onClick={(e) => { e.stopPropagation(); onFilter(key, safeStringify(value)) }}
                        >
                          <span className="text-[var(--text-tertiary)]">{key}:</span>
                          <span className="text-[var(--text-secondary)]">{safeStringify(value).slice(0, 50)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Dev Mode: Entry Details */}
                  {devMode && entry.detectedFormat && (
                    <div className="p-3 rounded-lg border border-dashed border-orange-500/30 bg-orange-500/5 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-orange-400">
                        <Settings2 className="w-3 h-3" />
                        <span className="font-medium">Parser Details (Dev Mode)</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <div className="text-[var(--text-tertiary)]">Detected Format</div>
                          <div className="text-orange-300 font-medium flex items-center gap-1">
                            {formatInfo && <span>{formatInfo.icon}</span>}
                            {formatInfo?.name || entry.detectedFormat}
                          </div>
                        </div>
                        <div>
                          <div className="text-[var(--text-tertiary)]">Line Number</div>
                          <div className="text-[var(--text-primary)] font-mono">#{entry.lineNumber}</div>
                        </div>
                        <div>
                          <div className="text-[var(--text-tertiary)]">Source</div>
                          <div className="text-[var(--text-primary)] font-mono truncate">{entry.source || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-[var(--text-tertiary)]">Raw Length</div>
                          <div className="text-[var(--text-primary)] font-mono">{entry.raw?.length || 0} chars</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Raw line */}
                  <details className="text-xs">
                    <summary className="text-[var(--text-tertiary)] cursor-pointer hover:text-[var(--text-secondary)]">
                      Show raw line
                    </summary>
                    <pre className="mt-2 p-2 rounded bg-[var(--bg-secondary)] overflow-x-auto text-[var(--text-tertiary)] whitespace-pre-wrap break-words">
                      {safeStringify(entry.raw)}
                    </pre>
                  </details>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Level Filter Component
function LevelFilter({ levels, selected, onChange, unparsedCount, showUnparsedOnly, onToggleUnparsed }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(LOG_LEVELS)
        .filter(([level]) => level !== 'UNPARSED') // UNPARSED has its own separate button
        .map(([level, config]) => {
        const count = levels[level] || 0
        const isSelected = selected.includes(level)
        return (
          <button
            key={level}
            onClick={() => {
              // If in unparsed-only mode, exit it first when clicking any level
              if (showUnparsedOnly) {
                onToggleUnparsed(false)
              }
              // Toggle the level selection
              if (isSelected) {
                onChange(selected.filter(l => l !== level))
              } else {
                onChange([...selected, level])
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              showUnparsedOnly ? 'opacity-50' :
              isSelected ? config.bg + ' ' + config.text : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
            }`}
          >
            {level}
            <span className="opacity-70">({count})</span>
          </button>
        )
      })}
      
      {/* Unparsed entries badge/button - separate from main filters */}
      {unparsedCount > 0 && (
        <>
          <div className="w-px h-5 bg-[var(--border-color)] mx-1" />
          <button
            onClick={() => onToggleUnparsed(!showUnparsedOnly)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              showUnparsedOnly 
                ? 'bg-gray-600/30 text-gray-300 ring-1 ring-gray-500' 
                : 'bg-gray-600/20 text-gray-500 hover:bg-gray-600/30'
            }`}
            title="Show unparsed entries only"
          >
            <AlertTriangle className="w-3 h-3" />
            Unparsed
            <span className="px-1.5 py-0.5 rounded bg-gray-600/50 text-gray-300">{unparsedCount}</span>
          </button>
        </>
      )}
    </div>
  )
}

// Stats Card
function StatsCard({ label, value, icon: Icon, color = 'text-[var(--accent)]' }) {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-[var(--bg-tertiary)] overflow-hidden">
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${color}`} />
        <span className="text-xs text-[var(--text-tertiary)] truncate">{label}</span>
      </div>
      <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] truncate">{value}</div>
    </div>
  )
}

export default function LogAnalyzer() {
  const { devMode, copyToClipboard, showToast } = useApp()
  const [input, setInput] = useState('')
  const [logs, setLogs] = useState({ entries: [], format: '', stats: {} })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevels, setSelectedLevels] = useState(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [viewMode, setViewMode] = useState('list')
  const [page, setPage] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [timeRange, setTimeRange] = useState({ start: '', end: '' })
  const [sortOrder, setSortOrder] = useState('asc')
  const [activeFilters, setActiveFilters] = useState({})
  const [showUnparsedOnly, setShowUnparsedOnly] = useState(false)
  const pageSize = 100
  const fileInputRef = useRef(null)
  
  // Parse logs when input changes
  useEffect(() => {
    if (!input.trim()) {
      setLogs({ entries: [], format: '', stats: {} })
      setShowUnparsedOnly(false) // Reset unparsed filter when clearing
      return
    }
    
    const parsed = parseLogs(input)
    setLogs(parsed)
    setPage(1)
    // Reset unparsed filter if no unparsed entries
    if (!parsed.stats.unparsed) {
      setShowUnparsedOnly(false)
    }
  }, [input])
  
  // Filter entries
  const filteredEntries = useMemo(() => {
    let entries = [...logs.entries]
    
    // If showing unparsed only mode, filter to only UNPARSED entries
    if (showUnparsedOnly) {
      entries = entries.filter(e => e.level === 'UNPARSED')
    } else {
      // Normal mode: filter by selected levels (UNPARSED entries are always hidden in normal mode)
      entries = entries.filter(e => selectedLevels.includes(e.level))
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      entries = entries.filter(e => 
        safeStringify(e.message)?.toLowerCase().includes(term) ||
        safeStringify(e.source)?.toLowerCase().includes(term) ||
        safeStringify(e.raw)?.toLowerCase().includes(term) ||
        JSON.stringify(e.fields).toLowerCase().includes(term)
      )
    }
    
    // Filter by time range
    if (timeRange.start || timeRange.end) {
      entries = entries.filter(e => {
        if (!e.timestamp) return true
        const ts = new Date(e.timestamp)
        if (isNaN(ts)) return true
        if (timeRange.start && ts < new Date(timeRange.start)) return false
        if (timeRange.end && ts > new Date(timeRange.end)) return false
        return true
      })
    }
    
    // Apply custom filters
    for (const [field, value] of Object.entries(activeFilters)) {
      entries = entries.filter(e => {
        if (field === 'source') return e.source === value
        return e.fields?.[field] === value
      })
    }
    
    // Sort
    if (sortOrder === 'desc') {
      entries = entries.reverse()
    }
    
    return entries
  }, [logs.entries, selectedLevels, searchTerm, timeRange, activeFilters, sortOrder, showUnparsedOnly])
  
  // Paginated entries
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, page])
  
  const totalPages = Math.ceil(filteredEntries.length / pageSize)
  
  // Timeline data for chart
  const timelineData = useMemo(() => {
    if (filteredEntries.length === 0) return []
    
    const buckets = {}
    for (const entry of filteredEntries) {
      if (!entry.timestamp) continue
      const ts = new Date(entry.timestamp)
      if (isNaN(ts)) continue
      
      // Bucket by minute
      const bucket = new Date(ts)
      bucket.setSeconds(0, 0)
      const key = bucket.toISOString()
      
      if (!buckets[key]) {
        buckets[key] = { time: bucket.toLocaleTimeString(), total: 0, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 }
      }
      buckets[key].total++
      if (buckets[key][entry.level] !== undefined) {
        buckets[key][entry.level]++
      }
    }
    
    return Object.values(buckets).sort((a, b) => new Date(a.time) - new Date(b.time)).slice(-60)
  }, [filteredEntries])
  
  // Level distribution
  const levelDistribution = useMemo(() => {
    return Object.entries(logs.stats.byLevel || {}).map(([name, value]) => ({
      name,
      value,
      color: LOG_LEVELS[name]?.color || '#9ca3af'
    }))
  }, [logs.stats.byLevel])
  
  // Handlers
  const handleFileDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setInput(e.target.result)
      showToast(`Loaded ${file.name}`)
    }
    reader.readAsText(file)
  }, [showToast])
  
  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }
  
  const addFilter = (field, value) => {
    setActiveFilters(prev => ({ ...prev, [field]: value }))
    showToast(`Filtering by ${field}: ${value}`)
  }
  
  const removeFilter = (field) => {
    setActiveFilters(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }
  
  const exportLogs = (format) => {
    let content = ''
    let filename = 'logs'
    let mimeType = 'text/plain'
    
    if (format === 'json') {
      content = JSON.stringify(filteredEntries, null, 2)
      filename = 'logs.json'
      mimeType = 'application/json'
    } else if (format === 'csv') {
      const headers = ['timestamp', 'level', 'source', 'message']
      content = headers.join(',') + '\n'
      content += filteredEntries.map(e => 
        headers.map(h => `"${String(e[h] || '').replace(/"/g, '""')}"`).join(',')
      ).join('\n')
      filename = 'logs.csv'
      mimeType = 'text/csv'
    } else {
      content = filteredEntries.map(e => e.raw).join('\n')
      filename = 'logs.txt'
    }
    
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${filteredEntries.length} entries`)
  }
  
  const clearAll = () => {
    setInput('')
    setLogs({ entries: [], format: '', stats: {} })
    setSearchTerm('')
    setSelectedLevels(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])
    setExpandedIds(new Set())
    setActiveFilters({})
    setTimeRange({ start: '', end: '' })
    setPage(1)
    setShowUnparsedOnly(false)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 w-full min-w-0"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">Log Analyzer</h1>
          <p className="text-sm text-[var(--text-secondary)]">Parse, search, and visualize log files locally</p>
        </div>
      </div>
      
      {/* Input Section */}
      {logs.entries.length === 0 && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-primary)]">Load Logs</label>
            <input type="file" ref={fileInputRef} onChange={handleFileDrop} accept=".log,.txt,.json,.ndjson" className="hidden" />
          </div>
          
          {/* Sample Logs */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">Try examples:</span>
            <button onClick={() => setInput(SAMPLE_LOGS.json)} className="glass-button text-xs py-1.5">
              <Braces className="w-3 h-3" />
              JSON Logs
            </button>
            <button onClick={() => setInput(SAMPLE_LOGS.apache)} className="glass-button text-xs py-1.5">
              <Globe className="w-3 h-3" />
              Apache/Nginx
            </button>
            <button onClick={() => setInput(SAMPLE_LOGS.application)} className="glass-button text-xs py-1.5">
              <Bug className="w-3 h-3" />
              App + Stack Trace
            </button>
            <button onClick={() => setInput(SAMPLE_LOGS.syslog)} className="glass-button text-xs py-1.5">
              <Server className="w-3 h-3" />
              Syslog
            </button>
          </div>
          
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
                : 'border-[var(--border-color)] hover:border-[var(--accent)]/50'
            }`}
          >
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`} />
            <p className="text-sm text-[var(--text-primary)] mb-1">Drop log files here or click to browse</p>
            <p className="text-xs text-[var(--text-tertiary)]">Supports .log, .txt, .json, .ndjson files</p>
          </div>
          
          {/* Or paste */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border-color)]" />
            <span className="text-xs text-[var(--text-tertiary)]">or paste logs</span>
            <div className="flex-1 h-px bg-[var(--border-color)]" />
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste log content here..."
            className="glass-input min-h-[200px] font-mono text-xs w-full resize-y"
          />
        </div>
      )}
      
      {/* Analysis View */}
      {logs.entries.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden">
            <StatsCard label="Total Entries" value={logs.stats.total?.toLocaleString()} icon={Layers} />
            <StatsCard label="Errors" value={logs.stats.byLevel?.ERROR || 0} icon={AlertCircle} color="text-red-400" />
            <StatsCard label="Warnings" value={logs.stats.byLevel?.WARN || 0} icon={AlertTriangle} color="text-amber-400" />
            <StatsCard label="Format" value={logs.stats.formatName} icon={FileText} color="text-blue-400" />
          </div>
          
          {/* Controls */}
          <div className="glass-card rounded-2xl p-4 space-y-4 overflow-hidden">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                  placeholder="Search logs..."
                  className="glass-input pl-9 text-sm w-full"
                />
              </div>
              
              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
                  {[
                    { id: 'list', icon: List, label: 'List' },
                    { id: 'chart', icon: Activity, label: 'Timeline' },
                    { id: 'stats', icon: BarChart3, label: 'Stats' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setViewMode(id)}
                      className={`px-2 sm:px-3 py-1.5 text-xs flex items-center gap-1 ${
                        viewMode === id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')} 
                  className={`glass-button text-xs py-1.5 px-2 ${sortOrder === 'desc' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : ''}`}
                  title={sortOrder === 'asc' ? 'Showing oldest first - click to show newest first' : 'Showing newest first - click to show oldest first'}
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
                </button>
                
                <div className="relative group">
                  <button className="glass-button text-xs py-1.5 px-2">
                    <Download className="w-3 h-3" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
                    <button onClick={() => exportLogs('json')} className="block w-full px-4 py-2 text-xs text-left hover:bg-[var(--bg-tertiary)]">Export as JSON</button>
                    <button onClick={() => exportLogs('csv')} className="block w-full px-4 py-2 text-xs text-left hover:bg-[var(--bg-tertiary)]">Export as CSV</button>
                    <button onClick={() => exportLogs('txt')} className="block w-full px-4 py-2 text-xs text-left hover:bg-[var(--bg-tertiary)]">Export as Text</button>
                  </div>
                </div>
                
                <button onClick={clearAll} className="glass-button text-xs py-1.5 px-2 text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* Level Filters */}
            <LevelFilter 
              levels={logs.stats.byLevel || {}} 
              selected={selectedLevels} 
              onChange={(levels) => { setSelectedLevels(levels); setPage(1) }}
              unparsedCount={logs.stats.unparsed || 0}
              showUnparsedOnly={showUnparsedOnly}
              onToggleUnparsed={(val) => { setShowUnparsedOnly(val); setPage(1) }}
            />
            
            {/* Active Filters */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">Active filters:</span>
                {Object.entries(activeFilters).map(([field, value]) => (
                  <span key={field} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[var(--accent)]/20 text-[var(--accent)]">
                    {field}: {String(value).slice(0, 20)}
                    <button onClick={() => removeFilter(field)} className="hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Results count */}
            <div className="text-xs text-[var(--text-tertiary)]">
              {showUnparsedOnly ? (
                <>Showing {filteredEntries.length} unparsed entries</>
              ) : (
                <>
                  Showing {filteredEntries.length} of {logs.stats.parsed || logs.entries.length} entries
                  {searchTerm && ` matching "${searchTerm}"`}
                  {logs.stats.unparsed > 0 && !showUnparsedOnly && (
                    <span className="text-gray-500 ml-1">
                      ({logs.stats.unparsed} unparsed hidden)
                    </span>
                  )}
                </>
              )}
            </div>
            
            {/* Format Legend for mixed logs */}
            {logs.stats.isMixedFormat && logs.stats.formatBreakdown && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--text-tertiary)]">Formats:</span>
                {Object.entries(logs.stats.formatBreakdown).map(([formatKey, count]) => {
                  const display = FORMAT_DISPLAY[formatKey]
                  return (
                    <span key={formatKey} className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${display?.color || 'bg-gray-500/20 text-gray-400'}`}>
                      <span>{display?.icon || '📄'}</span>
                      <span>{display?.name || formatKey}</span>
                      <span className="opacity-60">({count})</span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* List View */}
          {viewMode === 'list' && (
            <div className="glass-card rounded-2xl overflow-hidden max-w-full">
              <div className="max-h-[600px] overflow-y-auto overflow-x-hidden">
                {paginatedEntries.length === 0 ? (
                  <div className="p-12 text-center text-[var(--text-tertiary)]">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No matching log entries</p>
                  </div>
                ) : (
                  paginatedEntries.map(entry => (
                    <LogEntry
                      key={entry.id}
                      entry={entry}
                      expanded={expandedIds.has(entry.id)}
                      onToggle={() => toggleExpanded(entry.id)}
                      onFilter={addFilter}
                      searchTerm={searchTerm}
                      devMode={devMode}
                      copyToClipboard={copyToClipboard}
                      showFormatChip={logs.stats.isMixedFormat}
                    />
                  ))
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[var(--border-color)]">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30">
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30">
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Timeline View */}
          {viewMode === 'chart' && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Log Volume Over Time</h3>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="time" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="ERROR" stackId="1" fill={LOG_LEVELS.ERROR.color} stroke={LOG_LEVELS.ERROR.color} />
                    <Area type="monotone" dataKey="WARN" stackId="1" fill={LOG_LEVELS.WARN.color} stroke={LOG_LEVELS.WARN.color} />
                    <Area type="monotone" dataKey="INFO" stackId="1" fill={LOG_LEVELS.INFO.color} stroke={LOG_LEVELS.INFO.color} />
                    <Area type="monotone" dataKey="DEBUG" stackId="1" fill={LOG_LEVELS.DEBUG.color} stroke={LOG_LEVELS.DEBUG.color} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-[var(--text-tertiary)]">
                  <p>No timestamp data available for timeline</p>
                </div>
              )}
            </div>
          )}
          
          {/* Stats View */}
          {viewMode === 'stats' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Level Distribution */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Log Level Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={levelDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {levelDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Level Bar Chart */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Entries by Level</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={levelDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {levelDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Dev Mode: Parser Details */}
          {devMode && (
            <div className="glass-card rounded-2xl p-4 sm:p-6 border-dashed border-2 border-orange-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-orange-400">Parser Details (Dev Mode)</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-[var(--text-tertiary)]">Detected Format</div>
                  <div className="text-[var(--text-primary)] font-medium">{logs.stats.formatName}</div>
                </div>
                <div>
                  <div className="text-[var(--text-tertiary)]">Confidence</div>
                  <div className="text-[var(--text-primary)] font-medium">{logs.stats.confidence}%</div>
                </div>
                <div>
                  <div className="text-[var(--text-tertiary)]">Time Range</div>
                  <div className="text-[var(--text-primary)] font-medium">
                    {logs.stats.timeRange?.start ? new Date(logs.stats.timeRange.start).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--text-tertiary)]">Parsing Speed</div>
                  <div className="text-[var(--text-primary)] font-medium">{logs.entries.length} entries</div>
                </div>
              </div>
              
              {/* Format breakdown for mixed logs */}
              {logs.stats.isMixedFormat && logs.stats.formatBreakdown && (
                <div className="mt-4 pt-4 border-t border-orange-500/20">
                  <div className="text-[var(--text-tertiary)] text-xs mb-2">Format Breakdown</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(logs.stats.formatBreakdown).map(([formatKey, count]) => (
                      <div key={formatKey} className="px-2 py-1 rounded bg-orange-500/10 text-orange-300 text-xs flex items-center gap-1">
                        <span className="font-medium">{LOG_PATTERNS[formatKey]?.name || formatKey}</span>
                        <span className="text-orange-500">({count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

