import crypto from 'crypto';

// Encryption/Decryption for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

export function encryptData(data: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error');
    throw new Error('Encryption failed');
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error');
    throw new Error('Decryption failed');
  }
}

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(identifier);
  
  if (!userLimit || userLimit.resetTime < now) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Input validation
export function validateExpense(expense: any): boolean {
  if (!expense || typeof expense !== 'object') return false;
  
  const { category, amount, date, time } = expense;
  
  // Validate category (whitelist allowed categories)
  if (!category || typeof category !== 'string' || category.trim().length === 0) return false;
  
  // Validate amount
  if (typeof amount !== 'number' || amount <= 0 || amount > 1000000) return false;
  
  // Validate date format (YYYY-MM-DD)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return false;
  
  // Validate time format
  if (!time || typeof time !== 'string') return false;
  
  return true;
}

// Sanitize string to prevent XSS
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>\"']/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return map[char] || char;
    })
    .trim()
    .slice(0, 500); // Limit length
}

// Validate budget amount
export function validateBudget(budget: any): boolean {
  const amount = Number(budget);
  return !isNaN(amount) && amount > 0 && amount <= 10000000;
}

// Generate secure random ID (instead of Date.now())
export function generateSecureId(): string {
  return crypto.randomBytes(12).toString('hex');
}
