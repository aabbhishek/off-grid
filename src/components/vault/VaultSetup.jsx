// Vault Setup & Authentication Components
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Lock, Eye, EyeOff, AlertTriangle, Check, X, 
  KeyRound, Loader2, ShieldCheck, Info, HardDrive, FileText,
  FolderOpen, Cloud, RefreshCw, ChevronRight
} from 'lucide-react'
import {
  vaultStorage, checkFileSystemSupport, getBrowserInfo,
  showSaveFilePicker, showOpenFilePicker, getStoredFileHandle
} from '../../utils/vaultStorage'
import { getVaultMetadata } from '../../utils/vaultDB'

// Password strength indicator
const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: 'gray' }
    
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (password.length >= 16) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    
    // Check for common patterns
    const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'letmein']
    if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
      score = Math.max(0, score - 3)
    }
    
    if (score <= 2) return { level: 1, label: 'Weak', color: '#ef4444' }
    if (score <= 4) return { level: 2, label: 'Fair', color: '#f97316' }
    if (score <= 5) return { level: 3, label: 'Good', color: '#eab308' }
    if (score <= 6) return { level: 4, label: 'Strong', color: '#22c55e' }
    return { level: 5, label: 'Very Strong', color: '#10b981' }
  }
  
  const strength = getStrength()
  
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= strength.level ? strength.color : 'var(--bg-tertiary)'
            }}
          />
        ))}
      </div>
      {password && (
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: strength.color }}>{strength.label}</span>
          <span className="text-[var(--text-tertiary)]">{password.length} characters</span>
        </div>
      )}
    </div>
  )
}

