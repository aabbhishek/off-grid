// Credential Form Component
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, Cloud, Shield, MessageSquare, GitBranch, Globe,
  Key, Eye, EyeOff, Dices, Copy, Check, Save, X, ChevronDown,
  Server, Lock, FileText
} from 'lucide-react'
import PasswordGenerator from './PasswordGenerator'

// Credential type definitions with their fields
export const CREDENTIAL_TYPES = {
  // Databases
  postgresql: {
    name: 'PostgreSQL',
    category: 'database',
    icon: Database,
    color: '#336791',
    fields: [
      { key: 'host', label: 'Host', placeholder: 'localhost', default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', default: 5432 },
      { key: 'database', label: 'Database', placeholder: 'mydb' },
      { key: 'username', label: 'Username', placeholder: 'postgres' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'sslMode', label: 'SSL Mode', type: 'select', options: ['disable', 'require', 'verify-ca', 'verify-full'], default: 'disable' }
    ],
    connectionStrings: (data) => ({
      'URI': `postgresql://${data.username}:${data.password}@${data.host}:${data.port}/${data.database}${data.sslMode !== 'disable' ? `?sslmode=${data.sslMode}` : ''}`,
      'JDBC': `jdbc:postgresql://${data.host}:${data.port}/${data.database}?user=${data.username}&password=${data.password}`,
      'psql': `PGPASSWORD='${data.password}' psql -h ${data.host} -p ${data.port} -U ${data.username} -d ${data.database}`
    })
  },
  mysql: {
    name: 'MySQL',
    category: 'database',
    icon: Database,
    color: '#4479A1',
    fields: [
      { key: 'host', label: 'Host', placeholder: 'localhost', default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', default: 3306 },
      { key: 'database', label: 'Database', placeholder: 'mydb' },
      { key: 'username', label: 'Username', placeholder: 'root' },
      { key: 'password', label: 'Password', type: 'password' }
    ],
    connectionStrings: (data) => ({
      'URI': `mysql://${data.username}:${data.password}@${data.host}:${data.port}/${data.database}`,
      'JDBC': `jdbc:mysql://${data.host}:${data.port}/${data.database}?user=${data.username}&password=${data.password}`,
      'mysql': `mysql -h ${data.host} -P ${data.port} -u ${data.username} -p'${data.password}' ${data.database}`
    })
  },
  mongodb: {
    name: 'MongoDB',
    category: 'database',
    icon: Database,
    color: '#47A248',
    fields: [
      { key: 'host', label: 'Host', placeholder: 'localhost', default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', default: 27017 },
      { key: 'database', label: 'Database', placeholder: 'mydb' },
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'authSource', label: 'Auth Source', placeholder: 'admin', default: 'admin' }
    ],
    connectionStrings: (data) => ({
      'URI': `mongodb://${data.username}:${data.password}@${data.host}:${data.port}/${data.database}?authSource=${data.authSource}`
    })
  },
  redis: {
    name: 'Redis',
    category: 'database',
    icon: Database,
    color: '#DC382D',
    fields: [
      { key: 'host', label: 'Host', placeholder: 'localhost', default: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', default: 6379 },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'database', label: 'Database Index', type: 'number', default: 0 }
    ],
    connectionStrings: (data) => ({
      'URI': `redis://:${data.password}@${data.host}:${data.port}/${data.database}`,
      'redis-cli': `redis-cli -h ${data.host} -p ${data.port} -a '${data.password}' -n ${data.database}`
    })
  },
  // Cloud & Services
  aws: {
    name: 'AWS',
    category: 'cloud',
    icon: Cloud,
    color: '#FF9900',
    fields: [
      { key: 'accessKeyId', label: 'Access Key ID' },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
      { key: 'region', label: 'Region', placeholder: 'us-east-1', default: 'us-east-1' },
      { key: 'accountId', label: 'Account ID' }
    ]
  },
  azure: {
    name: 'Azure',
    category: 'cloud',
    icon: Cloud,
    color: '#0078D4',
    fields: [
      { key: 'tenantId', label: 'Tenant ID' },
      { key: 'clientId', label: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'subscriptionId', label: 'Subscription ID' }
    ]
  },
  // Monitoring
  grafana: {
    name: 'Grafana',
    category: 'monitoring',
    icon: Globe,
    color: '#F46800',
    fields: [
      { key: 'url', label: 'URL', placeholder: 'https://grafana.example.com' },
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'apiKey', label: 'API Key', type: 'password' }
    ]
  },
  // Security
  vault: {
    name: 'HashiCorp Vault',
    category: 'security',
    icon: Shield,
    color: '#000000',
    fields: [
      { key: 'url', label: 'URL', placeholder: 'https://vault.example.com' },
      { key: 'token', label: 'Token', type: 'password' },
      { key: 'namespace', label: 'Namespace' },
      { key: 'secretPath', label: 'Secret Path', placeholder: 'secret/data/myapp' }
    ]
  },
  // CI/CD
  jenkins: {
    name: 'Jenkins',
    category: 'cicd',
    icon: GitBranch,
    color: '#D24939',
    fields: [
      { key: 'url', label: 'URL', placeholder: 'https://jenkins.example.com' },
      { key: 'username', label: 'Username' },
      { key: 'apiToken', label: 'API Token', type: 'password' }
    ]
  },
  gitlab: {
    name: 'GitLab',
    category: 'cicd',
    icon: GitBranch,
    color: '#FC6D26',
    fields: [
      { key: 'url', label: 'URL', placeholder: 'https://gitlab.com' },
      { key: 'username', label: 'Username' },
      { key: 'accessToken', label: 'Access Token', type: 'password' }
    ]
  },
  kubernetes: {
    name: 'Kubernetes',
    category: 'cicd',
    icon: Server,
    color: '#326CE5',
    fields: [
      { key: 'clusterUrl', label: 'Cluster URL', placeholder: 'https://kubernetes.default.svc' },
      { key: 'namespace', label: 'Namespace', default: 'default' },
      { key: 'token', label: 'Service Account Token', type: 'password' },
      { key: 'kubeconfig', label: 'Kubeconfig', type: 'textarea' }
    ]
  },
  // Web Services
  api: {
    name: 'API',
    category: 'web',
    icon: Globe,
    color: '#6366F1',
    fields: [
      { key: 'url', label: 'Base URL', placeholder: 'https://api.example.com' },
      { key: 'authType', label: 'Auth Type', type: 'select', options: ['None', 'API Key', 'Bearer Token', 'Basic Auth', 'OAuth2'], default: 'API Key' },
      { key: 'apiKey', label: 'API Key / Token', type: 'password' },
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password', type: 'password' }
    ]
  },
  oauth: {
    name: 'OAuth / OIDC',
    category: 'web',
    icon: Lock,
    color: '#10B981',
    fields: [
      { key: 'issuer', label: 'Issuer URL' },
      { key: 'clientId', label: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'scopes', label: 'Scopes', placeholder: 'openid profile email' },
      { key: 'redirectUri', label: 'Redirect URI' }
    ]
  },
  // Generic
  generic: {
    name: 'Generic Credential',
    category: 'generic',
    icon: Key,
    color: '#8B5CF6',
    fields: [
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  }
}

const CATEGORIES = {
  database: { name: 'Databases', icon: Database },
  cloud: { name: 'Cloud Services', icon: Cloud },
  monitoring: { name: 'Monitoring', icon: Globe },
  security: { name: 'Security & Secrets', icon: Shield },
  cicd: { name: 'CI/CD & DevOps', icon: GitBranch },
  web: { name: 'Web Services', icon: Globe },
  generic: { name: 'Generic', icon: Key }
}

const CredentialForm = ({ credential, onSave, onCancel }) => {
  const [selectedType, setSelectedType] = useState(credential?.type || null)
  const [name, setName] = useState(credential?.name || '')
  const [notes, setNotes] = useState(credential?.notes || '')
  const [data, setData] = useState(credential?.data || {})
  const [showPassword, setShowPassword] = useState({})
  const [showGenerator, setShowGenerator] = useState(null)
  const [copied, setCopied] = useState(null)
  
  const typeConfig = selectedType ? CREDENTIAL_TYPES[selectedType] : null
  
  // Initialize data with defaults when type changes
  useEffect(() => {
    if (typeConfig && !credential) {
      const defaults = {}
      typeConfig.fields.forEach(field => {
        if (field.default !== undefined) {
          defaults[field.key] = field.default
        }
      })
      setData(defaults)
    }
  }, [selectedType])
  
  // Group types by category
  const typesByCategory = useMemo(() => {
    const grouped = {}
    Object.entries(CREDENTIAL_TYPES).forEach(([key, type]) => {
      if (!grouped[type.category]) {
        grouped[type.category] = []
      }
      grouped[type.category].push({ key, ...type })
    })
    return grouped
  }, [])
  
  const connectionStrings = useMemo(() => {
    if (typeConfig?.connectionStrings) {
      return typeConfig.connectionStrings(data)
    }
    return {}
  }, [typeConfig, data])
  
  const handleFieldChange = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }))
  }
  
  const handleCopy = async (text, key) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id: credential?.id || crypto.randomUUID(),
      type: selectedType,
      name,
      notes,
      data
    })
  }
  
  // Type Selection Screen
  if (!selectedType) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Select Credential Type</h3>
        
        {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
          const types = typesByCategory[categoryKey]
          if (!types?.length) return null
          
          return (
            <div key={categoryKey} className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <category.icon className="w-4 h-4" />
                {category.name}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {types.map(type => (
                  <button
                    key={type.key}
                    onClick={() => setSelectedType(type.key)}
                    className="p-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${type.color}20` }}
                      >
                        <type.icon className="w-4 h-4" style={{ color: type.color }} />
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{type.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        
        <button
          onClick={onCancel}
          className="w-full py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
        >
          Cancel
        </button>
      </div>
    )
  }
  
  // Credential Form
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-color)]">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${typeConfig.color}20` }}
        >
          <typeConfig.icon className="w-5 h-5" style={{ color: typeConfig.color }} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)]">{typeConfig.name}</h3>
          <button
            type="button"
            onClick={() => setSelectedType(null)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Change type
          </button>
        </div>
      </div>
      
      {/* Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Display Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`My ${typeConfig.name}`}
          required
          className="glass-input"
        />
      </div>
      
      {/* Dynamic Fields */}
      <div className="space-y-4">
        {typeConfig.fields.map(field => (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              {field.label}
            </label>
            
            {field.type === 'select' ? (
              <select
                value={data[field.key] || field.default || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="glass-input"
              >
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={data[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={4}
                className="glass-input font-mono text-xs"
              />
            ) : field.type === 'password' ? (
              <div className="relative">
                <input
                  type={showPassword[field.key] ? 'text' : 'password'}
                  value={data[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="glass-input pr-24 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                    className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                  >
                    {showPassword[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(showGenerator === field.key ? null : field.key)}
                    className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                </div>
                
                <AnimatePresence>
                  {showGenerator === field.key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                    >
                      <PasswordGenerator
                        onUse={(pwd) => {
                          handleFieldChange(field.key, pwd)
                          setShowGenerator(null)
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <input
                type={field.type || 'text'}
                value={data[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="glass-input"
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Connection Strings */}
      {Object.keys(connectionStrings).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--text-secondary)]">Connection Strings</h4>
          {Object.entries(connectionStrings).map(([format, str]) => (
            <div key={format} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-tertiary)]">{format}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(str, format)}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                >
                  {copied === format ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <code className="text-xs font-mono text-[var(--text-primary)] break-all">{str}</code>
            </div>
          ))}
        </div>
      )}
      
      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={2}
          className="glass-input"
        />
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          Cancel
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!name}
          className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {credential ? 'Update' : 'Save'}
        </motion.button>
      </div>
    </form>
  )
}

export default CredentialForm

