'use client'

import { useState } from 'react'
import { Package, DollarSign, Tag, FileText, Save, ArrowLeft, Database } from 'lucide-react'
import Link from 'next/link'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoTextarea } from '@/components/ui/neo-textarea'
import { NeoSelect } from '@/components/ui/neo-select'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import type { Product } from '@/types'

interface ProductFormProps {
  product?: Product
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>
  submitLabel?: string
}

export function ProductForm({ product, onSubmit, submitLabel = 'Simpan Produk' }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stockItems, setStockItems] = useState<string>(product?.items?.join('\n') || '')

  // Calculate stock count from items
  const stockCount = stockItems.split('\n').filter(item => item.trim().length > 0).length

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    // Add items to formData
    formData.set('items', stockItems)
    formData.set('stock', stockCount.toString())
    
    const result = await onSubmit(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/products">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h2 className="font-semibold text-lg">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
          <p className="text-sm text-muted-foreground">
            {product ? 'Perbarui informasi produk' : 'Isi informasi produk yang akan dijual'}
          </p>
        </div>
      </div>

      <form action={handleSubmit}>
        <div className="flex flex-col gap-5">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                Nama Produk
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Netflix Premium"
                  className="pl-11"
                  defaultValue={product?.name || ''}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-sm font-medium text-muted-foreground">
                Kategori
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <NeoSelect
                  id="category"
                  name="category"
                  className="pl-11"
                  defaultValue={product?.category || ''}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </NeoSelect>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-sm font-medium text-muted-foreground">
              Deskripsi
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-4 w-5 h-5 text-muted-foreground" />
              <NeoTextarea
                id="description"
                name="description"
                placeholder="Deskripsi lengkap produk..."
                className="pl-11 min-h-[80px]"
                defaultValue={product?.description || ''}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="price" className="text-sm font-medium text-muted-foreground">
              Harga (Rp)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <NeoInput
                id="price"
                name="price"
                type="number"
                min="0"
                step="1000"
                placeholder="50000"
                className="pl-11"
                defaultValue={product?.price || ''}
                required
              />
            </div>
          </div>

          {/* Stock Items Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="stockItems" className="text-sm font-medium text-muted-foreground">
                Isi Produk / Stock Items
              </label>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                stockCount > 0 
                  ? 'bg-success/20 text-success' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {stockCount} item
              </span>
            </div>
            <div className="relative">
              <Database className="absolute left-3 top-4 w-5 h-5 text-muted-foreground" />
              <textarea
                id="stockItems"
                value={stockItems}
                onChange={(e) => setStockItems(e.target.value)}
                placeholder={`Masukkan isi produk (1 item per baris):\nuser1:pass1\nuser2:pass2\nuser3:pass3\n\nAtau pisahkan dengan koma:\nitem1, item2, item3`}
                className="flex w-full bg-input px-4 py-3 pl-11 text-sm rounded-lg border border-border transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono min-h-[160px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Masukkan akun/voucher/item yang akan dikirim ke pembeli. Pisahkan dengan baris baru atau koma.
            </p>
          </div>

          <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
            />
            <span className="font-medium text-sm">
              Aktifkan produk (tampil di katalog)
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <NeoButton type="submit" disabled={loading} className="flex-1 sm:flex-none">
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : submitLabel}
            </NeoButton>
            <Link href="/dashboard/products">
              <NeoButton type="button" variant="outline" className="w-full sm:w-auto">
                Batal
              </NeoButton>
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
