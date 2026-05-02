export interface User {
  id: string
  email: string
  name: string
  password: string
  createdAt: string
  updatedAt: string
}

export interface BotSettings {
  id: string
  userId: string
  botToken: string
  ownerId: string
  botName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  userId: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  imageUrl?: string
  isActive: boolean
  items?: string[] // Stock items (akun, voucher, dll)
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  userId: string
  productId: string
  productName: string
  quantity: number
  totalPrice: number
  buyerName: string
  buyerContact: string
  buyerId?: string // for telegram users
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  notes?: string
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed'
  paymentQrisUrl?: string
  paymentTransactionId?: string
  createdAt: string
  updatedAt: string
}

export interface QrisSettings {
  id: string
  type: 'admin' | 'user'
  userId?: string // untuk user QRIS, admin QRIS tidak ada userId
  username: string // Orkut username
  apiKey: string // Orkut API key
  token: string // Orkut token
  merchantId: string // Orkut merchant ID
  codeQr: string // QRIS code string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  orderId: string
  userId: string
  amount: number
  qrisUrl?: string
  transactionId?: string
  status: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed'
  paymentMethod: 'qris'
  createdAt: string
  updatedAt: string
}

export interface Database {
  users: User[]
  botSettings: BotSettings[]
  products: Product[]
  orders: Order[]
  qrisSettings: QrisSettings[]
  payments: Payment[]
}

export type SessionUser = Omit<User, 'password'>
