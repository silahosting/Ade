import { GITHUB_CONFIG } from './constants'
import type { Database, User, BotSettings, Product, Order, QrisSettings, Payment } from '@/types'

const defaultDatabase: Database = {
  users: [],
  botSettings: [],
  products: [],
  orders: [],
  qrisSettings: [],
  payments: [],
}

const API_BASE = "https://api-orkut-iota-seven.vercel.app" // ganti dengan URL API kamu

// Tidak perlu lagi — token ditangani di server
async function getGitHubHeaders() {
  return {
    'Content-Type': 'application/json',
  }
}

async function getFileContent(): Promise<{ content: Database; sha: string | null }> {
  // Tidak perlu cek token/owner/repo — server yang handle
  try {
    const response = await fetch(`${API_BASE}/api/database`, {
      headers: await getGitHubHeaders(),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('API error:', response.status, await response.text())
      return { content: defaultDatabase, sha: null }
    }

    // Server sudah handle 404 + auto createFile di dalamnya
    const data = await response.json() // { content, sha }
    
    // Ensure all arrays exist with proper defaults
    const content: Database = {
      users: Array.isArray(data.content?.users) ? data.content.users : [],
      botSettings: Array.isArray(data.content?.botSettings) ? data.content.botSettings : [],
      products: Array.isArray(data.content?.products) ? data.content.products : [],
      orders: Array.isArray(data.content?.orders) ? data.content.orders : [],
      qrisSettings: Array.isArray(data.content?.qrisSettings) ? data.content.qrisSettings : [],
      payments: Array.isArray(data.content?.payments) ? data.content.payments : [],
    }
    
    return { content, sha: data.sha || null }
  } catch (error) {
    console.error('Error fetching database:', error)
    return { content: defaultDatabase, sha: null }
  }
}

async function createFile(): Promise<void> {
  // Tidak perlu cek token/owner/repo — server yang handle
  try {
    const response = await fetch(`${API_BASE}/api/database/init`, {
      method: 'POST',
      headers: await getGitHubHeaders(),
    })

    if (!response.ok) {
      console.error('API error saat init:', response.status, await response.text())
    }
  } catch (error) {
    console.error('Error creating database file:', error)
  }
}

async function updateFile(database: Database, sha: string | null): Promise<boolean> {
  // Tidak perlu cek token/owner/repo — server yang handle
  try {
    const response = await fetch(`${API_BASE}/api/database`, {
      method: 'PUT',
      headers: await getGitHubHeaders(),
      body: JSON.stringify({ database, sha }),
    })

    if (!response.ok) {
      console.error('API error saat update:', response.status, await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating database:', error)
    return false
  }
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// User operations
export async function getUsers(): Promise<User[]> {
  const { content } = await getFileContent()
  return content.users
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { content } = await getFileContent()
  return content.users.find((u) => u.email === email) || null
}

export async function getUserById(id: string): Promise<User | null> {
  const { content } = await getFileContent()
  return content.users.find((u) => u.id === id) || null
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User | null> {
  const { content, sha } = await getFileContent()
  
  const existingUser = content.users.find((u) => u.email === userData.email)
  if (existingUser) {
    return null
  }

  const now = new Date().toISOString()
  const newUser: User = {
    ...userData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  content.users.push(newUser)
  const success = await updateFile(content, sha)
  return success ? newUser : null
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  const { content, sha } = await getFileContent()
  const index = content.users.findIndex((u) => u.id === id)
  
  if (index === -1) return null

  content.users[index] = {
    ...content.users[index],
    ...userData,
    updatedAt: new Date().toISOString(),
  }

  const success = await updateFile(content, sha)
  return success ? content.users[index] : null
}

// Bot Settings operations
export async function getBotSettings(userId: string): Promise<BotSettings | null> {
  const { content } = await getFileContent()
  return content.botSettings.find((s) => s.userId === userId) || null
}

export async function getBotSettingsByToken(botToken: string): Promise<BotSettings | null> {
  const { content } = await getFileContent()
  return content.botSettings.find((s) => s.botToken === botToken) || null
}

// Get all products (for bot - no userId filter)
export async function getAllProducts(): Promise<Product[]> {
  const { content } = await getFileContent()
  return content.products
}

// Get all orders (for bot stats)
export async function getAllOrders(): Promise<Order[]> {
  const { content } = await getFileContent()
  return content.orders
}

export async function createOrUpdateBotSettings(
  userId: string,
  settings: Omit<BotSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<BotSettings | null> {
  const { content, sha } = await getFileContent()
  const index = content.botSettings.findIndex((s) => s.userId === userId)
  const now = new Date().toISOString()

  if (index === -1) {
    const newSettings: BotSettings = {
      ...settings,
      id: generateId(),
      userId,
      createdAt: now,
      updatedAt: now,
    }
    content.botSettings.push(newSettings)
    const success = await updateFile(content, sha)
    return success ? newSettings : null
  } else {
    content.botSettings[index] = {
      ...content.botSettings[index],
      ...settings,
      updatedAt: now,
    }
    const success = await updateFile(content, sha)
    return success ? content.botSettings[index] : null
  }
}

// Product operations
export async function getProducts(userId: string): Promise<Product[]> {
  const { content } = await getFileContent()
  return content.products.filter((p) => p.userId === userId)
}

export async function getProductById(id: string): Promise<Product | null> {
  const { content } = await getFileContent()
  return content.products.find((p) => p.id === id) || null
}

export async function createProduct(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product | null> {
  const { content, sha } = await getFileContent()
  const now = new Date().toISOString()

  const newProduct: Product = {
    ...productData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  content.products.push(newProduct)
  const success = await updateFile(content, sha)
  return success ? newProduct : null
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
  const { content, sha } = await getFileContent()
  const index = content.products.findIndex((p) => p.id === id)

  if (index === -1) return null

  content.products[index] = {
    ...content.products[index],
    ...productData,
    updatedAt: new Date().toISOString(),
  }

  const success = await updateFile(content, sha)
  return success ? content.products[index] : null
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { content, sha } = await getFileContent()
  const index = content.products.findIndex((p) => p.id === id)

  if (index === -1) return false

  content.products.splice(index, 1)
  return await updateFile(content, sha)
}

// Order operations
export async function getOrders(userId: string): Promise<Order[]> {
  const { content } = await getFileContent()
  return content.orders.filter((o) => o.userId === userId)
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { content } = await getFileContent()
  return content.orders.find((o) => o.id === id) || null
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order | null> {
  const { content, sha } = await getFileContent()
  const now = new Date().toISOString()

  const newOrder: Order = {
    ...orderData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  content.orders.push(newOrder)
  const success = await updateFile(content, sha)
  return success ? newOrder : null
}

export async function updateOrder(id: string, orderData: Partial<Order>): Promise<Order | null> {
  const { content, sha } = await getFileContent()
  const index = content.orders.findIndex((o) => o.id === id)

  if (index === -1) return null

  content.orders[index] = {
    ...content.orders[index],
    ...orderData,
    updatedAt: new Date().toISOString(),
  }

  const success = await updateFile(content, sha)
  return success ? content.orders[index] : null
}

export async function deleteOrder(id: string): Promise<boolean> {
  const { content, sha } = await getFileContent()
  const index = content.orders.findIndex((o) => o.id === id)

  if (index === -1) return false

  content.orders.splice(index, 1)
  return await updateFile(content, sha)
}

// Stats
export async function getDashboardStats(userId: string) {
  const { content } = await getFileContent()
  const products = content.products.filter((p) => p.userId === userId)
  const orders = content.orders.filter((o) => o.userId === userId)
  const botSettings = content.botSettings.find((s) => s.userId === userId)

  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.isActive).length
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const completedOrders = orders.filter((o) => o.status === 'completed').length
  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalPrice, 0)
  const isBotActive = botSettings?.isActive || false

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    isBotActive,
  }
}

// QRIS Settings operations
export async function getQrisSettings(type: 'admin' | 'user', userId?: string): Promise<QrisSettings | null> {
  const { content } = await getFileContent()
  if (type === 'admin') {
    return content.qrisSettings.find((q) => q.type === 'admin') || null
  }
  return content.qrisSettings.find((q) => q.type === 'user' && q.userId === userId) || null
}

export async function createOrUpdateQrisSettings(
  type: 'admin' | 'user',
  settings: Omit<QrisSettings, 'id' | 'createdAt' | 'updatedAt' | 'type'>,
  userId?: string
): Promise<QrisSettings | null> {
  const { content, sha } = await getFileContent()
  let index = -1

  if (type === 'admin') {
    index = content.qrisSettings.findIndex((q) => q.type === 'admin')
  } else {
    index = content.qrisSettings.findIndex((q) => q.type === 'user' && q.userId === userId)
  }

  const now = new Date().toISOString()

  if (index === -1) {
    const newQrisSettings: QrisSettings = {
      ...settings,
      id: generateId(),
      type,
      userId: type === 'user' ? userId : undefined,
      createdAt: now,
      updatedAt: now,
    }
    content.qrisSettings.push(newQrisSettings)
    const success = await updateFile(content, sha)
    return success ? newQrisSettings : null
  } else {
    content.qrisSettings[index] = {
      ...content.qrisSettings[index],
      ...settings,
      updatedAt: now,
    }
    const success = await updateFile(content, sha)
    return success ? content.qrisSettings[index] : null
  }
}

// Payment operations
export async function getPaymentByOrderId(orderId: string): Promise<Payment | null> {
  const { content } = await getFileContent()
  return content.payments.find((p) => p.orderId === orderId) || null
}

export async function getPayments(userId: string): Promise<Payment[]> {
  const { content } = await getFileContent()
  return content.payments.filter((p) => p.userId === userId)
}

export async function createPayment(
  paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Payment | null> {
  const { content, sha } = await getFileContent()
  const now = new Date().toISOString()

  const newPayment: Payment = {
    ...paymentData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  content.payments.push(newPayment)
  const success = await updateFile(content, sha)
  return success ? newPayment : null
}

export async function updatePayment(id: string, paymentData: Partial<Payment>): Promise<Payment | null> {
  const { content, sha } = await getFileContent()
  const index = content.payments.findIndex((p) => p.id === id)

  if (index === -1) return null

  content.payments[index] = {
    ...content.payments[index],
    ...paymentData,
    updatedAt: new Date().toISOString(),
  }

  const success = await updateFile(content, sha)
  return success ? content.payments[index] : null
}

export async function updatePaymentByOrderId(
  orderId: string,
  paymentData: Partial<Payment>
): Promise<Payment | null> {
  const { content, sha } = await getFileContent()
  const index = content.payments.findIndex((p) => p.orderId === orderId)

  if (index === -1) return null

  content.payments[index] = {
    ...content.payments[index],
    ...paymentData,
    updatedAt: new Date().toISOString(),
  }

  const success = await updateFile(content, sha)
  return success ? content.payments[index] : null
}
