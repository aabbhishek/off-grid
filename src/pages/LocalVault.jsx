// Local Vault - Encrypted Credential Storage
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import {
  Shield, Lock, Unlock, Plus, Search, Folder, FolderPlus, Server, Key,
  Settings, Heart, Download, Upload, Trash2, Edit, Copy, Check, X,
  ChevronRight, ChevronDown, Eye, EyeOff, ExternalLink, Terminal,
  MoreVertical, AlertTriangle, Clock, Activity, RefreshCw, Filter,
  Tag, Globe, Database, Cloud, GitBranch, Dices, FileDown, FileUp,
  HardDrive, Info, FileText, Save, FolderOpen, Share2, LayoutGrid,
  List, Table2, Palette
} from 'lucide-react'

// Import components
import { VaultCreate, VaultUnlock } from '../components/vault/VaultSetup'
import ServerForm from '../components/vault/ServerForm'
import CredentialForm, { CREDENTIAL_TYPES } from '../components/vault/CredentialForm'
import PasswordGenerator from '../components/vault/PasswordGenerator'
import ColorPicker, { COLOR_PALETTE, getContrastColor, generateChildColors } from '../components/vault/ColorPicker'
import CredentialViewer, { ViewModeSelector, CredentialViewModal } from '../components/vault/CredentialViewer'
import InfrastructureIcon, { InfrastructureSelector, INFRASTRUCTURE_ICONS } from '../components/vault/CloudProviderIcons'
import ShareModal, { ImportFromShareModal } from '../components/vault/ShareCredentials'
import { 
  generateSSHConfigEntry, generateSSHConfig, getSSHConfigInstructions, downloadAsFile,
  generateSSHConfigFilename, saveSSHConfigToFile, getIncludeInstructions, isFileSystemAccessSupported
} from '../utils/sshConfig'

// Import utilities
import { encrypt, decrypt, generateSalt, deriveKey, generateVerificationToken } from '../utils/vaultCrypto'
import {
  initDB, vaultExists, getVaultMetadata, saveVaultMetadata,
  getAllServers, saveServer, deleteServer, getServer,
  getAllFolders, saveFolder, deleteFolder,
  deleteVault, getVaultStats, getStorageUsage, checkBrowserSupport
} from '../utils/vaultDB'
import {
  vaultStorage, checkFileSystemSupport, getBrowserInfo,
  showSaveFilePicker, showOpenFilePicker
} from '../utils/vaultStorage'

// Environment colors
const ENV_COLORS = {
  production: '#ef4444',
  staging: '#f97316',
  development: '#22c55e',
  testing: '#3b82f6',
  other: '#8b5cf6'
}

// Health status colors
const HEALTH_COLORS = {
  healthy: '#22c55e',
  degraded: '#eab308',
  down: '#ef4444',
  unknown: '#6b7280'
}

