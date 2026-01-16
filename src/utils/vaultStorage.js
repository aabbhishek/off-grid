// Vault Storage Abstraction Layer
// Supports both IndexedDB and File System Access API

import { encrypt, decrypt, generateSalt, deriveKey, generateVerificationToken } from './vaultCrypto'

const SETTINGS_DB_NAME = 'offgrid-vault-settings'
const SETTINGS_DB_VERSION = 1
const FILE_EXTENSION = '.offgrid'
const VAULT_FORMAT = 'offgrid-vault'
const VAULT_VERSION = 2

let settingsDb = null

// ============ SETTINGS DB (for storing preferences & file handles) ============

const initSettingsDB = () => {
  return new Promise((resolve, reject) => {
    if (settingsDb) {
      resolve(settingsDb)
      return
    }
    
    const request = indexedDB.open(SETTINGS_DB_NAME, SETTINGS_DB_VERSION)
    
    request.onerror = () => reject(new Error('Failed to open settings database'))
    
    request.onsuccess = (event) => {
      settingsDb = event.target.result
      resolve(settingsDb)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
      
      if (!db.objectStoreNames.contains('fileHandles')) {
        db.createObjectStore('fileHandles', { keyPath: 'id' })
      }
    }
  })
}

const getSetting = async (key) => {
  const db = await initSettingsDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly')
    const store = tx.objectStore('settings')
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result?.value)
    request.onerror = () => reject(new Error('Failed to get setting'))
  })
}

const setSetting = async (key, value) => {
  const db = await initSettingsDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite')
    const store = tx.objectStore('settings')
    const request = store.put({ key, value })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to set setting'))
  })
}

const getFileHandle = async () => {
  const db = await initSettingsDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fileHandles', 'readonly')
    const store = tx.objectStore('fileHandles')
    const request = store.get('vault')
    request.onsuccess = () => resolve(request.result?.handle)
    request.onerror = () => reject(new Error('Failed to get file handle'))
  })
}

const setFileHandle = async (handle) => {
  const db = await initSettingsDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fileHandles', 'readwrite')
    const store = tx.objectStore('fileHandles')
    const request = store.put({ id: 'vault', handle, savedAt: Date.now() })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to save file handle'))
  })
}

const clearFileHandle = async () => {
  const db = await initSettingsDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fileHandles', 'readwrite')
    const store = tx.objectStore('fileHandles')
    const request = store.delete('vault')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to clear file handle'))
  })
}

// ============ BROWSER SUPPORT DETECTION ============

export const checkFileSystemSupport = () => {
  return typeof window !== 'undefined' && 
         'showSaveFilePicker' in window && 
         'showOpenFilePicker' in window
}

export const getBrowserInfo = () => {
  const ua = navigator.userAgent
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isFirefox = /Firefox/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
  const isOpera = /OPR/.test(ua)
  
  return {
    isChrome,
    isEdge,
    isFirefox,
    isSafari,
    isOpera,
    supportsFileSystem: checkFileSystemSupport(),
    name: isChrome ? 'Chrome' : isEdge ? 'Edge' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isOpera ? 'Opera' : 'Unknown'
  }
}

// ============ STORAGE TYPE MANAGEMENT ============

export const getStorageType = async () => {
  return await getSetting('storageType') || 'indexeddb'
}

export const setStorageType = async (type) => {
  await setSetting('storageType', type)
}

export const getStorageInfo = async () => {
  const type = await getStorageType()
  const fileHandle = await getFileHandle()
  
  return {
    type,
    hasFileHandle: !!fileHandle,
    fileName: fileHandle?.name || null
  }
}

// ============ FILE SYSTEM STORAGE ============

export const showSaveFilePicker = async (suggestedName = 'my-vault') => {
  if (!checkFileSystemSupport()) {
    throw new Error('File System Access API not supported')
  }
  
  const handle = await window.showSaveFilePicker({
    suggestedName: `${suggestedName}${FILE_EXTENSION}`,
    types: [{
      description: 'OffGrid Vault',
      accept: { 'application/json': [FILE_EXTENSION] }
    }]
  })
  
  await setFileHandle(handle)
  return handle
}

export const showOpenFilePicker = async () => {
  if (!checkFileSystemSupport()) {
    throw new Error('File System Access API not supported')
  }
  
  const [handle] = await window.showOpenFilePicker({
    types: [{
      description: 'OffGrid Vault',
      accept: { 'application/json': [FILE_EXTENSION, '.json'] }
    }]
  })
  
  await setFileHandle(handle)
  return handle
}

export const requestFilePermission = async (handle, mode = 'readwrite') => {
  const options = { mode }
  
  // Check current permission
  if (await handle.queryPermission(options) === 'granted') {
    return true
  }
  
  // Request permission
  if (await handle.requestPermission(options) === 'granted') {
    return true
  }
  
  return false
}

