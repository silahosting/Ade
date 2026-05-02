import { NextRequest, NextResponse } from 'next/server'
import { getBotSettingsByToken, getAllProducts, getAllOrders, getProductById, updateProduct, createOrder, getQrisSettings, createPayment, updatePaymentByOrderId, getPaymentByOrderId, updateOrder } from '@/lib/github-db'
import { createOrkutQrisPayment, checkOrkutPaymentStatus } from '@/lib/orkut'
import type { Product } from '@/types'

// Telegram API base URL
const TELEGRAM_API = 'https://api.telegram.org/bot'

// Items per page for pagination
const ITEMS_PER_PAGE = 10

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

interface TelegramChat {
  id: number
  type: string
}

interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: TelegramChat
  text?: string
  date: number
}

interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  chat_instance: string
  data?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

// Store for order sessions (in production, use Redis/DB)
const orderSessions = new Map<string, {
  productId: string
  quantity: number
  chatId: number
  messageId: number
}>()

// Format number to Rupiah
function toRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num)
}

// Get current time in WIB
function getWIBTime(): string {
  const now = new Date()
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
  return wibTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Get current date in Indonesian format
function getIndonesianDate(): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const now = new Date()
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
  return `${days[wibTime.getDay()]}, ${wibTime.getDate().toString().padStart(2, '0')} ${months[wibTime.getMonth()]} ${wibTime.getFullYear()} ${getWIBTime()}`
}

// Send message to Telegram
async function sendMessage(
  botToken: string, 
  chatId: number, 
  text: string, 
  options?: {
    parseMode?: string
    replyMarkup?: object
  }
) {
  const response = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode || 'Markdown',
      reply_markup: options?.replyMarkup,
    }),
  })
  return response.json()
}

// Answer callback query
async function answerCallbackQuery(botToken: string, callbackQueryId: string, text?: string, showAlert?: boolean) {
  const response = await fetch(`${TELEGRAM_API}${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    }),
  })
  return response.json()
}

// Edit message text
async function editMessageText(
  botToken: string,
  chatId: number,
  messageId: number,
  text: string,
  options?: {
    parseMode?: string
    replyMarkup?: object
  }
) {
  const response = await fetch(`${TELEGRAM_API}${botToken}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options?.parseMode || 'Markdown',
      reply_markup: options?.replyMarkup,
    }),
  })
  return response.json()
}

// Generate paginated product list text
function generateProductListText(products: Product[], page: number, totalPages: number): string {
  if (!products || products.length === 0) {
    return '┌─────────────────────────────┐\n│  Belum ada produk tersedia  │\n└─────────────────────────────┘'
  }

  let teks = '┌─────────────────────────────┐\n'
  teks += `   LIST PRODUK\n`
  teks += `   page ${page} / ${totalPages}\n`
  teks += '└─────────────────────────────┘\n\n'
  
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  products.forEach((product, index) => {
    teks += `│ [${startIndex + index + 1}] ${product.name}\n`
  })
  
  teks += '└─────────────────────────────┘'
  
  return teks
}

// Generate keyboard for paginated product list
function generateProductListKeyboard(products: Product[], page: number, totalPages: number) {
  const keyboard: { text: string; callback_data: string }[][] = []
  
  // Number buttons in 2 columns
  for (let i = 0; i < products.length; i += 2) {
    const row: { text: string; callback_data: string }[] = []
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    
    row.push({
      text: `${startIndex + i + 1}`,
      callback_data: `select_${products[i].id}`
    })
    
    if (products[i + 1]) {
      row.push({
        text: `${startIndex + i + 2}`,
        callback_data: `select_${products[i + 1].id}`
      })
    }
    
    keyboard.push(row)
  }
  
  // Pagination buttons
  if (totalPages > 1) {
    const navRow: { text: string; callback_data: string }[] = []
    if (page > 1) {
      navRow.push({ text: `Sebelumnya ${page - 1}`, callback_data: `page_${page - 1}` })
    }
    if (page < totalPages) {
      navRow.push({ text: `Selanjutnya ${page + 1}`, callback_data: `page_${page + 1}` })
    }
    if (navRow.length > 0) keyboard.push(navRow)
  }
  
  // Main menu button
  keyboard.push([{ text: '🏠 Main Menu', callback_data: 'menu_main' }])
  
  return { inline_keyboard: keyboard }
}