// Storage Option Card
const StorageOption = ({ type, selected, onSelect, disabled, browserInfo }) => {
  const isFile = type === 'file'
  
  return (
    <button
      onClick={() => !disabled && onSelect(type)}
      disabled={disabled}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        selected 
          ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
          : disabled 
            ? 'border-[var(--border-color)] opacity-50 cursor-not-allowed'
            : 'border-[var(--border-color)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-tertiary)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          selected ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
        }`}>
          {isFile ? (
            <FileText className={`w-5 h-5 ${selected ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
          ) : (
            <HardDrive className={`w-5 h-5 ${selected ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text-primary)]">
              {isFile ? 'Local File Storage' : 'Browser Storage'}
            </span>
            {!isFile && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {isFile 
              ? 'Save vault as a file you control. Enable sync via cloud services.'
              : 'Store in browser. Simple setup, works in all browsers.'
            }
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {isFile ? (
              <>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  <Cloud className="w-3 h-3 inline mr-1" />
                  Cloud sync ready
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  Multi-browser access
                </span>
              </>
            ) : (
              <>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  All browsers
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  No file management
                </span>
              </>
            )}
          </div>
          {isFile && disabled && (
            <p className="text-xs text-amber-500 mt-2">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Requires Chrome, Edge, or Opera. You're using {browserInfo.name}.
            </p>
          )}
        </div>
        {selected && (
          <Check className="w-5 h-5 text-[var(--accent)]" />
        )}
      </div>
    </button>
  )
}

// Vault Creation Screen
export const VaultCreate = ({ onVaultCreated }) => {
  const [step, setStep] = useState('storage') // 'storage', 'file', 'password'
  const [storageType, setStorageType] = useState('indexeddb')
  const [fileHandle, setFileHandle] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  
  const browserInfo = getBrowserInfo()
  const supportsFileSystem = browserInfo.supportsFileSystem
  
  const isPasswordValid = password.length >= 8 && password === confirmPassword && acknowledged
  
  const handleStorageSelect = (type) => {
    setStorageType(type)
  }
  
  const handleContinue = async () => {
    if (step === 'storage') {
      if (storageType === 'file') {
        setStep('file')
      } else {
        setStep('password')
      }
    } else if (step === 'file') {
      try {
        const handle = await showSaveFilePicker('my-vault')
        setFileHandle(handle)
        setStep('password')
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Failed to select file location: ' + err.message)
        }
      }
    }
  }
  
  const handleCreate = async () => {
    if (!isPasswordValid) return
    
    setCreating(true)
    setError('')
    
    try {
      const { key, metadata } = await vaultStorage.createVault(
        password,
        storageType === 'file' ? 'file' : 'indexeddb',
        fileHandle
      )
      
      onVaultCreated(key, storageType, metadata)
    } catch (err) {
      setError('Failed to create vault: ' + err.message)
    } finally {
      setCreating(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center"
        >
          <Shield className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Create Your Vault</h1>
        <p className="text-[var(--text-secondary)]">
          {step === 'storage' && 'Choose where to store your encrypted vault'}
          {step === 'file' && 'Select where to save your vault file'}
          {step === 'password' && 'Set up your master password'}
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full ${step === 'storage' ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`} />
        {storageType === 'file' && (
          <div className={`w-2 h-2 rounded-full ${step === 'file' ? 'bg-[var(--accent)]' : step === 'password' ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`} />
        )}
        <div className={`w-2 h-2 rounded-full ${step === 'password' ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`} />
      </div>
      
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Storage Selection */}
          {step === 'storage' && (
            <motion.div
              key="storage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <StorageOption
                type="indexeddb"
                selected={storageType === 'indexeddb'}
                onSelect={handleStorageSelect}
                browserInfo={browserInfo}
              />
              <StorageOption
                type="file"
                selected={storageType === 'file'}
                onSelect={handleStorageSelect}
                disabled={!supportsFileSystem}
                browserInfo={browserInfo}
              />
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinue}
                className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
          
          {/* Step 2: File Location (only for file storage) */}
          {step === 'file' && (
            <motion.div
              key="file"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-[var(--accent)]" />
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Choose where to save your vault file. Consider saving in a cloud-synced folder (Dropbox, Google Drive) for multi-device access.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  className="px-6 py-3 rounded-xl font-medium bg-[var(--accent)] text-white"
                >
                  Choose Save Location
                </motion.button>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}
              
              <button
                onClick={() => setStep('storage')}
                className="w-full py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                ← Back to storage selection
              </button>
            </motion.div>
          )}
          
          {/* Step 3: Password */}
          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Storage Info Badge */}
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-center gap-3">
                {storageType === 'file' ? (
                  <>
                    <FileText className="w-5 h-5 text-[var(--accent)]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">Local File Storage</div>
                      <div className="text-xs text-[var(--text-tertiary)] truncate">{fileHandle?.name}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-5 h-5 text-[var(--accent)]" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[var(--text-primary)]">Browser Storage</div>
                      <div className="text-xs text-[var(--text-tertiary)]">Stored in {browserInfo.name}</div>
                    </div>
                  </>
                )}
                <button
                  onClick={() => setStep('storage')}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Change
                </button>
              </div>
              
              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Master Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter master password"
                    className="glass-input pl-11 pr-11 py-3 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              
              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm master password"
                    className="glass-input pl-11 py-3 font-mono"
                  />
                  {confirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {password === confirmPassword ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Warning Acknowledgment */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                      <strong>Important:</strong> There is no way to recover your vault if you forget your master password. 
                      All data will be lost permanently.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="w-4 h-4 rounded border-amber-500 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm text-[var(--text-secondary)]">
                        I understand and accept this risk
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                disabled={!isPasswordValid || creating}
                className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Vault...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Create Vault
                  </>
                )}
              </motion.button>
              
              {/* Security Info */}
              <div className="pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-start gap-2 text-xs text-[var(--text-tertiary)]">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Your vault uses AES-256-GCM encryption with PBKDF2 key derivation (100,000 iterations). 
                    All data is encrypted locally and never leaves your device.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Vault Unlock Screen