// Clipboard with auto-clear
const useClipboard = (timeout = 30000) => {
  const [copied, setCopied] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)
  const intervalRef = useRef(null)

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setCountdown(Math.ceil(timeout / 1000))

    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    timerRef.current = setTimeout(async () => {
      try {
        await navigator.clipboard.writeText('')
      } catch (e) {}
      setCopied(null)
      setCountdown(0)
    }, timeout)
  }

  const clear = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    try {
      await navigator.clipboard.writeText('')
    } catch (e) {}
    setCopied(null)
    setCountdown(0)
  }

  return { copied, countdown, copy, clear }
}

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`relative z-[201] w-full ${sizeClasses[size]} glass-card rounded-2xl max-h-[90vh] overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Server Card Component
const ServerCard = ({ 
  server, 
  folders, 
  onEdit, 
  onDelete, 
  onViewCredentials,
  onShare,
  onExportSSHConfig,
  encryptionKey,
  credentialViewMode = 'row'
}) => {
  const [expanded, setExpanded] = useState(false)
  const [decryptedData, setDecryptedData] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [localViewMode, setLocalViewMode] = useState(credentialViewMode)
  const [showDevInfo, setShowDevInfo] = useState(false)
  const { copied, countdown, copy, clear } = useClipboard()
  const { showToast, devMode } = useApp()

  useEffect(() => {
    const decryptServer = async () => {
      if (server.encryptedData && encryptionKey) {
        try {
          const data = await decrypt(server.encryptedData, encryptionKey)
          setDecryptedData(data)
        } catch (e) {
          console.error('Failed to decrypt server:', e)
        }
      }
    }
    decryptServer()
  }, [server, encryptionKey])

  if (!decryptedData) {
    return (
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] animate-pulse">
        <div className="h-6 bg-[var(--bg-tertiary)] rounded w-1/3" />
      </div>
    )
  }

  const folder = folders.find(f => f.id === server.folderId)
  const envColor = ENV_COLORS[decryptedData.environment] || ENV_COLORS.other
  const healthColor = HEALTH_COLORS[server.healthStatus || 'unknown']

  const handleCopySSH = () => {
    const cmd = `ssh ${decryptedData.username || 'root'}@${decryptedData.hostname}${decryptedData.port !== 22 ? ` -p ${decryptedData.port}` : ''}`
    copy(cmd, 'ssh')
    showToast('SSH command copied!')
  }

  const handleCopyPassword = () => {
    if (decryptedData.password) {
      copy(decryptedData.password, 'password')
      showToast('Password copied! Will clear in 30s')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-[var(--bg-tertiary)]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: healthColor }}
            title={server.healthStatus || 'Unknown'}
          />

          {/* Server Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Infrastructure Icon */}
              {decryptedData.infrastructure ? (
                <InfrastructureIcon type={decryptedData.infrastructure} size="sm" />
              ) : (
                <Server className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
              )}
              <h3 className="font-medium text-[var(--text-primary)] truncate">{decryptedData.name}</h3>
              {/* Server Color Indicator */}
              {decryptedData.color && (
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ background: decryptedData.color }}
                />
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${envColor}20`, color: envColor }}
              >
                {decryptedData.environment}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-tertiary)]">
              <span className="font-mono">{decryptedData.hostname}</span>
              <span>•</span>
              <span>{decryptedData.protocol?.toUpperCase()}</span>
              {decryptedData.infrastructure && (
                <>
                  <span>•</span>
                  <span>{INFRASTRUCTURE_ICONS[decryptedData.infrastructure]?.name || decryptedData.infrastructure}</span>
                </>
              )}
              {decryptedData.credentials?.length > 0 && (
                <>
                  <span>•</span>
                  <span>{decryptedData.credentials.length} credentials</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {decryptedData.protocol === 'ssh' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCopySSH() }}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                title="Copy SSH command"
              >
                <Terminal className="w-4 h-4" />
              </button>
            )}
            {onShare && decryptedData.credentials?.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare(server, decryptedData) }}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(server) }}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent)]"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            {expanded ? <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border-color)]"
          >
            <div className="p-4 space-y-4">
              {/* Connection Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Host</div>
                  <div className="font-mono text-sm text-[var(--text-primary)]">{decryptedData.hostname}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Port</div>
                  <div className="font-mono text-sm text-[var(--text-primary)]">{decryptedData.port}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Username</div>
                  <div className="font-mono text-sm text-[var(--text-primary)]">{decryptedData.username || 'root'}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Password</div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-sm text-[var(--text-primary)]">
                      {showPassword ? decryptedData.password : '••••••••'}
                    </span>
                    {decryptedData.password && (
                      <>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                        >
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={handleCopyPassword}
                          className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                        >
                          {copied === 'password' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {decryptedData.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {decryptedData.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                    >
                      <Tag className="w-3 h-3 inline mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Credentials */}
              {decryptedData.credentials?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[var(--text-tertiary)] font-medium">
                      Credentials ({decryptedData.credentials.length})
                    </div>
                    <ViewModeSelector value={localViewMode} onChange={setLocalViewMode} />
                  </div>
                  
                  <CredentialViewer
                    credentials={decryptedData.credentials}
                    viewMode={localViewMode}
                    server={decryptedData}
                    onViewCredential={(cred) => onViewCredentials(server, cred, 'view')}
                    onEditCredential={(cred) => onViewCredentials(server, cred, 'edit')}
                  />
                </div>
              )}

              {/* Dev Mode: Server Details */}
              {devMode && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowDevInfo(!showDevInfo)}
                    className="flex items-center gap-2 text-xs font-medium text-orange-400 hover:text-orange-300"
                  >
                    <Database className="w-3 h-3" />
                    {showDevInfo ? 'Hide' : 'Show'} Server Details (Dev Mode)
                    <ChevronDown className={`w-3 h-3 transition-transform ${showDevInfo ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showDevInfo && (
                    <div className="p-3 rounded-lg border-dashed border-2 border-orange-500/30 bg-orange-500/5 space-y-3">
                      {/* Storage Info */}
                      <div>
                        <div className="text-xs font-semibold text-orange-400 mb-2">Storage Details</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                            <div className="text-[var(--text-tertiary)]">Server ID</div>
                            <div className="text-[var(--text-primary)] font-mono truncate" title={server.id}>{server.id.slice(0, 8)}...</div>
                          </div>
                          <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                            <div className="text-[var(--text-tertiary)]">Encrypted Size</div>
                            <div className="text-[var(--text-primary)] font-mono">{server.encryptedData ? `${(JSON.stringify(server.encryptedData).length / 1024).toFixed(2)} KB` : 'N/A'}</div>
                          </div>
                          <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                            <div className="text-[var(--text-tertiary)]">Created</div>
                            <div className="text-[var(--text-primary)] font-mono">{server.createdAt ? new Date(server.createdAt).toLocaleDateString() : 'N/A'}</div>
                          </div>
                          <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                            <div className="text-[var(--text-tertiary)]">Folder ID</div>
                            <div className="text-[var(--text-primary)] font-mono truncate" title={server.folderId || 'None'}>{server.folderId ? server.folderId.slice(0, 8) + '...' : 'Root'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Credential Breakdown */}
                      {decryptedData.credentials?.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-orange-400 mb-2">Credential Breakdown</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {Object.entries(
                              decryptedData.credentials.reduce((acc, cred) => {
                                acc[cred.type] = (acc[cred.type] || 0) + 1
                                return acc
                              }, {})
                            ).map(([type, count]) => (
                              <div key={type} className="p-2 rounded bg-[var(--bg-tertiary)]">
                                <div className="text-[var(--text-tertiary)] capitalize">{type}</div>
                                <div className="text-[var(--text-primary)] font-mono">{count}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Connection Details */}
                      <div>
                        <div className="text-xs font-semibold text-orange-400 mb-2">Connection Config</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                            <div className="text-[var(--text-tertiary)]">Protocol</div>
                            <div className="text-[var(--text-primary)] font-mono uppercase">{decryptedData.protocol || 'SSH'}</div>
                          </div>
                          <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                            <div className="text-[var(--text-tertiary)]">Auth Method</div>
                            <div className="text-[var(--text-primary)] font-mono capitalize">{decryptedData.authMethod || 'password'}</div>
                          </div>
                          <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                            <div className="text-[var(--text-tertiary)]">Infrastructure</div>
                            <div className="text-[var(--text-primary)] font-mono capitalize">{decryptedData.infrastructure || 'internal'}</div>
                          </div>
                          <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                            <div className="text-[var(--text-tertiary)]">Health Status</div>
                            <div className="text-[var(--text-primary)] font-mono capitalize">{server.healthStatus || 'unknown'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Health Check Config */}
                      {decryptedData.healthCheckUrl && (
                        <div>
                          <div className="text-xs font-semibold text-orange-400 mb-2">Health Check Config</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                              <div className="text-[var(--text-tertiary)]">URL</div>
                              <div className="text-[var(--text-primary)] font-mono break-all">{decryptedData.healthCheckUrl}</div>
                            </div>
                            <div className="p-2 rounded bg-[var(--bg-tertiary)]">
                              <div className="text-[var(--text-tertiary)]">Expected Status / Interval / On Unlock</div>
                              <div className="text-[var(--text-primary)] font-mono">
                                {decryptedData.healthCheckExpectedStatus || 200} / {decryptedData.healthCheckInterval || 5}min / {decryptedData.healthCheckOnUnlock ? 'Yes' : 'No'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  onClick={() => onViewCredentials(server)}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Credential
                </button>
                {decryptedData.protocol === 'ssh' && onExportSSHConfig && (
                  <button
                    onClick={() => onExportSSHConfig(decryptedData)}
                    className="py-2 px-4 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                    title="Export SSH Config"
                  >
                    <FileText className="w-4 h-4" />
                    SSH Config
                  </button>
                )}
                {onShare && decryptedData.credentials?.length > 0 && (
                  <button
                    onClick={() => onShare(server, decryptedData)}
                    className="py-2 px-4 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                )}
                <button
                  onClick={() => onDelete(server)}
                  className="py-2 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Health Monitoring View Component
const HealthMonitoringView = ({
  servers,
  encryptionKey,
  healthResults,
  healthCheckRunning,
  isRunningAllHealthChecks,
  onRunHealthCheck,
  onRunAllHealthChecks,
  onEditServer
}) => {
  const { showToast, devMode } = useApp()
  const [decryptedServers, setDecryptedServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDevInfo, setExpandedDevInfo] = useState(null) // Track which server's dev info is expanded
  
  // Decrypt all servers to get health check URLs
  useEffect(() => {
    const decryptAll = async () => {
      setLoading(true)
      const results = []
      
      for (const server of servers) {
        if (server.encryptedData && encryptionKey) {
          try {
            const data = await decrypt(server.encryptedData, encryptionKey)
            results.push({ server, data })
          } catch (e) {
            console.error('Failed to decrypt server:', e)
          }
        }
      }
      
      setDecryptedServers(results)
      setLoading(false)
    }
    
    decryptAll()
  }, [servers, encryptionKey])
  
  // Filter servers with health check URLs
  const serversWithHealthCheck = decryptedServers.filter(s => s.data?.healthCheckUrl)
  const serversWithoutHealthCheck = decryptedServers.filter(s => !s.data?.healthCheckUrl)
  
  // Calculate stats
  const stats = {
    total: serversWithHealthCheck.length,
    healthy: serversWithHealthCheck.filter(s => healthResults[s.server.id]?.status === 'healthy').length,
    degraded: serversWithHealthCheck.filter(s => healthResults[s.server.id]?.status === 'degraded').length,
    down: serversWithHealthCheck.filter(s => healthResults[s.server.id]?.status === 'down').length,
    unknown: serversWithHealthCheck.filter(s => !healthResults[s.server.id] || healthResults[s.server.id]?.status === 'unknown').length
  }
  
  const handleRunAllChecks = async () => {
    if (serversWithHealthCheck.length === 0) {
      showToast('No servers have health check URLs configured')
      return
    }
    showToast(`Running health checks on ${serversWithHealthCheck.length} server(s)...`)
    await onRunAllHealthChecks(serversWithHealthCheck)
    showToast('Health checks completed')
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
            <Server className="w-4 h-4" />
            <span className="text-xs">Total</span>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Check className="w-4 h-4" />
            <span className="text-xs">Healthy</span>
          </div>
          <div className="text-2xl font-bold text-emerald-500">{stats.healthy}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Degraded</span>
          </div>
          <div className="text-2xl font-bold text-amber-500">{stats.degraded}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <X className="w-4 h-4" />
            <span className="text-xs">Down</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{stats.down}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Unknown</span>
          </div>
          <div className="text-2xl font-bold text-[var(--text-tertiary)]">{stats.unknown}</div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-[var(--text-primary)]">
          Monitored Servers ({serversWithHealthCheck.length})
        </h3>
        <button
          onClick={handleRunAllChecks}
          disabled={isRunningAllHealthChecks || serversWithHealthCheck.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRunningAllHealthChecks ? 'animate-spin' : ''}`} />
          {isRunningAllHealthChecks ? 'Checking...' : 'Check All'}
        </button>
      </div>
      
      {/* Servers with Health Check */}
      {serversWithHealthCheck.length > 0 ? (
        <div className="space-y-3">
          {serversWithHealthCheck.map(({ server, data }) => {
            const result = healthResults[server.id]
            const isChecking = healthCheckRunning[server.id]
            const healthColor = result ? HEALTH_COLORS[result.status] : HEALTH_COLORS.unknown
            
            return (
              <motion.div
                key={server.id}
                layout
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Status Indicator */}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${isChecking ? 'animate-pulse' : ''}`}
                    style={{ background: healthColor }}
                  />
                  
                  {/* Server Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[var(--text-primary)] truncate">{data.name}</h4>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${ENV_COLORS[data.environment] || ENV_COLORS.other}20`, color: ENV_COLORS[data.environment] || ENV_COLORS.other }}
                      >
                        {data.environment}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] truncate mt-1">
                      {data.healthCheckUrl}
                    </div>
                  </div>
                  
                  {/* Health Result */}
                  <div className="text-right flex-shrink-0 max-w-[220px]">
                    {result ? (
                      <>
                        <div className="text-sm font-medium" style={{ color: healthColor }}>
                          {result.status === 'healthy' && 'Healthy'}
                          {result.status === 'degraded' && 'Degraded'}
                          {result.status === 'down' && 'Down'}
                          {result.status === 'unknown' && 'Unknown'}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {result.responseTime}ms • {result.statusCode && `${result.statusCode} • `}
                          {new Date(result.lastCheck).toLocaleTimeString()}
                        </div>
                        {result.method && result.method !== 'cors' && (
                          <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                            via {result.method === 'no-cors' ? 'indirect check' : result.method === 'image-probe' ? 'image probe' : result.method}
                          </div>
                        )}
                        {result.note && (
                          <div className="text-[10px] text-[var(--accent)] mt-0.5 truncate" title={result.note}>
                            {result.note}
                          </div>
                        )}
                        {result.error && (
                          <div className="text-xs text-red-400 mt-1 truncate" title={result.error}>
                            {result.error}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-[var(--text-tertiary)]">Not checked</div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {devMode && result && (
                      <button
                        onClick={() => setExpandedDevInfo(expandedDevInfo === server.id ? null : server.id)}
                        className={`p-2 rounded-lg hover:bg-[var(--bg-tertiary)] ${expandedDevInfo === server.id ? 'text-orange-400' : 'text-[var(--text-secondary)]'} hover:text-orange-400`}
                        title="Dev Info"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onRunHealthCheck(server.id, data)}
                      disabled={isChecking}
                      className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-50"
                      title="Run health check"
                    >
                      <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => onEditServer(server)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent)]"
                      title="Edit server"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={data.healthCheckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent)]"
                      title="Open URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                
                {/* Dev Mode: Health Check Details */}
                {devMode && expandedDevInfo === server.id && result && (
                  <div className="mt-4 pt-4 border-t border-dashed border-orange-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-semibold text-orange-400">Health Check Details (Dev Mode)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                        <div className="text-[var(--text-tertiary)]">Detection Method</div>
                        <div className="text-[var(--text-primary)] font-mono">
                          {result.method === 'cors' && 'Direct CORS'}
                          {result.method === 'no-cors' && 'No-CORS Mode'}
                          {result.method === 'image-probe' && 'Image Probe'}
                          {result.method === 'all-failed' && 'All Methods Failed'}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                        <div className="text-[var(--text-tertiary)]">Response Time</div>
                        <div className="text-[var(--text-primary)] font-mono">{result.responseTime}ms</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                        <div className="text-[var(--text-tertiary)]">Status Code</div>
                        <div className="text-[var(--text-primary)] font-mono">{result.statusCode || 'N/A'}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                        <div className="text-[var(--text-tertiary)]">Last Check</div>
                        <div className="text-[var(--text-primary)] font-mono">{new Date(result.lastCheck).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                        <div className="text-[var(--text-tertiary)]">Health Check URL</div>
                        <div className="text-[var(--text-primary)] font-mono break-all">{data.healthCheckUrl}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                        <div className="text-[var(--text-tertiary)]">Expected Status</div>
                        <div className="text-[var(--text-primary)] font-mono">{data.healthCheckExpectedStatus || 200}</div>
                      </div>
                    </div>
                    {result.error && (
                      <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="text-red-400 text-xs">
                          <span className="font-semibold">Error:</span> {result.error}
                        </div>
                      </div>
                    )}
                    {result.note && (
                      <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="text-orange-400 text-xs">
                          <span className="font-semibold">Note:</span> {result.note}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Health Checks Configured</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Add a health check URL to your servers to monitor their availability.
          </p>
        </div>
      )}
      
      {/* Servers without Health Check */}
      {serversWithoutHealthCheck.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">
            Servers without Health Monitoring ({serversWithoutHealthCheck.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {serversWithoutHealthCheck.map(({ server, data }) => (
              <div
                key={server.id}
                className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Server className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)] truncate">{data.name}</span>
                </div>
                <button
                  onClick={() => onEditServer(server)}
                  className="text-xs text-[var(--accent)] hover:underline flex-shrink-0"
                >
                  Configure
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Info Note */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)] mb-2">How Health Checks Work</p>
            <p className="mb-2">
              Health checks run entirely in your browser using multiple detection methods:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Direct request</strong> — Standard CORS request (most accurate when supported)</li>
              <li><strong>Indirect check</strong> — Detects if server responds without reading content</li>
              <li><strong>Image probe</strong> — Tests reachability via favicon loading</li>
            </ul>
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              💡 For best results, enable CORS on your health endpoints with: <code className="px-1 rounded bg-[var(--bg-tertiary)]">Access-Control-Allow-Origin: *</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main LocalVault Component
const LocalVault = () => {
  const { showToast, devMode } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Check for incoming share data in URL
  const [incomingShareData, setIncomingShareData] = useState(null)
  const [showImportShareModal, setShowImportShareModal] = useState(false)
  
  // Vault state
  const [vaultState, setVaultState] = useState('loading') // loading, create, locked, unlocked
  const [encryptionKey, setEncryptionKey] = useState(null)
  const [vaultMetadata, setVaultMetadata] = useState(null)
  const [vaultStats, setVaultStats] = useState({ serverCount: 0, credentialCount: 0, folderCount: 0 })
  
  // Storage state
  const [storageType, setStorageType] = useState('indexeddb') // 'indexeddb' or 'file'
  const [fileName, setFileName] = useState(null)
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved', 'pending', 'saving', 'error'
  const [lastSaveTime, setLastSaveTime] = useState(null)
  
  // Data state
  const [servers, setServers] = useState([])
  const [folders, setFolders] = useState([])
  const [decryptedFolders, setDecryptedFolders] = useState([])
  
  // UI state
  const [view, setView] = useState('servers') // servers, health, settings, generator
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [filters, setFilters] = useState({ environment: [], infrastructure: [], health: [] })
  
  // Modals
  const [showServerModal, setShowServerModal] = useState(false)
  const [showCredentialModal, setShowCredentialModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showImportExport, setShowImportExport] = useState(false)
  const [showGeneratorModal, setShowGeneratorModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSSHConfigModal, setShowSSHConfigModal] = useState(false)
  const [showCredentialViewModal, setShowCredentialViewModal] = useState(false)
  
  const [editingServer, setEditingServer] = useState(null)
  const [editingServerDecrypted, setEditingServerDecrypted] = useState(null)
  const [editingCredential, setEditingCredential] = useState(null)
  const [selectedServer, setSelectedServer] = useState(null)
  const [shareServerData, setShareServerData] = useState(null) // Decrypted data for sharing
  const [viewingCredential, setViewingCredential] = useState(null)
  
  // View preferences
  const [credentialViewMode, setCredentialViewMode] = useState('row') // row, cards, table
  
  // Health monitoring state
  const [healthResults, setHealthResults] = useState({}) // { serverId: { status, lastCheck, responseTime, error } }
  const [healthCheckRunning, setHealthCheckRunning] = useState({}) // { serverId: true/false }
  const [isRunningAllHealthChecks, setIsRunningAllHealthChecks] = useState(false)
  const healthCheckIntervalRef = useRef(null)
  
  // Check for share parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const shareData = searchParams.get('share')
    if (shareData) {
      setIncomingShareData(shareData)
      setShowImportShareModal(true)
      // Clear the share parameter from URL
      navigate('/vault', { replace: true })
    }
  }, [location.search, navigate])
  
  // Decrypt editing server when selected
  useEffect(() => {
    const decryptServer = async () => {
      if (editingServer?.encryptedData && encryptionKey) {
        try {
          const decrypted = await decrypt(editingServer.encryptedData, encryptionKey)
          setEditingServerDecrypted(decrypted)
        } catch (e) {
          console.error('Failed to decrypt server:', e)
          setEditingServerDecrypted(null)
        }
      } else {
        setEditingServerDecrypted(null)
      }
    }
    decryptServer()
  }, [editingServer, encryptionKey])
  
  // Import state
  const [importData, setImportData] = useState(null)
  const [importConflicts, setImportConflicts] = useState({ servers: [], folders: [] })
  const [importMode, setImportMode] = useState('skip') // 'skip', 'replace', 'merge'
  
  // Auto-lock timer
  const lockTimerRef = useRef(null)
  
  // Check browser support
  const browserSupport = useMemo(() => checkBrowserSupport(), [])
  
  // Initialize vault
  useEffect(() => {
    const init = async () => {
      if (!browserSupport.supported) {
        setVaultState('unsupported')
        return
      }
      
      try {
        await initDB()
        
        // Initialize storage and check for existing vault
        const type = await vaultStorage.initialize()
        setStorageType(type)
        setFileName(vaultStorage.getFileName())
        
        // Set up save status callback for file storage
        vaultStorage.onSaveStatusChange = (status, data) => {
          setSaveStatus(status)
          if (status === 'saved') {
            setLastSaveTime(data)
          }
        }
        
        const exists = await vaultStorage.exists()
        
        if (exists) {
          if (type === 'file') {
            // For file storage, check if we need permission
            const needsPermission = await vaultStorage.needsFilePermission()
            setVaultState('locked')
          } else {
            const metadata = await getVaultMetadata()
            setVaultMetadata(metadata)
            const stats = await getVaultStats()
            setVaultStats(stats)
            setVaultState('locked')
          }
        } else {
          setVaultState('create')
        }
      } catch (e) {
        console.error('Failed to initialize vault:', e)
        setVaultState('error')
      }
    }
    
    init()
  }, [browserSupport])
  
  // Load data when unlocked
  useEffect(() => {
    const loadData = async () => {
      if (vaultState !== 'unlocked' || !encryptionKey) return
      
      try {
        const [serversData, foldersData] = await Promise.all([
          getAllServers(),
          getAllFolders()
        ])
        
        setServers(serversData)
        setFolders(foldersData)
        
        // Decrypt folder names
        const decrypted = await Promise.all(
          foldersData.map(async (folder) => {
            if (folder.encryptedName) {
              try {
                const name = await decrypt(folder.encryptedName, encryptionKey)
                return { ...folder, name }
              } catch (e) {
                return { ...folder, name: 'Unknown' }
              }
            }
            return folder
          })
        )
        setDecryptedFolders(decrypted)
      } catch (e) {
        console.error('Failed to load data:', e)
      }
    }
    
    loadData()
  }, [vaultState, encryptionKey])
  
  // Auto-lock functionality
  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current)
    }
    
    const timeout = vaultMetadata?.settings?.autoLockTimeout || 15
    if (timeout > 0) {
      lockTimerRef.current = setTimeout(() => {
        handleLock()
      }, timeout * 60 * 1000)
    }
  }, [vaultMetadata])
  
  useEffect(() => {
    if (vaultState === 'unlocked') {
      resetLockTimer()
      
      const handleActivity = () => resetLockTimer()
      window.addEventListener('click', handleActivity)
      window.addEventListener('keydown', handleActivity)
      
      return () => {
        window.removeEventListener('click', handleActivity)
        window.removeEventListener('keydown', handleActivity)
        if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
      }
    }
  }, [vaultState, resetLockTimer])
  
  // Health check function with multiple fallback methods for CORS workaround
  const performHealthCheck = useCallback(async (serverId, serverData) => {
    if (!serverData?.healthCheckUrl) {
      return { status: 'unknown', error: 'No health check URL configured' }
    }
    
    setHealthCheckRunning(prev => ({ ...prev, [serverId]: true }))
    
    const startTime = performance.now()
    const expectedStatus = serverData.healthCheckExpectedStatus || 200
    
    // Method 1: Try normal CORS request first
    const tryCorsRequest = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      
      try {
        const response = await fetch(serverData.healthCheckUrl, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
          headers: { 'Accept': 'application/json, text/plain, */*' }
        })
        
        clearTimeout(timeoutId)
        const responseTime = Math.round(performance.now() - startTime)
        
        return {
          success: true,
          status: response.status === expectedStatus ? 'healthy' : (response.status >= 500 ? 'down' : 'degraded'),
          statusCode: response.status,
          responseTime,
          error: response.status !== expectedStatus ? `Expected ${expectedStatus}, got ${response.status}` : null,
          method: 'cors'
        }
      } catch (err) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          return { success: false, error: 'timeout' }
        }
        return { success: false, error: 'cors', responseTime: Math.round(performance.now() - startTime) }
      }
    }
    
    // Method 2: no-cors mode - can detect if server responds at all
    const tryNoCorsRequest = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      
      try {
        const noCorsStart = performance.now()
        const response = await fetch(serverData.healthCheckUrl, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const responseTime = Math.round(performance.now() - noCorsStart)
        
        // no-cors returns opaque response, but if we get here, server responded
        // Fast response (<2s) = server is likely healthy
        // Slow response (>2s) = server might be degraded
        return {
          success: true,
          status: responseTime < 2000 ? 'healthy' : 'degraded',
          responseTime,
          method: 'no-cors',
          note: 'Detected via no-cors (status unknown)'
        }
      } catch (err) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          return { success: false, error: 'timeout' }
        }
        return { success: false, error: 'network' }
      }
    }
    
    // Method 3: Image probe - try to load favicon or any image
    const tryImageProbe = async () => {
      return new Promise((resolve) => {
        const img = new Image()
        const imgStart = performance.now()
        const timeout = setTimeout(() => {
          img.src = ''
          resolve({ success: false, error: 'timeout' })
        }, 5000)
        
        // Try to load favicon from the same origin
        const url = new URL(serverData.healthCheckUrl)
        const faviconUrl = `${url.origin}/favicon.ico`
        
        img.onload = () => {
          clearTimeout(timeout)
          resolve({
            success: true,
            status: 'healthy',
            responseTime: Math.round(performance.now() - imgStart),
            method: 'image-probe'
          })
        }
        
        img.onerror = () => {
          clearTimeout(timeout)
          // Error could mean: 1) no favicon but server is up, or 2) server is down
          // If error is fast (<500ms), server likely responded (just no favicon)
          const elapsed = performance.now() - imgStart
          if (elapsed < 500) {
            resolve({
              success: true,
              status: 'healthy',
              responseTime: Math.round(elapsed),
              method: 'image-probe',
              note: 'Server responded (no favicon)'
            })
          } else {
            resolve({ success: false, error: 'no-response' })
          }
        }
        
        img.src = faviconUrl
      })
    }
    
    // Execute methods in order with fallback
    let result = await tryCorsRequest()
    
    if (!result.success) {
      // CORS failed, try no-cors mode
      result = await tryNoCorsRequest()
    }
    
    if (!result.success) {
      // no-cors failed, try image probe
      result = await tryImageProbe()
    }
    
    const responseTime = result.responseTime || Math.round(performance.now() - startTime)
    
    let finalResult
    if (result.success) {
      finalResult = {
        status: result.status,
        lastCheck: Date.now(),
        responseTime,
        statusCode: result.statusCode,
        error: result.error,
        method: result.method,
        note: result.note
      }
    } else {
      // All methods failed
      finalResult = {
        status: result.error === 'timeout' ? 'down' : 'down',
        lastCheck: Date.now(),
        responseTime,
        error: result.error === 'timeout' ? 'Request timed out' : 'Server unreachable',
        method: 'all-failed'
      }
    }
    
    setHealthResults(prev => ({ ...prev, [serverId]: finalResult }))
    setHealthCheckRunning(prev => ({ ...prev, [serverId]: false }))
    
    return finalResult
  }, [])
  
  // Run health checks on all servers
  const runAllHealthChecks = useCallback(async (serversWithData) => {
    setIsRunningAllHealthChecks(true)
    
    const serversToCheck = serversWithData.filter(s => s.data?.healthCheckUrl)
    
    // Run checks in parallel but limit concurrency
    const results = {}
    for (const { server, data } of serversToCheck) {
      const result = await performHealthCheck(server.id, data)
      results[server.id] = result
    }
    
    setIsRunningAllHealthChecks(false)
    return results
  }, [performHealthCheck])
  
  // Update server health status in database
  const updateServerHealthStatus = useCallback(async (serverId, status) => {
    try {
      const server = servers.find(s => s.id === serverId)
      if (server) {
        const updatedServer = { ...server, healthStatus: status }
        await saveServer(updatedServer)
        setServers(prev => prev.map(s => s.id === serverId ? updatedServer : s))
      }
    } catch (e) {
      console.error('Failed to update health status:', e)
    }
  }, [servers])
  
  // Handlers
  const handleVaultCreated = (key, type, metadata) => {
    setEncryptionKey(key)
    setStorageType(type)
    setVaultMetadata(metadata)
    setFileName(vaultStorage.getFileName())
    setVaultState('unlocked')
    showToast('Vault created successfully!')
  }
  
  const handleUnlocked = async (key, metadata, data) => {
    setEncryptionKey(key)
    setVaultMetadata(metadata)
    setVaultState('unlocked')
    showToast('Vault unlocked!')
    
    let loadedServers = []
    
    // For file storage, data comes from the unlock
    if (storageType === 'file' && data) {
      // Load data from file
      loadedServers = data.servers || []
      setServers(loadedServers)
      setFolders(data.folders || [])
      
      // Decrypt folder names
      const decrypted = await Promise.all(
        (data.folders || []).map(async (folder) => {
          if (folder.encryptedName) {
            try {
              const name = await decrypt(folder.encryptedName, key)
              return { ...folder, name }
            } catch (e) {
              return { ...folder, name: 'Unknown' }
            }
          }
          return folder
        })
      )
      setDecryptedFolders(decrypted)
      
      setVaultStats({
        serverCount: loadedServers.length,
        folderCount: (data.folders || []).length,
        credentialCount: loadedServers.reduce((sum, s) => sum + (s.credentials?.length || 0), 0)
      })
    } else {
      // Refresh stats from IndexedDB
      const stats = await getVaultStats()
      setVaultStats(stats)
      loadedServers = await getAllServers()
    }
    
    // Run health checks on unlock if enabled
    setTimeout(async () => {
      const serversWithHealthCheck = []
      
      for (const server of loadedServers) {
        if (server.encryptedData) {
          try {
            const serverData = await decrypt(server.encryptedData, key)
            if (serverData.healthCheckUrl && serverData.healthCheckOnUnlock) {
              serversWithHealthCheck.push({ server, data: serverData })
            }
          } catch (e) {
            console.error('Failed to decrypt server for health check:', e)
          }
        }
      }
      
      if (serversWithHealthCheck.length > 0) {
        showToast(`Running health checks on ${serversWithHealthCheck.length} server(s)...`)
        await runAllHealthChecks(serversWithHealthCheck)
      }
    }, 500) // Small delay to let the UI settle
  }
  
  const handleLock = () => {
    vaultStorage.lock()
    setEncryptionKey(null)
    setServers([])
    setFolders([])
    setDecryptedFolders([])
    setVaultState('locked')
    setSaveStatus('saved')
    // Clear health monitoring state
    setHealthResults({})
    setHealthCheckRunning({})
    setIsRunningAllHealthChecks(false)
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current)
    }
    showToast('Vault locked')
  }
  
  // Trigger auto-save for file-based storage
  const triggerAutoSave = async (updatedServers, updatedFolders) => {
    if (storageType !== 'file') return
    
    // Check if auto-save is enabled (default: true)
    const autoSaveEnabled = vaultMetadata?.settings?.autoSaveEnabled ?? true
    if (!autoSaveEnabled) return
    
    try {
      const vaultData = {
        servers: updatedServers || servers,
        folders: updatedFolders || folders,
        settings: vaultMetadata?.settings
      }
      const delay = vaultMetadata?.settings?.autoSaveDelay || 500
      vaultStorage.scheduleSave(vaultData, delay)
    } catch (err) {
      console.error('Auto-save trigger failed:', err)
    }
  }
  
  const handleSaveServer = async (serverData) => {
    try {
      // Encrypt server data
      const encryptedData = await encrypt(serverData, encryptionKey)
      
      const serverRecord = {
        id: editingServer?.id || crypto.randomUUID(),
        folderId: serverData.folderId,
        encryptedData,
        healthStatus: editingServer?.healthStatus || 'unknown',
        createdAt: editingServer?.createdAt
      }
      
      await saveServer(serverRecord)
      
      // Refresh servers
      const serversData = await getAllServers()
      setServers(serversData)
      
      // Trigger auto-save for file storage
      await triggerAutoSave(serversData, folders)
      
      setShowServerModal(false)
      setEditingServer(null)
      setEditingServerDecrypted(null)
      showToast(editingServer ? 'Server updated!' : 'Server added!')
      
      // Update stats
      const stats = await getVaultStats()
      setVaultStats(stats)
    } catch (e) {
      console.error('Failed to save server:', e)
      showToast('Failed to save server')
    }
  }
  
  const handleDeleteServer = async (server) => {
    try {
      await deleteServer(server.id)
      const serversData = await getAllServers()
      setServers(serversData)
      
      // Trigger auto-save for file storage
      await triggerAutoSave(serversData, folders)
      
      setShowDeleteConfirm(null)
      showToast('Server deleted')
      
      const stats = await getVaultStats()
      setVaultStats(stats)
    } catch (e) {
      console.error('Failed to delete server:', e)
      showToast('Failed to delete server')
    }
  }
  
  const handleSaveCredential = async (credentialData) => {
    if (!selectedServer) return
    
    try {
      // Get current server data
      const decrypted = await decrypt(selectedServer.encryptedData, encryptionKey)
      
      // Update credentials
      const credentials = decrypted.credentials || []
      const existingIndex = credentials.findIndex(c => c.id === credentialData.id)
      
      if (existingIndex >= 0) {
        credentials[existingIndex] = credentialData
      } else {
        credentials.push(credentialData)
      }
      
      // Save updated server
      const updatedData = { ...decrypted, credentials }
      const encryptedData = await encrypt(updatedData, encryptionKey)
      
      await saveServer({
        ...selectedServer,
        encryptedData
      })
      
      // Refresh
      const serversData = await getAllServers()
      setServers(serversData)
      
      // Trigger auto-save for file storage
      await triggerAutoSave(serversData, folders)
      
      setShowCredentialModal(false)
      setEditingCredential(null)
      setSelectedServer(null)
      showToast(editingCredential ? 'Credential updated!' : 'Credential added!')
      
      const stats = await getVaultStats()
      setVaultStats(stats)
    } catch (e) {
      console.error('Failed to save credential:', e)
      showToast('Failed to save credential')
    }
  }
  
  const handleCreateFolder = async (name) => {
    try {
      const encryptedName = await encrypt(name, encryptionKey)
      
      await saveFolder({
        id: crypto.randomUUID(),
        encryptedName,
        parentId: selectedFolder,
        order: decryptedFolders.length
      })
      
      const foldersData = await getAllFolders()
      setFolders(foldersData)
      
      // Decrypt
      const decrypted = await Promise.all(
        foldersData.map(async (folder) => {
          if (folder.encryptedName) {
            const name = await decrypt(folder.encryptedName, encryptionKey)
            return { ...folder, name }
          }
          return folder
        })
      )
      setDecryptedFolders(decrypted)
      
      // Trigger auto-save for file storage
      await triggerAutoSave(servers, foldersData)
      
      setShowFolderModal(false)
      showToast('Folder created!')
    } catch (e) {
      console.error('Failed to create folder:', e)
      showToast('Failed to create folder')
    }
  }
  
  // Filter servers
  const filteredServers = useMemo(() => {
    return servers.filter(server => {
      // Search filter would need decryption - for now just return all
      // In a real implementation, you'd maintain a decrypted index
      if (selectedFolder && server.folderId !== selectedFolder) return false
      return true
    })
  }, [servers, selectedFolder, searchQuery, filters])
  
  // Browser not supported
  if (vaultState === 'unsupported') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Browser Not Supported</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          Local Vault requires Web Crypto API and IndexedDB support.
          Please use a modern browser like Chrome, Firefox, Safari, or Edge.
        </p>
        <div className="text-sm text-[var(--text-tertiary)]">
          <p>Web Crypto: {browserSupport.crypto ? '✓' : '✗'}</p>
          <p>IndexedDB: {browserSupport.indexedDB ? '✓' : '✗'}</p>
        </div>
      </div>
    )
  }
  
  // Loading
  if (vaultState === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    )
  }
  
  // Create vault
  if (vaultState === 'create') {
    return (
      <div className="py-8">
        <VaultCreate onVaultCreated={handleVaultCreated} />
      </div>
    )
  }
  
  // Locked vault
  if (vaultState === 'locked') {
    return (
      <div className="py-8">
        <VaultUnlock 
          onUnlocked={handleUnlocked}
          vaultStats={vaultStats}
          lastAccessed={vaultMetadata?.lastAccessedAt}
          storageType={storageType}
          fileName={fileName}
        />
      </div>
    )
  }
  
  // Unlocked vault - Main UI
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-7 h-7 text-[var(--accent)]" />
            Local Vault
          </h1>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>{vaultStats.serverCount} servers • {vaultStats.credentialCount} credentials</span>
            <span className="text-[var(--text-tertiary)]">•</span>
            <span className="flex items-center gap-1">
              {storageType === 'file' ? (
                <>
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{fileName}</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3 h-3" />
                  <span>Browser</span>
                </>
              )}
            </span>
            {/* Save Status Indicator for file storage */}
            {storageType === 'file' && (vaultMetadata?.settings?.showSaveIndicator ?? true) && (
              <span className={`flex items-center gap-1 ${
                saveStatus === 'saved' ? 'text-emerald-500' :
                saveStatus === 'saving' ? 'text-amber-500' :
                saveStatus === 'error' ? 'text-red-500' :
                'text-[var(--text-tertiary)]'
              }`}>
                {saveStatus === 'saving' && <RefreshCw className="w-3 h-3 animate-spin" />}
                {saveStatus === 'saved' && <Check className="w-3 h-3" />}
                {saveStatus === 'error' && <AlertTriangle className="w-3 h-3" />}
                {saveStatus === 'pending' && <Clock className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Manual Save Button for file storage */}
          {storageType === 'file' && (
            <button
              onClick={async () => {
                try {
                  setSaveStatus('saving')
                  const vaultData = { servers, folders, settings: vaultMetadata?.settings }
                  await vaultStorage.saveVaultData(vaultData)
                  setSaveStatus('saved')
                  setLastSaveTime(Date.now())
                  showToast('Vault saved!')
                } catch (err) {
                  setSaveStatus('error')
                  showToast('Failed to save: ' + err.message)
                }
              }}
              disabled={saveStatus === 'saving'}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-50"
              title="Save Now"
            >
              <Save className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowGeneratorModal(true)}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent)]"
            title="Password Generator"
          >
            <Dices className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowImportExport(true)}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent)]"
            title="Import/Export"
          >
            <HardDrive className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView(view === 'settings' ? 'servers' : 'settings')}
            className={`p-2 rounded-lg hover:bg-[var(--bg-tertiary)] ${view === 'settings' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="flex gap-2 p-1 rounded-lg bg-[var(--bg-secondary)] w-fit">
        <button
          onClick={() => setView('servers')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'servers' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Server className="w-4 h-4 inline mr-2" />
          Servers
        </button>
        <button
          onClick={() => setView('health')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'health' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Heart className="w-4 h-4 inline mr-2" />
          Health
        </button>
      </div>
      
      {/* Settings View */}
      {view === 'settings' && (
        <div className="space-y-6">
          {/* Storage Location Section */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[var(--accent)]" />
              Storage Location
            </h2>
            
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                {storageType === 'file' ? (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text-primary)]">Local File Storage</div>
                      <div className="text-sm text-[var(--text-tertiary)] truncate">{fileName}</div>
                      {lastSaveTime && (
                        <div className="text-xs text-[var(--text-tertiary)]">
                          Last saved: {new Date(lastSaveTime).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">Browser Storage</div>
                      <div className="text-sm text-[var(--text-tertiary)]">Stored in IndexedDB</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Migration Options */}
            <div className="flex flex-wrap gap-2">
              {storageType === 'indexeddb' && checkFileSystemSupport() && (
                <button
                  onClick={async () => {
                    try {
                      const handle = await showSaveFilePicker('my-vault')
                      await vaultStorage.migrateToFile(handle)
                      setStorageType('file')
                      setFileName(handle.name)
                      showToast('Migrated to file storage!')
                    } catch (err) {
                      if (err.name !== 'AbortError') {
                        showToast('Migration failed: ' + err.message)
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors text-sm"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Switch to Local File
                </button>
              )}
              {storageType === 'file' && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        const handle = await showSaveFilePicker('my-vault')
                        // Re-save to new location
                        const vaultData = { servers, folders, settings: vaultMetadata?.settings }
                        await vaultStorage.saveVaultData(vaultData)
                        setFileName(handle.name)
                        showToast('Vault moved to new location!')
                      } catch (err) {
                        if (err.name !== 'AbortError') {
                          showToast('Failed: ' + err.message)
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors text-sm"
                  >
                    <FolderOpen className="w-4 h-4 inline mr-2" />
                    Change Location
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await vaultStorage.migrateToIndexedDB()
                        setStorageType('indexeddb')
                        setFileName(null)
                        showToast('Migrated to browser storage!')
                      } catch (err) {
                        showToast('Migration failed: ' + err.message)
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors text-sm"
                  >
                    <HardDrive className="w-4 h-4 inline mr-2" />
                    Switch to Browser
                  </button>
                </>
              )}
            </div>
            
            {!checkFileSystemSupport() && storageType === 'indexeddb' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                File storage requires Chrome, Edge, or Opera.
              </div>
            )}
          </div>
          
          {/* General Settings */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">General Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">Auto-lock Timeout</div>
                  <div className="text-sm text-[var(--text-tertiary)]">Lock vault after inactivity</div>
                </div>
                <select
                  value={vaultMetadata?.settings?.autoLockTimeout || 15}
                  onChange={async (e) => {
                    const newSettings = { ...vaultMetadata.settings, autoLockTimeout: parseInt(e.target.value) }
                    await saveVaultMetadata({ ...vaultMetadata, settings: newSettings })
                    setVaultMetadata({ ...vaultMetadata, settings: newSettings })
                  }}
                  className="glass-input w-auto"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={0}>Never</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">Clipboard Clear Timeout</div>
                  <div className="text-sm text-[var(--text-tertiary)]">Auto-clear copied passwords</div>
                </div>
                <select
                  value={vaultMetadata?.settings?.clipboardClearTimeout || 30}
                  onChange={async (e) => {
                    const newSettings = { ...vaultMetadata.settings, clipboardClearTimeout: parseInt(e.target.value) }
                    await saveVaultMetadata({ ...vaultMetadata, settings: newSettings })
                    setVaultMetadata({ ...vaultMetadata, settings: newSettings })
                  }}
                  className="glass-input w-auto"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Auto-Save Settings (File Storage Only) */}
          {storageType === 'file' && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Auto-Save Settings</h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                Configure how changes are automatically saved to your vault file.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Auto-Save</div>
                    <div className="text-sm text-[var(--text-tertiary)]">Automatically save changes to file</div>
                  </div>
                  <button
                    onClick={async () => {
                      const newSettings = { 
                        ...vaultMetadata.settings, 
                        autoSaveEnabled: !(vaultMetadata?.settings?.autoSaveEnabled ?? true) 
                      }
                      await saveVaultMetadata({ ...vaultMetadata, settings: newSettings })
                      setVaultMetadata({ ...vaultMetadata, settings: newSettings })
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      (vaultMetadata?.settings?.autoSaveEnabled ?? true)
                        ? 'bg-[var(--accent)]' 
                        : 'bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      (vaultMetadata?.settings?.autoSaveEnabled ?? true) ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Save Delay</div>
                    <div className="text-sm text-[var(--text-tertiary)]">Debounce time before saving</div>
                  </div>
                  <select
                    value={vaultMetadata?.settings?.autoSaveDelay || 500}
                    onChange={async (e) => {
                      const newSettings = { ...vaultMetadata.settings, autoSaveDelay: parseInt(e.target.value) }
                      await saveVaultMetadata({ ...vaultMetadata, settings: newSettings })
                      setVaultMetadata({ ...vaultMetadata, settings: newSettings })
                    }}
                    disabled={!(vaultMetadata?.settings?.autoSaveEnabled ?? true)}
                    className="glass-input w-auto disabled:opacity-50"
                  >
                    <option value={250}>250ms (Fast)</option>
                    <option value={500}>500ms (Default)</option>
                    <option value={1000}>1 second</option>
                    <option value={2000}>2 seconds</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Show Save Indicator</div>
                    <div className="text-sm text-[var(--text-tertiary)]">Display status when saving</div>
                  </div>
                  <button
                    onClick={async () => {
                      const newSettings = { 
                        ...vaultMetadata.settings, 
                        showSaveIndicator: !(vaultMetadata?.settings?.showSaveIndicator ?? true) 
                      }
                      await saveVaultMetadata({ ...vaultMetadata, settings: newSettings })
                      setVaultMetadata({ ...vaultMetadata, settings: newSettings })
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      (vaultMetadata?.settings?.showSaveIndicator ?? true)
                        ? 'bg-[var(--accent)]' 
                        : 'bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      (vaultMetadata?.settings?.showSaveIndicator ?? true) ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                {/* Current save status */}
                <div className="pt-2 border-t border-[var(--border-primary)]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">Status:</span>
                    <span className={`font-medium ${
                      saveStatus === 'saved' ? 'text-green-500' :
                      saveStatus === 'saving' ? 'text-amber-500' :
                      saveStatus === 'pending' ? 'text-blue-500' :
                      saveStatus === 'error' ? 'text-red-500' : 'text-[var(--text-tertiary)]'
                    }`}>
                      {saveStatus === 'saved' && '✓ Saved'}
                      {saveStatus === 'saving' && '⟳ Saving...'}
                      {saveStatus === 'pending' && '○ Pending'}
                      {saveStatus === 'error' && '✕ Error'}
                      {!saveStatus && '—'}
                    </span>
                  </div>
                  {lastSaveTime && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-[var(--text-tertiary)]">Last saved:</span>
                      <span className="text-[var(--text-secondary)]">
                        {new Date(lastSaveTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Danger Zone */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-red-500/20">
            <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              These actions are irreversible. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteConfirm('vault')}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Delete Vault
            </button>
          </div>
        </div>
      )}
      
      {/* Servers View */}
      {view === 'servers' && (
        <>
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search servers..."
                className="glass-input pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFolderModal(true)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] transition-colors flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Folder</span>
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setEditingServer(null); setShowServerModal(true) }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Server</span>
              </motion.button>
            </div>
          </div>
          
          {/* Folders */}
          {decryptedFolders.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  !selectedFolder ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20'
                }`}
              >
                <Folder className="w-4 h-4" />
                All
              </button>
              {decryptedFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    selectedFolder === folder.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  {folder.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Server List */}
          <div className="space-y-3">
            {filteredServers.length === 0 ? (
              <div className="text-center py-12">
                <Server className="w-12 h-12 mx-auto mb-4 text-[var(--text-tertiary)]" />
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No servers yet</h3>
                <p className="text-[var(--text-secondary)] mb-4">Add your first server to start managing credentials</p>
                <button
                  onClick={() => { setEditingServer(null); setShowServerModal(true) }}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Server
                </button>
              </div>
            ) : (
              filteredServers.map(server => (
                <ServerCard
                  key={server.id}
                  server={server}
                  folders={decryptedFolders}
                  encryptionKey={encryptionKey}
                  credentialViewMode={credentialViewMode}
                  onEdit={(s) => { setEditingServer(s); setShowServerModal(true) }}
                  onDelete={(s) => setShowDeleteConfirm(s)}
                  onViewCredentials={(s, cred, mode = 'edit') => {
                    setSelectedServer(s)
                    if (mode === 'view' && cred) {
                      setViewingCredential(cred)
                      setShowCredentialViewModal(true)
                    } else {
                      setEditingCredential(cred || null)
                      setShowCredentialModal(true)
                    }
                  }}
                  onShare={(s, decryptedData) => {
                    setSelectedServer(s)
                    setShareServerData(decryptedData) // Store decrypted data with credentials
                    setShowShareModal(true)
                  }}
                  onExportSSHConfig={(data) => {
                    const configEntry = generateSSHConfigEntry(data)
                    const instructions = getSSHConfigInstructions(configEntry)
                    setShowSSHConfigModal({ configEntry, instructions, serverName: data.name })
                  }}
                />
              ))
            )}
          </div>
        </>
      )}
      
      {/* Health View */}
      {view === 'health' && (
        <HealthMonitoringView
          servers={servers}
          encryptionKey={encryptionKey}
          healthResults={healthResults}
          healthCheckRunning={healthCheckRunning}
          isRunningAllHealthChecks={isRunningAllHealthChecks}
          onRunHealthCheck={performHealthCheck}
          onRunAllHealthChecks={runAllHealthChecks}
          onEditServer={(server) => { setEditingServer(server); setShowServerModal(true) }}
        />
      )}
      
      {/* Server Modal */}
      <AnimatePresence>
        {showServerModal && (
          <Modal
            isOpen={showServerModal}
            onClose={() => { setShowServerModal(false); setEditingServer(null); setEditingServerDecrypted(null) }}
            title={editingServer ? 'Edit Server' : 'Add Server'}
            size="lg"
          >
            <ServerForm
              server={editingServerDecrypted}
              folders={decryptedFolders}
              onSave={handleSaveServer}
              onCancel={() => { setShowServerModal(false); setEditingServer(null); setEditingServerDecrypted(null) }}
            />
          </Modal>
        )}
      </AnimatePresence>
      
      {/* Credential Modal */}
      <AnimatePresence>
        {showCredentialModal && (
          <Modal
            isOpen={showCredentialModal}
            onClose={() => { setShowCredentialModal(false); setEditingCredential(null); setSelectedServer(null) }}
            title={editingCredential ? 'Edit Credential' : 'Add Credential'}
            size="md"
          >
            <CredentialForm
              credential={editingCredential}
              onSave={handleSaveCredential}
              onCancel={() => { setShowCredentialModal(false); setEditingCredential(null); setSelectedServer(null) }}
            />
          </Modal>
        )}
      </AnimatePresence>
      
      {/* Folder Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <Modal
            isOpen={showFolderModal}
            onClose={() => setShowFolderModal(false)}
            title="Create Folder"
            size="sm"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const name = e.target.folderName.value
                if (name) handleCreateFolder(name)
              }}
              className="space-y-4"
            >
              <input
                type="text"
                name="folderName"
                placeholder="Folder name"
                required
                className="glass-input"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[var(--accent)] text-white"
                >
                  Create
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <Modal
            isOpen={!!showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(null)}
            title="Confirm Delete"
            size="sm"
          >
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-center text-[var(--text-primary)]">
                  {showDeleteConfirm === 'vault' 
                    ? 'Are you sure you want to delete your entire vault? This action cannot be undone.'
                    : 'Are you sure you want to delete this server? All associated credentials will also be deleted.'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (showDeleteConfirm === 'vault') {
                      await deleteVault()
                      setVaultState('create')
                      setShowDeleteConfirm(null)
                      showToast('Vault deleted')
                    } else {
                      handleDeleteServer(showDeleteConfirm)
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      
      {/* Password Generator Modal */}
      <AnimatePresence>
        {showGeneratorModal && (
          <Modal
            isOpen={showGeneratorModal}
            onClose={() => setShowGeneratorModal(false)}
            title="Password Generator"
            size="sm"
          >
            <PasswordGenerator />
          </Modal>
        )}
      </AnimatePresence>
      
      {/* SSH Config Modal */}
      <AnimatePresence>
        {showSSHConfigModal && (
          <Modal
            isOpen={!!showSSHConfigModal}
            onClose={() => setShowSSHConfigModal(false)}
            title="SSH Config Entry"
            size="md"
          >
            <div className="space-y-4">
              {/* Config Preview */}
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {generateSSHConfigFilename(showSSHConfigModal.serverName || 'server')}
                  </span>
                </div>
                <pre className="text-sm font-mono text-[var(--text-primary)] whitespace-pre-wrap">
                  {showSSHConfigModal.configEntry}
                </pre>
              </div>
              
              {/* Save Options */}
              <div className="p-4 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Save className="w-4 h-4 text-[var(--accent)]" />
                  Save SSH Config File
                </h4>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  Save as a separate config file that can be included in your main SSH config.
                </p>
                <button
                  onClick={async () => {
                    const result = await saveSSHConfigToFile(
                      showSSHConfigModal.configEntry,
                      showSSHConfigModal.serverName || 'server'
                    )
                    if (result.success) {
                      if (result.method === 'filesystem') {
                        showToast(`Saved to ${result.filename}`)
                      } else if (result.method === 'download') {
                        showToast(`Downloaded ${result.filename}`)
                      }
                    } else if (result.method !== 'cancelled') {
                      showToast('Failed to save: ' + result.error)
                    }
                  }}
                  className="w-full py-2 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save as {generateSSHConfigFilename(showSSHConfigModal.serverName || 'server')}
                </button>
              </div>
              
              {/* Include Instructions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[var(--text-secondary)]">How to use this file</h4>
                
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-xs font-medium text-[var(--text-primary)] mb-2">Linux / macOS</div>
                  <ol className="text-xs text-[var(--text-tertiary)] space-y-1.5">
                    <li>1. Move file to: <code className="px-1 rounded bg-[var(--bg-tertiary)]">~/.ssh/{generateSSHConfigFilename(showSSHConfigModal.serverName || 'server')}</code></li>
                    <li>2. Add to <code className="px-1 rounded bg-[var(--bg-tertiary)]">~/.ssh/config</code>:</li>
                    <li className="pl-4"><code className="px-2 py-1 rounded bg-[var(--bg-tertiary)] block">Include ~/.ssh/{generateSSHConfigFilename(showSSHConfigModal.serverName || 'server')}</code></li>
                    <li>3. Set permissions: <code className="px-1 rounded bg-[var(--bg-tertiary)]">chmod 600 ~/.ssh/{generateSSHConfigFilename(showSSHConfigModal.serverName || 'server')}</code></li>
                  </ol>
                </div>
                
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-xs font-medium text-[var(--text-primary)] mb-2">Windows</div>
                  <ol className="text-xs text-[var(--text-tertiary)] space-y-1.5">
                    <li>1. Move file to: <code className="px-1 rounded bg-[var(--bg-tertiary)]">%USERPROFILE%\.ssh\{generateSSHConfigFilename(showSSHConfigModal.serverName || 'server')}</code></li>
                    <li>2. Add to <code className="px-1 rounded bg-[var(--bg-tertiary)]">%USERPROFILE%\.ssh\config</code>:</li>
                    <li className="pl-4"><code className="px-2 py-1 rounded bg-[var(--bg-tertiary)] block">Include {generateSSHConfigFilename(showSSHConfigModal.serverName || 'server')}</code></li>
                  </ol>
                </div>
              </div>
              
              {/* Alternative Actions */}
              <div className="flex gap-3 pt-2 border-t border-[var(--border-color)]">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(showSSHConfigModal.configEntry)
                    showToast('Config copied to clipboard!')
                  }}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => {
                    downloadAsFile(showSSHConfigModal.configEntry, 'ssh-config-entry.txt')
                    showToast('Config downloaded!')
                  }}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download .txt
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setShareServerData(null) }}
        server={shareServerData}
        credentials={shareServerData?.credentials || []}
        encryptionKey={encryptionKey}
      />
      
      {/* Import From Share Modal */}
      <ImportFromShareModal
        isOpen={showImportShareModal}
        onClose={() => {
          setShowImportShareModal(false)
          setIncomingShareData(null)
        }}
        shareData={incomingShareData}
        onImport={async (importedData) => {
          try {
            // If vault is locked, we need to unlock first
            if (vaultState !== 'unlocked') {
              showToast('Please unlock your vault first to import credentials', 'warning')
              return
            }
            
            // Create a new server with the imported credentials
            if (importedData.server) {
              const serverData = {
                ...importedData.server,
                credentials: importedData.credentials || [],
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
              
              // Encrypt and save
              const encryptedData = await encrypt(serverData, encryptionKey)
              const serverRecord = {
                id: serverData.id,
                folderId: null,
                encryptedData,
                createdAt: serverData.createdAt,
                updatedAt: serverData.updatedAt
              }
              
              await saveServer(serverRecord)
              setServers(prev => [...prev, serverRecord])
              showToast('Credentials imported successfully!')
            } else if (importedData.credentials?.length > 0) {
              // Just credentials without server - show them to user
              showToast(`Received ${importedData.credentials.length} credential(s). Please add them to a server.`, 'info')
            }
            
            setShowImportShareModal(false)
            setIncomingShareData(null)
          } catch (err) {
            console.error('Import failed:', err)
            showToast('Failed to import credentials: ' + err.message, 'error')
          }
        }}
      />
      
      {/* Credential View Modal */}
      {viewingCredential && (
        <CredentialViewModal
          isOpen={showCredentialViewModal}
          onClose={() => {
            setShowCredentialViewModal(false)
            setViewingCredential(null)
          }}
          credential={viewingCredential}
          server={selectedServer}
          onEdit={(cred) => {
            setShowCredentialViewModal(false)
            setViewingCredential(null)
            setEditingCredential(cred)
            setShowCredentialModal(true)
          }}
          onCopy={(value, field) => {
            showToast(`${field} copied!`)
          }}
        />
      )}
      
      {/* Import/Export Modal */}
      <AnimatePresence>
        {showImportExport && (
          <Modal
            isOpen={showImportExport}
            onClose={() => setShowImportExport(false)}
            title="Import / Export"
            size="md"
          >
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] space-y-3">
                <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-[var(--accent)]" />
                  Export Vault
                </h3>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Download an encrypted backup of your vault. You'll need your master password to restore it.
                </p>
                <button
                  onClick={async () => {
                    // Export implementation
                    const data = {
                      version: 1,
                      exportedAt: Date.now(),
                      metadata: vaultMetadata,
                      servers: servers,
                      folders: folders
                    }
                    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `offgrid-vault-${new Date().toISOString().split('T')[0]}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                    showToast('Vault exported!')
                  }}
                  className="w-full py-2 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Encrypted Backup
                </button>
              </div>
              
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] space-y-3">
                <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-[var(--accent)]" />
                  Import Vault
                </h3>
                
                {!importData ? (
                  <>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Restore from a previously exported backup file.
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        try {
                          const text = await file.text()
                          const data = JSON.parse(text)
                          
                          if (!data.version || !data.servers || !data.folders) {
                            showToast('Invalid backup file format')
                            return
                          }
                          
                          // Check for conflicts
                          const existingServerIds = servers.map(s => s.id)
                          const existingFolderIds = folders.map(f => f.id)
                          
                          const serverConflicts = data.servers.filter(s => existingServerIds.includes(s.id))
                          const folderConflicts = data.folders.filter(f => existingFolderIds.includes(f.id))
                          
                          setImportData(data)
                          setImportConflicts({ servers: serverConflicts, folders: folderConflicts })
                          setImportMode('skip')
                        } catch (err) {
                          console.error('Import error:', err)
                          showToast('Failed to read file: ' + err.message)
                        }
                        
                        e.target.value = ''
                      }}
                      className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--bg-tertiary)] file:text-[var(--text-primary)] hover:file:bg-[var(--accent)]/20"
                    />
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Import Preview */}
                    <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                      <div className="text-sm text-[var(--text-primary)] mb-2">
                        <strong>Backup from:</strong> {new Date(importData.exportedAt).toLocaleString()}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-[var(--text-secondary)]">
                          Servers: <span className="text-[var(--text-primary)]">{importData.servers.length}</span>
                        </div>
                        <div className="text-[var(--text-secondary)]">
                          Folders: <span className="text-[var(--text-primary)]">{importData.folders.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Conflict Warning */}
                    {(importConflicts.servers.length > 0 || importConflicts.folders.length > 0) && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                              Conflicts Detected
                            </div>
                            <div className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                              {importConflicts.servers.length > 0 && (
                                <div>{importConflicts.servers.length} server(s) already exist</div>
                              )}
                              {importConflicts.folders.length > 0 && (
                                <div>{importConflicts.folders.length} folder(s) already exist</div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Conflict Resolution Options */}
                        <div className="mt-3 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="importMode"
                              value="skip"
                              checked={importMode === 'skip'}
                              onChange={() => setImportMode('skip')}
                              className="accent-[var(--accent)]"
                            />
                            <div>
                              <div className="text-sm text-[var(--text-primary)]">Skip existing</div>
                              <div className="text-xs text-[var(--text-tertiary)]">Keep current data, only import new items</div>
                            </div>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="importMode"
                              value="replace"
                              checked={importMode === 'replace'}
                              onChange={() => setImportMode('replace')}
                              className="accent-[var(--accent)]"
                            />
                            <div>
                              <div className="text-sm text-[var(--text-primary)]">Replace existing</div>
                              <div className="text-xs text-[var(--text-tertiary)]">Overwrite current data with backup data</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setImportData(null)
                          setImportConflicts({ servers: [], folders: [] })
                        }}
                        className="flex-1 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const existingServerIds = servers.map(s => s.id)
                            const existingFolderIds = folders.map(f => f.id)
                            
                            let importedServers = 0
                            let importedFolders = 0
                            let skippedServers = 0
                            let skippedFolders = 0
                            
                            // Import servers
                            for (const server of importData.servers) {
                              const exists = existingServerIds.includes(server.id)
                              if (exists && importMode === 'skip') {
                                skippedServers++
                                continue
                              }
                              await saveServer(server)
                              importedServers++
                            }
                            
                            // Import folders
                            for (const folder of importData.folders) {
                              const exists = existingFolderIds.includes(folder.id)
                              if (exists && importMode === 'skip') {
                                skippedFolders++
                                continue
                              }
                              await saveFolder(folder)
                              importedFolders++
                            }
                            
                            // Refresh data
                            const [serversData, foldersData] = await Promise.all([
                              getAllServers(),
                              getAllFolders()
                            ])
                            setServers(serversData)
                            setFolders(foldersData)
                            
                            // Decrypt folder names
                            const decrypted = await Promise.all(
                              foldersData.map(async (folder) => {
                                if (folder.encryptedName) {
                                  try {
                                    const name = await decrypt(folder.encryptedName, encryptionKey)
                                    return { ...folder, name }
                                  } catch (err) {
                                    return { ...folder, name: 'Unknown' }
                                  }
                                }
                                return folder
                              })
                            )
                            setDecryptedFolders(decrypted)
                            
                            // Update stats
                            const stats = await getVaultStats()
                            setVaultStats(stats)
                            
                            // Reset and close
                            setImportData(null)
                            setImportConflicts({ servers: [], folders: [] })
                            setShowImportExport(false)
                            
                            let message = `Imported ${importedServers} servers, ${importedFolders} folders`
                            if (skippedServers > 0 || skippedFolders > 0) {
                              message += ` (skipped ${skippedServers + skippedFolders} existing)`
                            }
                            showToast(message)
                          } catch (err) {
                            console.error('Import error:', err)
                            showToast('Failed to import: ' + err.message)
                          }
                        }}
                        className="flex-1 py-2 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Import
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>
                    Warning: JSON export contains encrypted data. Keep your backup file secure.
                  </p>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LocalVault