export const getStoredFileHandle = async () => {
  const handle = await getFileHandle()
  if (!handle) return null
  
  try {
    // Verify handle is still valid
    const permission = await handle.queryPermission({ mode: 'readwrite' })
    return { handle, permissionState: permission }
  } catch (e) {
    // Handle is invalid
    await clearFileHandle()
    return null
  }
}

// ============ VAULT FILE FORMAT ============

const createVaultFile = (metadata, encryptedData) => {
  return {
    format: VAULT_FORMAT,
    version: VAULT_VERSION,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    encryption: {
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2',
      iterations: 100000,
      salt: metadata.salt
    },
    verificationToken: metadata.verificationToken,
    data: encryptedData
  }
}

const parseVaultFile = (content) => {
  const data = JSON.parse(content)
  
  if (data.format !== VAULT_FORMAT) {
    throw new Error('Invalid vault file format')
  }
  
  return data
}

// ============ FILE STORAGE OPERATIONS ============

export const writeVaultToFile = async (handle, vaultData) => {
  const writable = await handle.createWritable()
  const content = JSON.stringify(vaultData, null, 2)
  await writable.write(content)
  await writable.close()
}

export const readVaultFromFile = async (handle) => {
  const file = await handle.getFile()
  const content = await file.text()
  return parseVaultFile(content)
}

// ============ UNIFIED STORAGE INTERFACE ============

export class VaultStorage {
  constructor() {
    this.type = 'indexeddb'
    this.fileHandle = null
    this.encryptionKey = null
    this.lastSaveTime = null
    this.saveTimeout = null
    this.onSaveStatusChange = null
  }
  
  async initialize() {
    this.type = await getStorageType()
    
    if (this.type === 'file') {
      const stored = await getStoredFileHandle()
      if (stored) {
        this.fileHandle = stored.handle
      }
    }
    
    return this.type
  }
  
  async exists() {
    if (this.type === 'file') {
      return !!this.fileHandle
    } else {
      // Check IndexedDB
      const { vaultExists } = await import('./vaultDB')
      return await vaultExists()
    }
  }
  
  async needsFilePermission() {
    if (this.type !== 'file' || !this.fileHandle) return false
    
    try {
      const permission = await this.fileHandle.queryPermission({ mode: 'readwrite' })
      return permission !== 'granted'
    } catch {
      return true
    }
  }
  
  async requestPermission() {
    if (!this.fileHandle) {
      throw new Error('No file handle available')
    }
    
    return await requestFilePermission(this.fileHandle)
  }
  