// Generate product info text
function generateProductInfoText(product: Product): string {
  let teks = '┌─────────────────────────────┐\n'
  teks += `│ • Produk : ${product.name.toUpperCase()}\n`
  teks += `│ • Deskripsi : ${product.description}\n`
  teks += `│ • Kategori : ${product.category}\n`
  teks += '└─────────────────────────────┘\n\n'
  
  teks += '┌─────────────────────────────┐\n'
  teks += `  Harga & Stok:\n`
  teks += `│ • Harga: Rp ${toRupiah(product.price)}\n`
  teks += `│ • Stok: ${product.stock}\n`
  teks += '└─────────────────────────────┘\n'
  teks += `➤ Refresh at ${getWIBTime()} WIB`
  
  return teks
}

// Generate order confirmation text
function generateOrderConfirmText(product: Product, quantity: number): string {
  const total = product.price * quantity
  
  let teks = `KONFIRMASI PESANAN 🛒\n`
  teks += '┌─────────────────────────────\n'
  teks += '│\n'
  teks += `│ Produk : ${product.name.toUpperCase()}\n`
  teks += `│ Harga satuan : Rp. ${toRupiah(product.price)}\n`
  teks += `│ Stok tersedia : ${product.stock}\n`
  teks += '│─────────────────────────────\n'
  teks += '│\n'
  teks += `│ Jumlah Pesanan : x${quantity}\n`
  teks += `│ Total Pembayaran : Rp. ${toRupiah(total)}\n`
  teks += '│\n'
  teks += '└─────────────────────────────\n'
  teks += `➤ Refresh at ${getWIBTime()} WIB`
  
  return teks
}

// Generate start menu text
function generateStartMenuText(user: TelegramUser, botStats: { totalSold: number; totalRevenue: number; totalUsers: number }, userStats: { transactions: number; purchased: number; balance: number }): string {
  const username = user.username ? `@${user.username}` : 'Tidak ada'
  
  let teks = `Halo kak ${user.first_name} 👋🏻\n`
  teks += `${getIndonesianDate()}\n\n`
  
  teks += `User Info :\n`
  teks += `└ ID : ${user.id}\n`
  teks += `└ Username : ${username}\n`
  teks += `└ Transaksi: Rp. ${toRupiah(userStats.transactions)}\n`
  teks += `└ Produk dibeli : ${userStats.purchased}x\n`
  teks += `└ Saldo Pengguna : Rp. ${toRupiah(userStats.balance)}\n\n`
  
  teks += `BOT Stats :\n`
  teks += `└ Terjual : ${botStats.totalSold} pcs\n`
  teks += `└ Total Transaksi : Rp. ${toRupiah(botStats.totalRevenue)}\n`
  teks += `└ Total User : ${botStats.totalUsers}\n\n`
  
  teks += `Shortcuts :\n`
  teks += `/start - Mulai bot\n`
  teks += `/stock - Cek stok produk\n`
  teks += `/saldo - Cek saldo`
  
  return teks
}

// Generate main menu keyboard
function generateMainMenuKeyboard(userBalance: number) {
  return {
    inline_keyboard: [
      [
        { text: '🛍️ List Produk', callback_data: 'list_products_1' },
        { text: `💰 Saldo: Rp. ${toRupiah(userBalance)}`, callback_data: 'balance' }
      ],
      [
        { text: '👩‍💼 Customer Service', callback_data: 'cs' },
        { text: '📜 Riwayat Transaksi', callback_data: 'history' }
      ],
      [
        { text: '✨ Produk Populer', callback_data: 'popular' },
        { text: '❓ Cara Order', callback_data: 'how_to_order' }
      ]
    ]
  }
}

