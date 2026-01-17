// Credential Viewer with multiple view modes
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, Copy, Check, Edit, X, ChevronRight,
  LayoutGrid, List, Table2, ExternalLink, Terminal,
  Database, Cloud, Shield, Server, Key, Globe
} from 'lucide-react'
import { CREDENTIAL_TYPES } from './CredentialForm'

// View mode selector component
export const ViewModeSelector = ({ value, onChange }) => {
  const modes = [
    { id: 'row', icon: List, label: 'Row' },
    { id: 'cards', icon: LayoutGrid, label: 'Cards' },
    { id: 'table', icon: Table2, label: 'Table' }
  ]

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-tertiary)]">
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={`p-2 rounded-md transition-all ${
            value === mode.id
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
          title={mode.label}
        >
          <mode.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}

// Helper to get credential field value (handles both flattened and nested data)
const getCredField = (cred, key) => {
  return cred?.[key] || cred?.data?.[key] || null
}

// Credential View Modal - Beautiful display modal
export const CredentialViewModal = ({ 
  isOpen, 
  onClose, 
  credential, 
  server,
  onEdit,
  onCopy 
}) => {
  const [showPasswords, setShowPasswords] = useState({})
  const [copiedField, setCopiedField] = useState(null)

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

  if (!isOpen || !credential) return null

  const typeConfig = CREDENTIAL_TYPES[credential.type]
  
  // Get field values supporting both nested and flattened formats
  const host = getCredField(credential, 'host')
  const port = getCredField(credential, 'port')
  const database = getCredField(credential, 'database')
  const url = getCredField(credential, 'url')
  const username = getCredField(credential, 'username')
  const password = getCredField(credential, 'password')
  const apiKey = getCredField(credential, 'apiKey')
  const token = getCredField(credential, 'token')
  const secretKey = getCredField(credential, 'secretKey')
  const connectionString = getCredField(credential, 'connectionString')

  const handleCopy = async (value, fieldKey) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(fieldKey)
    onCopy?.(value, fieldKey)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const togglePassword = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isSensitive = (key) => {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'private']
    return sensitiveKeys.some(s => key.toLowerCase().includes(s))
  }

  const renderFieldValue = (key, value) => {
    if (!value) return <span className="text-[var(--text-tertiary)]">—</span>
    
    const isPassword = isSensitive(key)
    const visible = showPasswords[key]

    return (
      <div className="flex items-center gap-2">
        <span className={`font-mono text-sm ${isPassword && !visible ? 'tracking-wider' : ''}`}>
          {isPassword && !visible ? '••••••••••' : value}
        </span>
        {isPassword && (
          <button
            onClick={() => togglePassword(key)}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
          >
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          onClick={() => handleCopy(value, key)}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
        >
          {copiedField === key ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    )
  }

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
          className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-6 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${typeConfig?.color}20` }}
              >
                {typeConfig?.icon && (
                  <typeConfig.icon className="w-7 h-7" style={{ color: typeConfig.color }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">
                  {credential.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="text-sm px-2 py-0.5 rounded-full"
                    style={{ background: `${typeConfig?.color}20`, color: typeConfig?.color }}
                  >
                    {typeConfig?.name}
                  </span>
                  {server && (
                    <span className="text-sm text-[var(--text-tertiary)] flex items-center gap-1">
                      <Server className="w-3.5 h-3.5" />
                      {server.name || server.hostname}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit?.(credential)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Connection Info Card */}
            {(host || port || database || url) && (
              <div className="rounded-xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] p-5 border border-[var(--border-color)]">
                <div className="grid grid-cols-2 gap-4">
                  {host && (
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)] mb-1">Host</div>
                      {renderFieldValue('host', host)}
                    </div>
                  )}
                  {port && (
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)] mb-1">Port</div>
                      {renderFieldValue('port', port)}
                    </div>
                  )}
                  {database && (
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)] mb-1">Database</div>
                      {renderFieldValue('database', database)}
                    </div>
                  )}
                  {url && (
                    <div className="col-span-2">
                      <div className="text-xs text-[var(--text-tertiary)] mb-1">URL</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm truncate flex-1">{url}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--text-tertiary)]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleCopy(url, 'url')}
                          className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--text-tertiary)]"
                        >
                          {copiedField === 'url' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Credentials Section */}
            {(username || password || apiKey || token || secretKey) && (
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Credentials
                </h3>
                <div className="space-y-3">
                  {username && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-sm text-[var(--text-tertiary)]">Username</span>
                      {renderFieldValue('username', username)}
                    </div>
                  )}
                  {password && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-sm text-[var(--text-tertiary)]">Password</span>
                      {renderFieldValue('password', password)}
                    </div>
                  )}
                  {apiKey && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-sm text-[var(--text-tertiary)]">API Key</span>
                      {renderFieldValue('apiKey', apiKey)}
                    </div>
                  )}
                  {token && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-sm text-[var(--text-tertiary)]">Token</span>
                      {renderFieldValue('token', token)}
                    </div>
                  )}
                  {secretKey && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-sm text-[var(--text-tertiary)]">Secret Key</span>
                      {renderFieldValue('secretKey', secretKey)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connection String */}
            {connectionString && (
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Connection String
                </h3>
                <div className="p-4 rounded-lg bg-[var(--bg-secondary)] font-mono text-sm break-all relative group">
                  <code className="text-[var(--text-primary)]">
                    {showPasswords.connectionString 
                      ? connectionString 
                      : connectionString.replace(/:[^:@]+@/, ':****@')}
                  </code>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePassword('connectionString')}
                      className="p-1.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      {showPasswords.connectionString ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopy(connectionString, 'connectionString')}
                      className="p-1.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      {copiedField === 'connectionString' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {credential.notes && (
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Notes</h3>
                <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                  {credential.notes}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Row View - Current list style
export const CredentialRowView = ({ credentials, onView, onEdit }) => {
  return (
    <div className="space-y-2">
      {credentials.map(cred => {
        const typeConfig = CREDENTIAL_TYPES[cred.type]
        const host = getCredField(cred, 'host')
        const username = getCredField(cred, 'username')
        return (
          <motion.div
            key={cred.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
            onClick={() => onView(cred)}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${typeConfig?.color}20` }}
            >
              {typeConfig?.icon && <typeConfig.icon className="w-5 h-5" style={{ color: typeConfig.color }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-[var(--text-primary)] truncate">{cred.name}</div>
              <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                <span>{typeConfig?.name}</span>
                {host && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{host}</span>
                  </>
                )}
                {username && (
                  <>
                    <span>•</span>
                    <span>{username}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(cred) }}
                className="p-2 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-tertiary)]"
              >
                <Edit className="w-4 h-4" />
              </button>
              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Cards View - Grid of cards
export const CredentialCardsView = ({ credentials, onView, onEdit }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {credentials.map(cred => {
        const typeConfig = CREDENTIAL_TYPES[cred.type]
        const host = getCredField(cred, 'host')
        const username = getCredField(cred, 'username')
        return (
          <motion.div
            key={cred.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border border-[var(--border-color)] cursor-pointer group"
            onClick={() => onView(cred)}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${typeConfig?.color}20` }}
              >
                {typeConfig?.icon && <typeConfig.icon className="w-6 h-6" style={{ color: typeConfig.color }} />}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(cred) }}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-1 truncate">{cred.name}</h4>
            <p className="text-xs text-[var(--text-tertiary)] mb-3">{typeConfig?.name}</p>
            
            {(host || username) && (
              <div className="space-y-1 pt-3 border-t border-[var(--border-color)]">
                {host && (
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className="font-mono text-[var(--text-secondary)] truncate">{host}</span>
                  </div>
                )}
                {username && (
                  <div className="flex items-center gap-2 text-xs">
                    <Key className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className="text-[var(--text-secondary)] truncate">{username}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// Table View - Spreadsheet style
export const CredentialTableView = ({ credentials, onView, onEdit }) => {
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const sortedCredentials = useMemo(() => {
    return [...credentials].sort((a, b) => {
      // Handle both flattened and nested data formats
      const aVal = a[sortKey] || a.data?.[sortKey] || ''
      const bVal = b[sortKey] || b.data?.[sortKey] || ''
      const cmp = aVal.toString().localeCompare(bVal.toString())
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [credentials, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortHeader = ({ children, field }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortKey === field && (
          <span className="text-[var(--accent)]">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
      <table className="w-full">
        <thead className="bg-[var(--bg-tertiary)]">
          <tr>
            <SortHeader field="name">Name</SortHeader>
            <SortHeader field="type">Type</SortHeader>
            <SortHeader field="host">Host</SortHeader>
            <SortHeader field="username">Username</SortHeader>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {sortedCredentials.map(cred => {
            const typeConfig = CREDENTIAL_TYPES[cred.type]
            const host = getCredField(cred, 'host')
            const username = getCredField(cred, 'username')
            return (
              <tr
                key={cred.id}
                className="hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"
                onClick={() => onView(cred)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${typeConfig?.color}20` }}
                    >
                      {typeConfig?.icon && <typeConfig.icon className="w-4 h-4" style={{ color: typeConfig.color }} />}
                    </div>
                    <span className="font-medium text-sm text-[var(--text-primary)]">{cred.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: `${typeConfig?.color}20`, color: typeConfig?.color }}
                  >
                    {typeConfig?.name}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">
                  {host || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {username || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(cred) }}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Main Credential Viewer Component
const CredentialViewer = ({ 
  credentials = [], 
  viewMode = 'row',
  onViewCredential,
  onEditCredential,
  server
}) => {
  const [selectedCredential, setSelectedCredential] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const handleView = (cred) => {
    setSelectedCredential(cred)
    setShowViewModal(true)
    onViewCredential?.(cred)
  }

  const handleEdit = (cred) => {
    onEditCredential?.(cred)
  }

  const handleCopy = (value, field) => {
    // Could add toast notification here
  }

  if (credentials.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)]">
        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No credentials yet</p>
      </div>
    )
  }

  return (
    <>
      {viewMode === 'row' && (
        <CredentialRowView 
          credentials={credentials} 
          onView={handleView} 
          onEdit={handleEdit} 
        />
      )}
      {viewMode === 'cards' && (
        <CredentialCardsView 
          credentials={credentials} 
          onView={handleView} 
          onEdit={handleEdit} 
        />
      )}
      {viewMode === 'table' && (
        <CredentialTableView 
          credentials={credentials} 
          onView={handleView} 
          onEdit={handleEdit} 
        />
      )}

      <CredentialViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        credential={selectedCredential}
        server={server}
        onEdit={(cred) => {
          setShowViewModal(false)
          handleEdit(cred)
        }}
        onCopy={handleCopy}
      />
    </>
  )
}

export default CredentialViewer

