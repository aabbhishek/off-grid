// Vault Encryption Utilities
// AES-256-GCM encryption with PBKDF2 key derivation

const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 256

// Generate cryptographically secure random bytes
export const generateRandomBytes = (length) => {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

// Convert array buffer to hex string
export const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Convert hex string to array buffer
export const hexToBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes.buffer
}

// Convert array buffer to base64
export const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
}

// Convert base64 to array buffer
export const base64ToBuffer = (base64) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Derive encryption key from password using PBKDF2
export const deriveKey = async (password, salt) => {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  // Derive AES-GCM key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
  
  return key
}

// Encrypt data with AES-256-GCM
export const encrypt = async (data, key) => {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(JSON.stringify(data))
  
  // Generate random IV for this encryption
  const iv = generateRandomBytes(IV_LENGTH)
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  )
  
  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv)
  }
}

// Decrypt data with AES-256-GCM
export const decrypt = async (encryptedData, key) => {
  const ciphertext = base64ToBuffer(encryptedData.ciphertext)
  const iv = base64ToBuffer(encryptedData.iv)
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    
    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decrypted))
  } catch (e) {
    throw new Error('Decryption failed - invalid password or corrupted data')
  }
}

// Generate a verification token to check if password is correct
export const generateVerificationToken = async (key) => {
  const testData = { verify: 'OFFGRID_VAULT_V1' }
  return await encrypt(testData, key)
}

// Verify password by attempting to decrypt verification token
export const verifyPassword = async (password, salt, verificationToken) => {
  try {
    const saltBuffer = base64ToBuffer(salt)
    const key = await deriveKey(password, saltBuffer)
    const decrypted = await decrypt(verificationToken, key)
    return decrypted.verify === 'OFFGRID_VAULT_V1' ? key : null
  } catch {
    return null
  }
}

// Generate a new salt for vault creation
export const generateSalt = () => {
  return bufferToBase64(generateRandomBytes(SALT_LENGTH))
}

// Generate secure random password
export const generatePassword = (options = {}) => {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false
  } = options
  
  let charset = ''
  const ambiguous = '0O1lI'
  
  if (uppercase) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (excludeAmbiguous) chars = chars.replace(/[OI]/g, '')
    charset += chars
  }
  if (lowercase) {
    let chars = 'abcdefghijklmnopqrstuvwxyz'
    if (excludeAmbiguous) chars = chars.replace(/[l]/g, '')
    charset += chars
  }
  if (numbers) {
    let chars = '0123456789'
    if (excludeAmbiguous) chars = chars.replace(/[01]/g, '')
    charset += chars
  }
  if (symbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }
  
  if (charset.length === 0) {
    charset = 'abcdefghijklmnopqrstuvwxyz'
  }
  
  const randomBytes = generateRandomBytes(length)
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length]
  }
  
  return password
}

// Generate passphrase from word list
const WORD_LIST = [
  'ability', 'able', 'about', 'above', 'accept', 'account', 'across', 'action',
  'active', 'actual', 'address', 'admit', 'adult', 'affect', 'after', 'again',
  'against', 'agent', 'agree', 'ahead', 'allow', 'almost', 'alone', 'along',
  'already', 'also', 'always', 'among', 'amount', 'animal', 'answer', 'anyone',
  'appear', 'apply', 'approach', 'argue', 'around', 'artist', 'assume', 'attack',
  'attend', 'author', 'avoid', 'become', 'before', 'begin', 'behavior', 'behind',
  'believe', 'benefit', 'better', 'between', 'beyond', 'billion', 'blood', 'board',
  'body', 'book', 'break', 'bring', 'brother', 'budget', 'build', 'building',
  'business', 'camera', 'campaign', 'cancer', 'candidate', 'capital', 'career',
  'carry', 'catch', 'cause', 'center', 'central', 'century', 'certain', 'chair',
  'challenge', 'chance', 'change', 'chapter', 'character', 'charge', 'check',
  'child', 'choice', 'choose', 'church', 'citizen', 'claim', 'class', 'clear',
  'close', 'coach', 'cold', 'collection', 'college', 'color', 'come', 'commercial',
  'common', 'community', 'company', 'compare', 'computer', 'concern', 'condition',
  'conference', 'congress', 'consider', 'consumer', 'contain', 'continue',
  'control', 'cost', 'could', 'country', 'couple', 'course', 'court', 'cover',
  'create', 'crime', 'culture', 'current', 'customer', 'dark', 'daughter', 'dead',
  'deal', 'death', 'debate', 'decade', 'decide', 'decision', 'deep', 'defense',
  'degree', 'democrat', 'describe', 'design', 'despite', 'detail', 'determine',
  'develop', 'difference', 'different', 'difficult', 'dinner', 'direction',
  'director', 'discover', 'discuss', 'disease', 'doctor', 'door', 'down', 'draw',
  'dream', 'drive', 'drop', 'drug', 'during', 'each', 'early', 'east', 'easy',
  'economic', 'economy', 'edge', 'education', 'effect', 'effort', 'eight',
  'either', 'election', 'employee', 'energy', 'enjoy', 'enough', 'enter', 'entire',
  'environment', 'especially', 'establish', 'even', 'evening', 'event', 'every',
  'everybody', 'everyone', 'evidence', 'exact', 'example', 'executive', 'exist',
  'expect', 'experience', 'expert', 'explain', 'face', 'fact', 'factor', 'fail',
  'fall', 'family', 'father', 'fear', 'federal', 'feel', 'feeling', 'field',
  'fight', 'figure', 'fill', 'film', 'final', 'finally', 'financial', 'find',
  'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fish', 'five', 'floor',
  'focus', 'follow', 'food', 'foot', 'force', 'foreign', 'forget', 'form',
  'former', 'forward', 'four', 'free', 'friend', 'from', 'front', 'full', 'fund',
  'future', 'game', 'garden', 'general', 'generation', 'girl', 'give', 'glass',
  'goal', 'good', 'government', 'great', 'green', 'ground', 'group', 'grow',
  'growth', 'guess', 'hair', 'half', 'hand', 'hang', 'happen', 'happy', 'hard',
  'have', 'head', 'health', 'hear', 'heart', 'heat', 'heavy', 'help', 'here',
  'herself', 'high', 'himself', 'history', 'hold', 'home', 'hope', 'hospital',
  'hotel', 'hour', 'house', 'however', 'huge', 'human', 'hundred', 'husband'
]

export const generatePassphrase = (options = {}) => {
  const {
    wordCount = 4,
    separator = '-',
    capitalize = true
  } = options
  
  const randomBytes = generateRandomBytes(wordCount * 2)
  const words = []
  
  for (let i = 0; i < wordCount; i++) {
    const index = (randomBytes[i * 2] << 8 | randomBytes[i * 2 + 1]) % WORD_LIST.length
    let word = WORD_LIST[index]
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1)
    }
    words.push(word)
  }
  
  return words.join(separator)
}

// Calculate password entropy
export const calculateEntropy = (options) => {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false
  } = options
  
  let poolSize = 0
  
  if (uppercase) poolSize += excludeAmbiguous ? 24 : 26
  if (lowercase) poolSize += excludeAmbiguous ? 25 : 26
  if (numbers) poolSize += excludeAmbiguous ? 8 : 10
  if (symbols) poolSize += 28
  
  if (poolSize === 0) poolSize = 26
  
  return Math.floor(length * Math.log2(poolSize))
}

// Calculate passphrase entropy
export const calculatePassphraseEntropy = (wordCount) => {
  return Math.floor(wordCount * Math.log2(WORD_LIST.length))
}