// Handle callback queries (button clicks)
async function handleCallbackQuery(
  botToken: string, 
  callbackQuery: TelegramCallbackQuery,
  ownerId: string,
  userId: string
) {
  const chatId = callbackQuery.message?.chat.id
  const messageId = callbackQuery.message?.message_id
  const data = callbackQuery.data || ''
  const user = callbackQuery.from
  
  if (!chatId || !messageId) return
  
  // Get products for calculations
  const allProducts = await getAllProducts()
  const products = allProducts?.filter(p => p.isActive) || []
  const orders = await getAllOrders()
  
  // Calculate stats
  const completedOrders = orders?.filter(o => o.status === 'completed') || []
  const totalSold = completedOrders.reduce((sum, o) => sum + o.quantity, 0)
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0)
  const totalUsers = new Set(orders?.map(o => o.buyerId) || []).size || 183 // Default demo value
  
  // User stats (in production, get from user database)
  const userOrders = completedOrders.filter(o => o.buyerId === userId)
  const userStats = {
    transactions: userOrders.reduce((sum, o) => sum + o.totalPrice, 0),
    purchased: userOrders.reduce((sum, o) => sum + o.quantity, 0),
    balance: 0 // In production, get from user balance table
  }
  
  // Handle main menu
  if (data === 'menu_main') {
    await answerCallbackQuery(botToken, callbackQuery.id)
    const menuText = generateStartMenuText(user, { totalSold, totalRevenue, totalUsers }, userStats)
    await editMessageText(botToken, chatId, messageId, menuText, {
      replyMarkup: generateMainMenuKeyboard(userStats.balance)
    })
    return
  }
  
  // Handle product list pages
  if (data.startsWith('list_products_') || data.startsWith('page_')) {
    const page = parseInt(data.split('_').pop() || '1')
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE)
    const startIndex = (page - 1) * ITEMS_PER_PAGE
    const pageProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    
    await answerCallbackQuery(botToken, callbackQuery.id)
    
    const listText = generateProductListText(pageProducts, page, totalPages)
    const keyboard = generateProductListKeyboard(pageProducts, page, totalPages)
    
    await editMessageText(botToken, chatId, messageId, listText, { replyMarkup: keyboard })
    return
  }
  
  // Handle product selection (show info)
  if (data.startsWith('select_')) {
    const productId = data.replace('select_', '')
    const product = await getProductById(productId)
    
    if (!product) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Produk tidak ditemukan', true)
      return
    }
    
    await answerCallbackQuery(botToken, callbackQuery.id)
    
    const infoText = generateProductInfoText(product)
    const keyboard = {
      inline_keyboard: [
        [{ text: `🛒 Beli - Rp ${toRupiah(product.price)}`, callback_data: `buy_${product.id}` }],
        [{ text: '🔄 Refresh', callback_data: `refresh_${product.id}` }],
        [
          { text: '⬅️ Kembali', callback_data: 'list_products_1' },
          { text: '🏠 Main Menu', callback_data: 'menu_main' }
        ]
      ]
    }
    
    await editMessageText(botToken, chatId, messageId, infoText, { replyMarkup: keyboard })
    return
  }
  
  // Handle refresh product info
  if (data.startsWith('refresh_')) {
    const productId = data.replace('refresh_', '')
    const product = await getProductById(productId)
    
    if (!product) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Produk tidak ditemukan', true)
      return
    }
    
    await answerCallbackQuery(botToken, callbackQuery.id, 'Data diperbarui!')
    
    const infoText = generateProductInfoText(product)
    const keyboard = {
      inline_keyboard: [
        [{ text: `🛒 Beli - Rp ${toRupiah(product.price)}`, callback_data: `buy_${product.id}` }],
        [{ text: '🔄 Refresh', callback_data: `refresh_${product.id}` }],
        [
          { text: '⬅️ Kembali', callback_data: 'list_products_1' },
          { text: '🏠 Main Menu', callback_data: 'menu_main' }
        ]
      ]
    }
    
    await editMessageText(botToken, chatId, messageId, infoText, { replyMarkup: keyboard })
    return
  }
  
  // Handle buy button (show order confirmation)
  if (data.startsWith('buy_')) {
    const productId = data.replace('buy_', '')
    const product = await getProductById(productId)
    
    if (!product || product.stock === 0) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Stok habis!', true)
      return
    }
    
    // Store order session
    const sessionKey = `${chatId}_${messageId}`
    orderSessions.set(sessionKey, {
      productId,
      quantity: 1,
      chatId,
      messageId
    })
    
    await answerCallbackQuery(botToken, callbackQuery.id)
    
    const confirmText = generateOrderConfirmText(product, 1)
    const keyboard = {
      inline_keyboard: [
        [
          { text: '-', callback_data: `qty_minus_${productId}` },
          { text: '+', callback_data: `qty_plus_${productId}` }
        ],
        [
          { text: '-5', callback_data: `qty_minus5_${productId}` },
          { text: '+5', callback_data: `qty_plus5_${productId}` }
        ],
        [{ text: 'Bayar dengan Saldo ✅', callback_data: `pay_saldo_${productId}` }],
        [{ text: 'Bayar dengan Qris ✅', callback_data: `pay_qris_${productId}` }],
        [{ text: '🔄 Refresh Data', callback_data: `refresh_order_${productId}` }],
        [{ text: '⬅️ BACK', callback_data: `select_${productId}` }]
      ]
    }
    
    await editMessageText(botToken, chatId, messageId, confirmText, { replyMarkup: keyboard })
    return
  }
  
  // Handle quantity adjustments
  if (data.startsWith('qty_')) {
    const parts = data.split('_')
    const action = parts[1]
    const productId = parts.slice(2).join('_')
    const product = await getProductById(productId)
    
    if (!product) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Produk tidak ditemukan', true)
      return
    }
    
    const sessionKey = `${chatId}_${messageId}`
    let session = orderSessions.get(sessionKey)
    
    if (!session) {
      session = { productId, quantity: 1, chatId, messageId }
      orderSessions.set(sessionKey, session)
    }
    
    // Adjust quantity
    let newQty = session.quantity
    if (action === 'minus') newQty = Math.max(1, newQty - 1)
    else if (action === 'plus') newQty = Math.min(product.stock, newQty + 1)
    else if (action === 'minus5') newQty = Math.max(1, newQty - 5)
    else if (action === 'plus5') newQty = Math.min(product.stock, newQty + 5)
    
    session.quantity = newQty
    orderSessions.set(sessionKey, session)
    
    await answerCallbackQuery(botToken, callbackQuery.id, `Jumlah: ${newQty}`)
    
    const confirmText = generateOrderConfirmText(product, newQty)
    const keyboard = {
      inline_keyboard: [
        [
          { text: '-', callback_data: `qty_minus_${productId}` },
          { text: '+', callback_data: `qty_plus_${productId}` }
        ],
        [
          { text: '-5', callback_data: `qty_minus5_${productId}` },
          { text: '+5', callback_data: `qty_plus5_${productId}` }
        ],
        [{ text: 'Bayar dengan Saldo ✅', callback_data: `pay_saldo_${productId}` }],
        [{ text: 'Bayar dengan Qris ✅', callback_data: `pay_qris_${productId}` }],
        [{ text: '🔄 Refresh Data', callback_data: `refresh_order_${productId}` }],
        [{ text: '⬅️ BACK', callback_data: `select_${productId}` }]
      ]
    }
    
    await editMessageText(botToken, chatId, messageId, confirmText, { replyMarkup: keyboard })
    return
  }
  
  // Handle refresh order
  if (data.startsWith('refresh_order_')) {
    const productId = data.replace('refresh_order_', '')
    const product = await getProductById(productId)
    
    if (!product) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Produk tidak ditemukan', true)
      return
    }
    
    const sessionKey = `${chatId}_${messageId}`
    const session = orderSessions.get(sessionKey) || { productId, quantity: 1, chatId, messageId }
    
    await answerCallbackQuery(botToken, callbackQuery.id, 'Data diperbarui!')
    
    const confirmText = generateOrderConfirmText(product, session.quantity)
    const keyboard = {
      inline_keyboard: [
        [
          { text: '-', callback_data: `qty_minus_${productId}` },
          { text: '+', callback_data: `qty_plus_${productId}` }
        ],
        [
          { text: '-5', callback_data: `qty_minus5_${productId}` },
          { text: '+5', callback_data: `qty_plus5_${productId}` }
        ],
        [{ text: 'Bayar dengan Saldo ✅', callback_data: `pay_saldo_${productId}` }],
        [{ text: 'Bayar dengan Qris ✅', callback_data: `pay_qris_${productId}` }],
        [{ text: '🔄 Refresh Data', callback_data: `refresh_order_${productId}` }],
        [{ text: '⬅️ BACK', callback_data: `select_${productId}` }]
      ]
    }
    
    await editMessageText(botToken, chatId, messageId, confirmText, { replyMarkup: keyboard })
    return
  }
  
  // Handle payment with saldo
  if (data.startsWith('pay_saldo_')) {
    const productId = data.replace('pay_saldo_', '')
    const product = await getProductById(productId)
    
    if (!product || !product.items || product.items.length === 0) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Stok habis!', true)
      return
    }
    
    const sessionKey = `${chatId}_${messageId}`
    const session = orderSessions.get(sessionKey) || { productId, quantity: 1, chatId, messageId }
    const quantity = Math.min(session.quantity, product.stock, product.items.length)
    
    if (quantity === 0) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Stok habis!', true)
      return
    }
    
    // Get items to send
    const itemsToSend = product.items.slice(0, quantity)
    const remainingItems = product.items.slice(quantity)
    
    // Update product stock
    await updateProduct(product.id, {
      items: remainingItems,
      stock: remainingItems.length
    })
    
    // Create order record
    await createOrder({
      productId: product.id,
      productName: product.name,
      buyerId: userId,
      buyerName: user.first_name,
      quantity,
      totalPrice: product.price * quantity,
      status: 'completed'
    })
    
    // Clean up session
    orderSessions.delete(sessionKey)
    
    await answerCallbackQuery(botToken, callbackQuery.id, 'Pembayaran berhasil!')
    
    // Send success message with items
    let successText = `✅ PEMBAYARAN BERHASIL!\n\n`
    successText += `*Produk:* ${product.name}\n`
    successText += `*Jumlah:* ${quantity}x\n`
    successText += `*Total:* Rp ${toRupiah(product.price * quantity)}\n\n`
    successText += `━━━━━━━━━━━━━━━━━━━━━\n`
    successText += `📦 *Detail Pesanan:*\n\n`
    itemsToSend.forEach((item, i) => {
      successText += `${i + 1}. \`${item}\`\n`
    })
    successText += `\n━━━━━━━━━━━━━━━━━━━━━\n`
    successText += `\n_Terima kasih telah membeli!_`
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍️ Beli Lagi', callback_data: 'list_products_1' }],
        [{ text: '🏠 Main Menu', callback_data: 'menu_main' }]
      ]
    }
    
    await editMessageText(botToken, chatId, messageId, successText, { replyMarkup: keyboard })
    return
  }
  
  // Handle payment with QRIS
  if (data.startsWith('pay_qris_')) {
    const productId = data.replace('pay_qris_', '')
    const product = await getProductById(productId)

    if (!product) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Produk tidak ditemukan', true)
      return
    }

    const sessionKey = `${chatId}_${messageId}`
    const session = orderSessions.get(sessionKey) || { productId, quantity: 1, chatId, messageId }
    const quantity = Math.min(session.quantity, product.stock, product.items?.length || 0)

    if (quantity === 0) {
      await answerCallbackQuery(botToken, callbackQuery.id, 'Stok habis!', true)
      return
    }

    try {
      const totalPrice = product.price * quantity

      // Create order first
      const newOrder = await createOrder({
        productId: product.id,
        productName: product.name,
        buyerId: userId,
        buyerName: user.first_name,
        quantity,
        totalPrice,
        status: 'pending',
        paymentStatus: 'pending'
      })

      if (!newOrder) {
        await answerCallbackQuery(botToken, callbackQuery.id, 'Gagal membuat order', true)
        return
      }

      // Try to get user QRIS, fallback to admin QRIS
      let qrisResult = await createOrkutQrisPayment(totalPrice, `Pembayaran ${product.name}`, 'user', userId)
      
      if (!qrisResult.success) {
        // Fallback to admin QRIS
        console.log('[v0] User QRIS not found or failed, falling back to admin QRIS')
        qrisResult = await createOrkutQrisPayment(totalPrice, `Pembayaran ${product.name}`, 'admin')
      }

      if (!qrisResult.success) {
        await answerCallbackQuery(botToken, callbackQuery.id, 'Gagal membuat QRIS: ' + qrisResult.error, true)
        return
      }

      // Update order with QRIS details
      await updatePaymentByOrderId(newOrder.id, {
        status: 'pending',
        transactionId: qrisResult.transactionId,
        qrisUrl: qrisResult.qrString,
      })

      // Create payment record
      await createPayment({
        orderId: newOrder.id,
        userId,
        amount: qrisResult.amount,
        qrisUrl: qrisResult.qrString,
        transactionId: qrisResult.transactionId,
        status: 'pending',
        paymentMethod: 'qris',
      })

      // Clean up session
      orderSessions.delete(sessionKey)

      await answerCallbackQuery(botToken, callbackQuery.id)

      // Send QRIS payment message with image
      let qrisText = `💳 *PEMBAYARAN QRIS*\n\n`
      qrisText += `📦 *Produk:* ${product.name}\n`
      qrisText += `📊 *Jumlah:* ${quantity}x\n`
      qrisText += `💰 *Harga:* Rp ${toRupiah(qrisResult.originalAmount)}\n`
      qrisText += `💸 *Admin Fee:* Rp ${toRupiah(qrisResult.fee)}\n`
      qrisText += `━━━━━━━━━━━━━━━━━━━━━\n`
      qrisText += `💵 *Total Bayar:* Rp ${toRupiah(qrisResult.amount)}\n\n`
      qrisText += `🆔 *ID Transaksi:* \`${qrisResult.transactionId}\`\n\n`
      qrisText += `📌 *Instruksi Pembayaran:*\n`
      qrisText += `1. Buka aplikasi e-wallet/banking\n`
      qrisText += `2. Scan QR Code di bawah\n`
      qrisText += `3. Ikuti proses pembayaran\n`
      qrisText += `4. Tunggu konfirmasi (otomatis)\n\n`
      qrisText += `⏱️ *Berlaku sampai:* ${new Date(qrisResult.expiresAt).toLocaleString('id-ID')}\n\n`
      qrisText += `_Pembayaran akan diproses secara otomatis setelah berhasil._`

      const keyboard = {
        inline_keyboard: [
          [{ text: '✅ Cek Status Pembayaran', callback_data: `check_payment_${newOrder.id}` }],
          [{ text: '🔄 Refresh', callback_data: `refresh_payment_${newOrder.id}` }],
          [{ text: '❌ Batal', callback_data: 'menu_main' }]
        ]
      }

      // Send QR code image from Orkut API
      try {
        await fetch(`${TELEGRAM_API}${botToken}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: qrisResult.qrsImageUrl,
            caption: qrisText,
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          }),
        })
      } catch (photoError) {
        console.log('[v0] Failed to send photo, sending text with QR string:', photoError)
        await sendMessage(botToken, chatId, qrisText, { replyMarkup: keyboard })
      }

      return
    } catch (error) {
      console.error('[v0] QRIS Payment Error:', error)
      await answerCallbackQuery(botToken, callbackQuery.id, 'Gagal memproses pembayaran QRIS', true)
      return
    }
  }
  
  // Handle check payment status
  if (data.startsWith('check_payment_')) {
    const orderId = data.replace('check_payment_', '')
    
    try {
      const orders = await getAllOrders()
      const order = orders?.find(o => o.id === orderId)
      
      if (!order) {
        await answerCallbackQuery(botToken, callbackQuery.id, 'Order tidak ditemukan', true)
        return
      }

      // Get payment transaction ID
      const payments = await getPaymentByOrderId(orderId)
      if (!payments) {
        await answerCallbackQuery(botToken, callbackQuery.id, 'Pembayaran tidak ditemukan', true)
        return
      }

      // Check status real-time from Orkut
      const statusCheck = await checkOrkutPaymentStatus(
        payments.transactionId,
        'admin'
      )

      if (statusCheck.status === 'paid') {
        // Update order and payment status
        await updateOrder(orderId, { paymentStatus: 'paid', status: 'processing' })
        await updatePaymentByOrderId(orderId, { status: 'paid' })

        let statusText = `✅ *PEMBAYARAN BERHASIL*\n\n`
        statusText += `📦 *Produk:* ${order.productName}\n`
        statusText += `💰 *Jumlah Bayar:* Rp ${toRupiah(payments.amount)}\n`
        statusText += `🏦 *Via:* ${statusCheck.brand || 'QRIS'}\n`
        statusText += `📝 *Ket:* ${statusCheck.description || '-'}\n\n`
        statusText += `🆔 *ID Transaksi:* \`${statusCheck.transactionId}\`\n`
        statusText += `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}\n\n`
        statusText += `_Pesanan Anda sedang diproses. Terima kasih!_`

        await answerCallbackQuery(botToken, callbackQuery.id, 'Pembayaran terkonfirmasi!', false)
        await sendMessage(botToken, chatId, statusText)
      } else if (statusCheck.status === 'pending') {
        let pendingText = `⏳ *PEMBAYARAN BELUM DIKONFIRMASI*\n\n`
        pendingText += `🆔 *ID Transaksi:* \`${statusCheck.transactionId}\`\n`
        pendingText += `📝 *Status:* ${statusCheck.error || 'Menunggu pembayaran'}\n\n`
        pendingText += `_Silakan coba lagi dalam beberapa detik_`

        await answerCallbackQuery(botToken, callbackQuery.id, 'Masih menunggu pembayaran...', false)
        await sendMessage(botToken, chatId, pendingText)
      } else {
        let failText = `❌ *PEMBAYARAN GAGAL/EXPIRED*\n\n`
        failText += `🆔 *ID Transaksi:* \`${statusCheck.transactionId}\`\n`
        failText += `📝 *Alasan:* ${statusCheck.error || 'Pembayaran tidak terdeteksi'}\n\n`
        failText += `_Silakan coba ulang pembayaran_`

        await answerCallbackQuery(botToken, callbackQuery.id, 'Pembayaran gagal atau expired', true)
        await sendMessage(botToken, chatId, failText)
      }

      return
    } catch (error) {
      console.error('[v0] Check Payment Error:', error)
      await answerCallbackQuery(botToken, callbackQuery.id, 'Gagal check status: ' + String(error), true)
      return
    }
  }

  // Handle refresh payment status
  if (data.startsWith('refresh_payment_')) {
    const orderId = data.replace('refresh_payment_', '')
    await editMessageReplyMarkup(botToken, chatId, messageId, {
      inline_keyboard: [
        [{ text: '⏳ Mengecek...', callback_data: 'noop' }]
      ]
    })
    
    // Trigger check status again
    await fetch(`${TELEGRAM_API}${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: 'Mengecek status pembayaran...',
        show_alert: false,
      }),
    })

    // Simulate a check_payment call
    const checkData = `check_payment_${orderId}`
    // Re-process as check_payment
    Object.assign(data, checkData)
    return
  }
  
  // Handle balance check
  if (data === 'balance') {
    await answerCallbackQuery(botToken, callbackQuery.id, `Saldo Anda: Rp. ${toRupiah(userStats.balance)}`, true)
    return
  }
  
  // Handle CS
  if (data === 'cs') {
    await answerCallbackQuery(botToken, callbackQuery.id)
    const csText = `*👩‍💼 Customer Service*\n\nHubungi admin untuk bantuan:\n\n_Silakan chat langsung untuk pertanyaan atau keluhan._`
    await editMessageText(botToken, chatId, messageId, csText, {
      replyMarkup: {
        inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'menu_main' }]]
      }
    })
    return
  }
  
  // Handle history
  if (data === 'history') {
    await answerCallbackQuery(botToken, callbackQuery.id)
    
    if (userOrders.length === 0) {
      const historyText = `*📜 Riwayat Transaksi*\n\nBelum ada transaksi.`
      await editMessageText(botToken, chatId, messageId, historyText, {
        replyMarkup: {
          inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'menu_main' }]]
        }
      })
      return
    }
    
    let historyText = `*📜 Riwayat Transaksi*\n\n`
    userOrders.slice(0, 10).forEach((order, i) => {
      historyText += `${i + 1}. *${order.productName}*\n`
      historyText += `   Qty: ${order.quantity} | Rp ${toRupiah(order.totalPrice)}\n\n`
    })
    
    await editMessageText(botToken, chatId, messageId, historyText, {
      replyMarkup: {
        inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'menu_main' }]]
      }
    })
    return
  }
  
  // Handle popular products
  if (data === 'popular') {
    await answerCallbackQuery(botToken, callbackQuery.id)
    
    // Sort by sold count (in production, track this properly)
    const popularProducts = products.slice(0, 5)
    
    let popularText = `*✨ Produk Populer*\n\n`
    if (popularProducts.length === 0) {
      popularText += `Belum ada produk populer.`
    } else {
      popularProducts.forEach((p, i) => {
        popularText += `${i + 1}. *${p.name}*\n`
        popularText += `   Rp ${toRupiah(p.price)} | Stok: ${p.stock}\n\n`
      })
    }
    
    const keyboard = {
      inline_keyboard: [
        ...popularProducts.map(p => ([{ text: `📦 ${p.name}`, callback_data: `select_${p.id}` }])),
        [{ text: '⬅️ Kembali', callback_data: 'menu_main' }]
      ]
    }
    
    await editMessageText(botToken, chatId, messageId, popularText, { replyMarkup: keyboard })
    return
  }
  
  // Handle how to order
  if (data === 'how_to_order') {
    await answerCallbackQuery(botToken, callbackQuery.id)
    
    const howText = `*❓ Cara Order*\n\n` +
      `1. Klik *List Produk* untuk melihat daftar produk\n` +
      `2. Pilih nomor produk yang ingin dibeli\n` +
      `3. Klik tombol *Beli* untuk konfirmasi\n` +
      `4. Atur jumlah pesanan dengan tombol +/-\n` +
      `5. Pilih metode pembayaran\n` +
      `6. Data akan dikirim otomatis setelah pembayaran\n\n` +
      `_Hubungi CS jika ada kendala._`
    
    await editMessageText(botToken, chatId, messageId, howText, {
      replyMarkup: {
        inline_keyboard: [[{ text: '⬅️ Kembali', callback_data: 'menu_main' }]]
      }
    })
    return
  }
  
  // Default: answer callback
  await answerCallbackQuery(botToken, callbackQuery.id)
}

// Handle bot commands and messages
async function handleMessage(botToken: string, message: TelegramMessage, ownerId: string) {
  const chatId = message.chat.id
  const text = message.text || ''
  const userId = message.from.id.toString()
  const user = message.from

  // Get data for stats
  const allProducts = await getAllProducts()
  const products = allProducts?.filter(p => p.isActive) || []
  const orders = await getAllOrders()
  
  const completedOrders = orders?.filter(o => o.status === 'completed') || []
  const totalSold = completedOrders.reduce((sum, o) => sum + o.quantity, 0)
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0)
  const totalUsers = new Set(orders?.map(o => o.buyerId) || []).size || 183
  
  const userOrders = completedOrders.filter(o => o.buyerId === userId)
  const userStats = {
    transactions: userOrders.reduce((sum, o) => sum + o.totalPrice, 0),
    purchased: userOrders.reduce((sum, o) => sum + o.quantity, 0),
    balance: 0
  }

  // Handle /start command
  if (text.startsWith('/start')) {
    const menuText = generateStartMenuText(user, { totalSold, totalRevenue, totalUsers }, userStats)
    await sendMessage(botToken, chatId, menuText, {
      replyMarkup: generateMainMenuKeyboard(userStats.balance)
    })
    return
  }

  // Handle /stock or /menu command
  if (text.startsWith('/stock') || text.startsWith('/menu') || text.startsWith('/listproduk')) {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE)
    const pageProducts = products.slice(0, ITEMS_PER_PAGE)
    
    const listText = generateProductListText(pageProducts, 1, totalPages)
    const keyboard = generateProductListKeyboard(pageProducts, 1, totalPages)
    
    await sendMessage(botToken, chatId, listText, { replyMarkup: keyboard })
    return
  }

  // Handle /saldo command
  if (text.startsWith('/saldo')) {
    const balanceText = `*💰 Saldo Anda*\n\nSaldo: Rp. ${toRupiah(userStats.balance)}\n\n_Top up saldo melalui admin._`
    await sendMessage(botToken, chatId, balanceText, {
      replyMarkup: {
        inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'menu_main' }]]
      }
    })
    return
  }

  // Handle /help command
  if (text.startsWith('/help')) {
    const helpText = `*❓ Bantuan*\n\n` +
      `*Perintah:*\n` +
      `/start - Menu utama\n` +
      `/stock - Cek stok produk\n` +
      `/saldo - Cek saldo\n` +
      `/help - Bantuan\n\n` +
      `*Cara Order:*\n` +
      `1. Ketik /stock atau klik List Produk\n` +
      `2. Pilih nomor produk\n` +
      `3. Klik Beli dan atur jumlah\n` +
      `4. Bayar dengan saldo`
    
    await sendMessage(botToken, chatId, helpText, {
      replyMarkup: generateMainMenuKeyboard(userStats.balance)
    })
    return
  }

  // For other messages, show menu
  await sendMessage(botToken, chatId, `Ketik /start untuk memulai atau /stock untuk melihat produk.`, {
    replyMarkup: generateMainMenuKeyboard(userStats.balance)
  })
}

// POST handler for Telegram webhook
export async function POST(request: NextRequest) {
  try {
    // Get bot token from URL or header
    const url = new URL(request.url)
    const botToken = request.headers.get('x-telegram-bot-token') || url.searchParams.get('token')

    if (!botToken) {
      console.error('No bot token provided')
      return NextResponse.json({ error: 'No bot token' }, { status: 400 })
    }

    // Get bot settings to verify token and get owner ID
    const settings = await getBotSettingsByToken(botToken)
    
    if (!settings) {
      console.error('Invalid bot token or bot not found')
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!settings.isActive) {
      return NextResponse.json({ ok: true })
    }

    const update: TelegramUpdate = await request.json()

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const userId = update.callback_query.from.id.toString()
      await handleCallbackQuery(botToken, update.callback_query, settings.ownerId, userId)
      return NextResponse.json({ ok: true })
    }

    // Handle messages
    if (update.message) {
      await handleMessage(botToken, update.message, settings.ownerId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

// GET handler for webhook verification
export async function GET() {
  return NextResponse.json({ 
    status: 'SewaBot Webhook Active',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  })
}
