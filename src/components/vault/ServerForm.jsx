// Server Form Component
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Server, Globe, User, KeyRound, Eye, EyeOff, Dices, FileText,
  Monitor, Cloud, Building, Tag, Link, Heart, Save, X, Plus, Trash2,
  ChevronDown, ChevronUp, Shield
} from 'lucide-react'
import PasswordGenerator from './PasswordGenerator'

const PROTOCOLS = [
  { value: 'ssh', label: 'SSH', port: 22 },
  { value: 'rdp', label: 'RDP', port: 3389 },
  { value: 'vnc', label: 'VNC', port: 5900 },
  { value: 'custom', label: 'Custom', port: null }
]

const ENVIRONMENTS = [
  { value: 'production', label: 'Production', color: '#ef4444' },
  { value: 'staging', label: 'Staging', color: '#f97316' },
  { value: 'development', label: 'Development', color: '#22c55e' },
  { value: 'testing', label: 'Testing', color: '#3b82f6' },
  { value: 'other', label: 'Other', color: '#8b5cf6' }
]

const INFRASTRUCTURE_TYPES = [
  { value: 'aws', label: 'AWS', icon: '☁️' },
  { value: 'azure', label: 'Azure', icon: '☁️' },
  { value: 'gcp', label: 'GCP', icon: '☁️' },
  { value: 'digitalocean', label: 'DigitalOcean', icon: '☁️' },
  { value: 'onpremise', label: 'On-Premise', icon: '🏢' },
  { value: 'internal', label: 'Internal', icon: '🔒' },
  { value: 'external', label: 'External', icon: '🌐' }
]

const AUTH_METHODS = [
  { value: 'password', label: 'Password' },
  { value: 'key', label: 'SSH Key' },
  { value: 'both', label: 'Both' }
]