  async createVault(password, storageType = 'indexeddb', fileHandle = null) {
    this.type = storageType
    await setStorageType(storageType)
    
    // Generate salt and verification token
    const salt = generateSalt()
    const saltBuffer = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)))
    const key = await deriveKey(password, saltBuffer)
    const verificationToken = await generateVerificationToken(key)
    
    const metadata = {
      salt,
      verificationToken,
      schemaVersion: 1,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      settings: {
        autoLockTimeout: 15,
        lockOnTabHidden: false,
        lockOnToolSwitch: false,
        clipboardClearTimeout: 30,
        healthCheckOnUnlock: true,
        healthCheckNotifications: false,
        autoSaveEnabled: true,
        autoSaveDelay: 500,
        showSaveIndicator: true
      }
    }
    
    // Initial empty vault data
    const vaultData = {
      servers: [],
      folders: []
    }
    
    if (storageType === 'file') {
      if (!fileHandle) {
        throw new Error('File handle required for file storage')
      }
      
      this.fileHandle = fileHandle
      await setFileHandle(fileHandle)
      
      // Encrypt vault data
      const encryptedVaultData = await encrypt(vaultData, key)
      
      // Create and write vault file
      const vaultFile = createVaultFile(metadata, encryptedVaultData)
      await writeVaultToFile(fileHandle, vaultFile)
    } else {
      // Use IndexedDB
      const { saveVaultMetadata } = await import('./vaultDB')
      await saveVaultMetadata(metadata)
    }
    
    this.encryptionKey = key
    return { key, metadata }
  }
  
  async unlockVault(password) {
    if (this.type === 'file') {
      if (!this.fileHandle) {
        throw new Error('No vault file selected')
      }
      
      // Read vault file
      const vaultFile = await readVaultFromFile(this.fileHandle)
      
      // Derive key and verify
      const saltBuffer = new Uint8Array(atob(vaultFile.encryption.salt).split('').map(c => c.charCodeAt(0)))
      const key = await deriveKey(password, saltBuffer)
      
      // Verify password
      try {
        const verified = await decrypt(vaultFile.verificationToken, key)
        if (verified.verify !== 'OFFGRID_VAULT_V1') {
          throw new Error('Invalid verification')
        }
      } catch {
        throw new Error('Incorrect password')
      }
      
      this.encryptionKey = key
      
      // Decrypt vault data
      const vaultData = await decrypt(vaultFile.data, key)
      
      return {
        key,
        metadata: {
          salt: vaultFile.encryption.salt,
          verificationToken: vaultFile.verificationToken,
          createdAt: new Date(vaultFile.createdAt).getTime(),
          lastAccessedAt: Date.now(),
          settings: vaultData.settings || {}
        },
        data: vaultData
      }
    } else {
      // Use IndexedDB
      const { getVaultMetadata, saveVaultMetadata } = await import('./vaultDB')
      const { verifyPassword } = await import('./vaultCrypto')
      
      const metadata = await getVaultMetadata()
      const key = await verifyPassword(password, metadata.salt, metadata.verificationToken)
      
      if (!key) {
        throw new Error('Incorrect password')
      }
      
      // Update last accessed
      await saveVaultMetadata({
        ...metadata,
        lastAccessedAt: Date.now()
      })
      
      this.encryptionKey = key
      
      return { key, metadata, data: null }
    }
  }
  
  async saveVaultData(data) {
    if (!this.encryptionKey) {
      throw new Error('Vault not unlocked')
    }
    
    if (this.type === 'file') {
      if (!this.fileHandle) {
        throw new Error('No vault file selected')
      }
      
      // Read current file to get metadata
      const vaultFile = await readVaultFromFile(this.fileHandle)
      
      // Encrypt new data
      const encryptedData = await encrypt(data, this.encryptionKey)
      
      // Update file
      vaultFile.data = encryptedData
      vaultFile.modifiedAt = new Date().toISOString()
      
      await writeVaultToFile(this.fileHandle, vaultFile)
      this.lastSaveTime = Date.now()
      
      if (this.onSaveStatusChange) {
        this.onSaveStatusChange('saved', this.lastSaveTime)
      }
    }
    // IndexedDB saves are handled by vaultDB.js directly
  }
  
  scheduleSave(data, delay = 500) {
    if (this.type !== 'file') return
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    
    if (this.onSaveStatusChange) {
      this.onSaveStatusChange('pending')
    }
    
    this.saveTimeout = setTimeout(async () => {
      try {
        if (this.onSaveStatusChange) {
          this.onSaveStatusChange('saving')
        }
        await this.saveVaultData(data)
      } catch (err) {
        console.error('Auto-save failed:', err)
        if (this.onSaveStatusChange) {
          this.onSaveStatusChange('error', err.message)
        }
      }
    }, delay)
  }
  
  async deleteVault() {
    if (this.type === 'file') {
      await clearFileHandle()
      this.fileHandle = null
    } else {
      const { deleteVault } = await import('./vaultDB')
      await deleteVault()
    }
    
    await setSetting('storageType', null)
    this.encryptionKey = null
  }
  
  async migrateToFile(fileHandle) {
    if (!this.encryptionKey) {
      throw new Error('Vault must be unlocked to migrate')
    }
    
    // Get current data from IndexedDB
    const { getAllServers, getAllFolders, getVaultMetadata } = await import('./vaultDB')
    const [servers, folders, metadata] = await Promise.all([
      getAllServers(),
      getAllFolders(),
      getVaultMetadata()
    ])
    
    const vaultData = { servers, folders, settings: metadata.settings }
    const encryptedData = await encrypt(vaultData, this.encryptionKey)
    
    // Create vault file
    const vaultFile = createVaultFile(metadata, encryptedData)
    await writeVaultToFile(fileHandle, vaultFile)
    
    // Update storage settings
    await setFileHandle(fileHandle)
    await setStorageType('file')
    
    this.type = 'file'
    this.fileHandle = fileHandle
    
    return vaultFile
  }
  
  async migrateToIndexedDB() {
    if (!this.encryptionKey || !this.fileHandle) {
      throw new Error('Vault must be unlocked with file storage to migrate')
    }
    
    // Read from file
    const vaultFile = await readVaultFromFile(this.fileHandle)
    const vaultData = await decrypt(vaultFile.data, this.encryptionKey)
    
    // Save to IndexedDB
    const { saveVaultMetadata, saveServer, saveFolder } = await import('./vaultDB')
    
    await saveVaultMetadata({
      salt: vaultFile.encryption.salt,
      verificationToken: vaultFile.verificationToken,
      schemaVersion: 1,
      createdAt: new Date(vaultFile.createdAt).getTime(),
      lastAccessedAt: Date.now(),
      settings: vaultData.settings || {}
    })
    
    for (const server of vaultData.servers || []) {
      await saveServer(server)
    }
    
    for (const folder of vaultData.folders || []) {
      await saveFolder(folder)
    }
    
    // Update storage settings
    await clearFileHandle()
    await setStorageType('indexeddb')
    
    this.type = 'indexeddb'
    this.fileHandle = null
  }
  
  lock() {
    this.encryptionKey = null
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
  }
  
  getFileName() {
    return this.fileHandle?.name || null
  }
  
  getLastSaveTime() {
    return this.lastSaveTime
  }
}

// Singleton instance
export const vaultStorage = new VaultStorage()