export const VaultUnlock = ({ onUnlocked, vaultStats, lastAccessed, storageType, fileName }) => {
  const [step, setStep] = useState(storageType === 'file' ? 'permission' : 'password')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [requestingPermission, setRequestingPermission] = useState(false)
  
  const handleRequestPermission = async () => {
    setRequestingPermission(true)
    setError('')
    
    try {
      const granted = await vaultStorage.requestPermission()
      if (granted) {
        setPermissionGranted(true)
        setStep('password')
      } else {
        setError('Permission denied. Please allow access to your vault file.')
      }
    } catch (err) {
      setError('Failed to request permission: ' + err.message)
    } finally {
      setRequestingPermission(false)
    }
  }
  
  const handleSelectDifferentFile = async () => {
    setError('')
    
    try {
      await showOpenFilePicker()
      setPermissionGranted(true)
      setStep('password')
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to select file: ' + err.message)
      }
    }
  }
  
  const handleUnlock = async () => {
    if (!password) return
    
    setUnlocking(true)
    setError('')
    
    try {
      const result = await vaultStorage.unlockVault(password)
      onUnlocked(result.key, result.metadata, result.data)
    } catch (err) {
      setAttempts(prev => prev + 1)
      setError(err.message || 'Incorrect password')
      setPassword('')
    } finally {
      setUnlocking(false)
    }
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUnlock()
    }
  }
  
  const formatLastAccessed = () => {
    if (!lastAccessed) return 'Never'
    const date = new Date(lastAccessed)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    return date.toLocaleDateString()
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-purple-600/20 border border-[var(--accent)]/30 flex items-center justify-center"
        >
          <Lock className="w-10 h-10 text-[var(--accent)]" />
        </motion.div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Unlock Vault</h1>
        <p className="text-[var(--text-secondary)]">
          {step === 'permission' 
            ? 'Grant access to your vault file'
            : 'Enter your master password to access your credentials'
          }
        </p>
      </div>
      
      <div className="glass-card rounded-2xl p-6 space-y-6">
        {/* Storage Type Badge */}
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-center gap-3">
          {storageType === 'file' ? (
            <>
              <FileText className="w-5 h-5 text-[var(--accent)]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)]">Local File Storage</div>
                <div className="text-xs text-[var(--text-tertiary)] truncate">{fileName || 'vault.offgrid'}</div>
              </div>
            </>
          ) : (
            <>
              <HardDrive className="w-5 h-5 text-[var(--accent)]" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)]">Browser Storage</div>
              </div>
            </>
          )}
        </div>
        
        {/* Vault Stats */}
        {vaultStats && step === 'password' && (
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{vaultStats.serverCount}</div>
              <div className="text-xs text-[var(--text-tertiary)]">Servers</div>
            </div>
            <div className="text-center border-x border-[var(--border-color)]">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{vaultStats.credentialCount}</div>
              <div className="text-xs text-[var(--text-tertiary)]">Credentials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{vaultStats.folderCount}</div>
              <div className="text-xs text-[var(--text-tertiary)]">Folders</div>
            </div>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {/* File Permission Step */}
          {step === 'permission' && storageType === 'file' && (
            <motion.div
              key="permission"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-[var(--accent)]" />
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Your vault file needs access permission. This is required each time you open the browser.
                </p>
                
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRequestPermission}
                    disabled={requestingPermission}
                    className="w-full py-3 rounded-xl font-medium bg-[var(--accent)] text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {requestingPermission ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Requesting Access...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Grant Access
                      </>
                    )}
                  </motion.button>
                  
                  <button
                    onClick={handleSelectDifferentFile}
                    className="w-full py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
                  >
                    Select Different File
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </motion.div>
          )}
          
          {/* Password Step */}
          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter master password"
                    className="glass-input pl-11 pr-11 py-3 font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                  {attempts > 2 && (
                    <span className="text-xs ml-auto">
                      ({attempts} attempts)
                    </span>
                  )}
                </motion.div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnlock}
                disabled={!password || unlocking}
                className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white"
              >
                {unlocking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Unlock
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Last Accessed */}
        <div className="text-center text-xs text-[var(--text-tertiary)]">
          Last accessed: {formatLastAccessed()}
        </div>
      </div>
    </motion.div>
  )
}