const ServerForm = ({ server, folders, onSave, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    connection: true,
    auth: true,
    classification: false,
    health: false,
    notes: false
  })
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    folderId: null,
    tags: [],
    // Connection
    hostname: '',
    port: 22,
    protocol: 'ssh',
    // Auth
    username: '',
    authMethod: 'password',
    password: '',
    privateKey: '',
    // Classification
    environment: 'development',
    infrastructure: 'internal',
    region: '',
    instanceId: '',
    // Health
    healthCheckUrl: '',
    healthCheckExpectedStatus: 200,
    healthCheckInterval: 5,
    healthCheckOnUnlock: true,
    healthCheckNotify: false,
    // Notes
    notes: '',
    // Credentials
    credentials: []
  })
  
  const [tagInput, setTagInput] = useState('')
  
  useEffect(() => {
    if (server) {
      setFormData({
        ...formData,
        ...server
      })
    }
  }, [server])
  
  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Update port when protocol changes
      if (field === 'protocol') {
        const protocol = PROTOCOLS.find(p => p.value === value)
        if (protocol?.port) {
          updated.port = protocol.port
        }
      }
      
      return updated
    })
  }
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }
  
  const removeTag = (tag) => {
    handleChange('tags', formData.tags.filter(t => t !== tag))
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }
  
  const SectionHeader = ({ title, icon: Icon, section }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--accent)]" />
        <span className="font-medium text-[var(--text-primary)]">{title}</span>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
      ) : (
        <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
      )}
    </button>
  )
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Server Name *
            </label>
            <div className="relative">
              <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="My Server"
                required
                className="glass-input pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Folder
            </label>
            <select
              value={formData.folderId || ''}
              onChange={(e) => handleChange('folderId', e.target.value || null)}
              className="glass-input"
            >
              <option value="">Root (No Folder)</option>
              {folders?.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of this server"
            className="glass-input"
          />
        </div>
        
        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[var(--accent)]/20 text-[var(--accent)]"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag..."
              className="glass-input flex-1"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent)]/20 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Connection Section */}
      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader title="Connection Details" icon={Globe} section="connection" />
        <AnimatePresence>
          {expandedSections.connection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Hostname / IP *
                  </label>
                  <input
                    type="text"
                    value={formData.hostname}
                    onChange={(e) => handleChange('hostname', e.target.value)}
                    placeholder="server.example.com or 192.168.1.1"
                    required
                    className="glass-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Port *
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => handleChange('port', parseInt(e.target.value) || '')}
                    required
                    className="glass-input"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Protocol
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROTOCOLS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleChange('protocol', p.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.protocol === p.value
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Authentication Section */}
      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader title="Authentication" icon={Shield} section="auth" />
        <AnimatePresence>
          {expandedSections.auth && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="root"
                    className="glass-input pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Authentication Method
                </label>
                <div className="flex gap-2">
                  {AUTH_METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => handleChange('authMethod', m.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.authMethod === m.value
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {(formData.authMethod === 'password' || formData.authMethod === 'both') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Enter password"
                      className="glass-input pl-10 pr-24 font-mono"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowGenerator(!showGenerator)}
                        className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                      >
                        <Dices className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {showGenerator && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                      >
                        <PasswordGenerator
                          onUse={(pwd) => {
                            handleChange('password', pwd)
                            setShowGenerator(false)
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {(formData.authMethod === 'key' || formData.authMethod === 'both') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    SSH Private Key
                  </label>
                  <textarea
                    value={formData.privateKey}
                    onChange={(e) => handleChange('privateKey', e.target.value)}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                    rows={6}
                    className="glass-input font-mono text-xs"
                  />
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Paste your private key content or upload a .pem file
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Classification Section */}
      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader title="Classification" icon={Building} section="classification" />
        <AnimatePresence>
          {expandedSections.classification && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Environment
                </label>
                <div className="flex flex-wrap gap-2">
                  {ENVIRONMENTS.map(env => (
                    <button
                      key={env.value}
                      type="button"
                      onClick={() => handleChange('environment', env.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.environment === env.value
                          ? 'text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:opacity-80'
                      }`}
                      style={{
                        background: formData.environment === env.value ? env.color : undefined
                      }}
                    >
                      {env.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Infrastructure Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {INFRASTRUCTURE_TYPES.map(infra => (
                    <button
                      key={infra.value}
                      type="button"
                      onClick={() => handleChange('infrastructure', infra.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.infrastructure === infra.value
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20'
                      }`}
                    >
                      {infra.icon} {infra.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Region
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => handleChange('region', e.target.value)}
                    placeholder="us-east-1"
                    className="glass-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Instance ID
                  </label>
                  <input
                    type="text"
                    value={formData.instanceId}
                    onChange={(e) => handleChange('instanceId', e.target.value)}
                    placeholder="i-1234567890abcdef0"
                    className="glass-input"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Health Check Section */}
      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader title="Health Monitoring" icon={Heart} section="health" />
        <AnimatePresence>
          {expandedSections.health && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 space-y-4"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Health Check URL
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                  <input
                    type="url"
                    value={formData.healthCheckUrl}
                    onChange={(e) => handleChange('healthCheckUrl', e.target.value)}
                    placeholder="https://example.com/health"
                    className="glass-input pl-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Expected Status Code
                  </label>
                  <input
                    type="number"
                    value={formData.healthCheckExpectedStatus}
                    onChange={(e) => handleChange('healthCheckExpectedStatus', parseInt(e.target.value) || 200)}
                    className="glass-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Check Interval (minutes)
                  </label>
                  <select
                    value={formData.healthCheckInterval}
                    onChange={(e) => handleChange('healthCheckInterval', parseInt(e.target.value))}
                    className="glass-input"
                  >
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.healthCheckOnUnlock}
                    onChange={(e) => handleChange('healthCheckOnUnlock', e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--accent)]"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">Check on vault unlock</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.healthCheckNotify}
                    onChange={(e) => handleChange('healthCheckNotify', e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--accent)]"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">Notify on failure</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Notes Section */}
      <div className="glass-card rounded-xl overflow-hidden">
        <SectionHeader title="Notes" icon={FileText} section="notes" />
        <AnimatePresence>
          {expandedSections.notes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4"
            >
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this server..."
                rows={4}
                className="glass-input"
              />
            </motion.div>
          )}
        </AnimatePresence>
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
          className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {server ? 'Update Server' : 'Save Server'}
        </motion.button>
      </div>
    </form>
  )
}

export default ServerForm

