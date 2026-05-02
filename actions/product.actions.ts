'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createProduct, updateProduct, deleteProduct, getProductById } from '@/lib/github-db'

// Parse stock items from input (supports newline and comma separated)
function parseStockItems(input: string): string[] {
  if (!input || !input.trim()) return []
  
  // First try to split by newlines, then by commas if no newlines
  let items: string[]
  if (input.includes('\n')) {
    items = input.split('\n')
  } else {
    items = input.split(',')
  }
  
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

export async function createProductAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const category = formData.get('category') as string
  const itemsInput = formData.get('items') as string
  const isActive = formData.get('isActive') === 'on'

  // Parse stock items
  const items = parseStockItems(itemsInput)
  const stock = items.length

  if (!name || !description || isNaN(price) || !category) {
    return { error: 'Semua field harus diisi dengan benar' }
  }

  if (stock === 0) {
    return { error: 'Minimal harus ada 1 item stock' }
  }

  const product = await createProduct({
    userId: session.id,
    name,
    description,
    price,
    stock,
    category,
    items,
    isActive,
  })

  if (!product) {
    return { error: 'Gagal membuat produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  redirect('/dashboard/products')
}

export async function updateProductAction(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingProduct = await getProductById(id)
  if (!existingProduct || existingProduct.userId !== session.id) {
    return { error: 'Produk tidak ditemukan' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const category = formData.get('category') as string
  const itemsInput = formData.get('items') as string
  const isActive = formData.get('isActive') === 'on'

  // Parse stock items
  const items = parseStockItems(itemsInput)
  const stock = items.length

  if (!name || !description || isNaN(price) || !category) {
    return { error: 'Semua field harus diisi dengan benar' }
  }

  if (stock === 0) {
    return { error: 'Minimal harus ada 1 item stock' }
  }

  const product = await updateProduct(id, {
    name,
    description,
    price,
    stock,
    category,
    items,
    isActive,
  })

  if (!product) {
    return { error: 'Gagal mengupdate produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  redirect('/dashboard/products')
}

// Add stock to existing product
export async function addStockAction(id: string, newItemsInput: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingProduct = await getProductById(id)
  if (!existingProduct || existingProduct.userId !== session.id) {
    return { error: 'Produk tidak ditemukan' }
  }

  const newItems = parseStockItems(newItemsInput)
  
  if (newItems.length === 0) {
    return { error: 'Minimal harus ada 1 item untuk ditambahkan' }
  }

  const currentItems = existingProduct.items || []
  const updatedItems = [...currentItems, ...newItems]

  const product = await updateProduct(id, {
    items: updatedItems,
    stock: updatedItems.length,
  })

  if (!product) {
    return { error: 'Gagal menambah stock' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { 
    success: true, 
    oldStock: currentItems.length,
    newStock: updatedItems.length,
    added: newItems.length 
  }
}

export async function deleteProductAction(id: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingProduct = await getProductById(id)
  if (!existingProduct || existingProduct.userId !== session.id) {
    return { error: 'Produk tidak ditemukan' }
  }

  const success = await deleteProduct(id)
  if (!success) {
    return { error: 'Gagal menghapus produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { success: true }
}

export async function toggleProductStatusAction(id: string) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const existingProduct = await getProductById(id)
  if (!existingProduct || existingProduct.userId !== session.id) {
    return { error: 'Produk tidak ditemukan' }
  }

  const product = await updateProduct(id, {
    isActive: !existingProduct.isActive,
  })

  if (!product) {
    return { error: 'Gagal mengubah status produk' }
  }

  revalidatePath('/dashboard/products', 'max')
  return { success: true }
}
