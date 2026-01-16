// Vault IndexedDB Storage Layer
// Handles all persistent storage operations

const DB_NAME = 'offgrid-vault'
const DB_VERSION = 1

// Store names
const STORES = {
  METADATA: 'metadata',
  SERVERS: 'servers',
  FOLDERS: 'folders'
}

let db = null

// Initialize the database
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      reject(new Error('Failed to open database'))
    }
    
    request.onsuccess = (event) => {
      db = event.target.result
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result
      
      // Metadata store (salt, settings, etc.)
      if (!database.objectStoreNames.contains(STORES.METADATA)) {
        database.createObjectStore(STORES.METADATA, { keyPath: 'id' })
      }
      
      // Servers store
      if (!database.objectStoreNames.contains(STORES.SERVERS)) {
        const serverStore = database.createObjectStore(STORES.SERVERS, { keyPath: 'id' })
        serverStore.createIndex('folderId', 'folderId', { unique: false })
        serverStore.createIndex('createdAt', 'createdAt', { unique: false })
        serverStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      
      // Folders store
      if (!database.objectStoreNames.contains(STORES.FOLDERS)) {
        const folderStore = database.createObjectStore(STORES.FOLDERS, { keyPath: 'id' })
        folderStore.createIndex('parentId', 'parentId', { unique: false })
        folderStore.createIndex('order', 'order', { unique: false })
      }
    }
  })
}

// Generic get operation
const getFromStore = async (storeName, key) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error(`Failed to get from ${storeName}`))
  })
}

// Generic get all operation
const getAllFromStore = async (storeName) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`))
  })
}

// Generic put operation
const putToStore = async (storeName, data) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error(`Failed to put to ${storeName}`))
  })
}

// Generic delete operation
const deleteFromStore = async (storeName, key) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`))
  })
}

// Clear a store
const clearStore = async (storeName) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error(`Failed to clear ${storeName}`))
  })
}

// ============ METADATA OPERATIONS ============

export const getVaultMetadata = async () => {
  return await getFromStore(STORES.METADATA, 'vault')
}

export const saveVaultMetadata = async (metadata) => {
  return await putToStore(STORES.METADATA, { id: 'vault', ...metadata })
}

export const vaultExists = async () => {
  const metadata = await getVaultMetadata()
  return !!metadata
}

// ============ SERVER OPERATIONS ============

export const getAllServers = async () => {
  return await getAllFromStore(STORES.SERVERS)
}

export const getServer = async (id) => {
  return await getFromStore(STORES.SERVERS, id)
}

export const saveServer = async (server) => {
  const now = Date.now()
  const data = {
    ...server,
    updatedAt: now,
    createdAt: server.createdAt || now
  }
  return await putToStore(STORES.SERVERS, data)
}

export const deleteServer = async (id) => {
  return await deleteFromStore(STORES.SERVERS, id)
}

export const getServersByFolder = async (folderId) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.SERVERS, 'readonly')
    const store = transaction.objectStore(STORES.SERVERS)
    const index = store.index('folderId')
    const request = index.getAll(folderId)
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error('Failed to get servers by folder'))
  })
}

// ============ FOLDER OPERATIONS ============

export const getAllFolders = async () => {
  return await getAllFromStore(STORES.FOLDERS)
}

export const getFolder = async (id) => {
  return await getFromStore(STORES.FOLDERS, id)
}

export const saveFolder = async (folder) => {
  const now = Date.now()
  const data = {
    ...folder,
    updatedAt: now,
    createdAt: folder.createdAt || now
  }
  return await putToStore(STORES.FOLDERS, data)
}

export const deleteFolder = async (id) => {
  return await deleteFromStore(STORES.FOLDERS, id)
}

export const getFoldersByParent = async (parentId) => {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.FOLDERS, 'readonly')
    const store = transaction.objectStore(STORES.FOLDERS)
    const index = store.index('parentId')
    const request = index.getAll(parentId)
    
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error('Failed to get folders by parent'))
  })
}

// ============ VAULT OPERATIONS ============

export const deleteVault = async () => {
  await clearStore(STORES.METADATA)
  await clearStore(STORES.SERVERS)
  await clearStore(STORES.FOLDERS)
}

export const getVaultStats = async () => {
  const servers = await getAllServers()
  const folders = await getAllFolders()
  
  return {
    serverCount: servers.length,
    folderCount: folders.length,
    credentialCount: servers.reduce((sum, s) => sum + (s.credentials?.length || 0), 0)
  }
}

// Check if browser supports required APIs
export const checkBrowserSupport = () => {
  const hasIndexedDB = 'indexedDB' in window
  const hasCrypto = 'crypto' in window && 'subtle' in crypto
  
  return {
    supported: hasIndexedDB && hasCrypto,
    indexedDB: hasIndexedDB,
    crypto: hasCrypto
  }
}

// Get approximate storage usage
export const getStorageUsage = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
    }
  }
  return { used: 0, quota: 0, percentage: 0 }
}

