'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Database, CheckCircle, AlertCircle } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import { addStockAction } from '@/actions/product.actions'

interface AddStockFormProps {
  productId: string
  productName: string
  currentStock: number
}

export function AddStockForm({ productId, productName, currentStock }: AddStockFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Calculate item count from input
  const itemCount = items.split('\n').filter(item => item.trim().length > 0).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const result = await addStockAction(productId, items)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      setLoading(false)
    } else if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Berhasil menambah ${result.added} item. Stock: ${result.oldStock} → ${result.newStock}` 
      })
      setItems('')
      setLoading(false)
      // Refresh the page to show updated data
      router.refresh()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 text-muted-foreground hover:text-primary"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Tambah Stock</span>
      </button>
    )
  }

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Tambah Stock</h3>
          <p className="text-sm text-muted-foreground">
            Tambah item baru ke {productName}
          </p>
        </div>
        <button
          onClick={() => {
            setIsOpen(false)
            setItems('')
            setMessage(null)
          }}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Batal
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg flex items-center gap-3 mb-4 ${
            message.type === 'success' 
              ? 'bg-success/10 text-success border border-success/20' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="font-medium text-sm">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="newItems" className="text-sm font-medium text-muted-foreground">
              Item Baru
            </label>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              itemCount > 0 
                ? 'bg-success/20 text-success' 
                : 'bg-muted text-muted-foreground'
            }`}>
              +{itemCount} item
            </span>
          </div>
          <div className="relative">
            <Database className="absolute left-3 top-4 w-5 h-5 text-muted-foreground" />
            <textarea
              id="newItems"
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder={`Masukkan item baru (1 item per baris):\nuser4:pass4\nuser5:pass5\nuser6:pass6`}
              className="flex w-full bg-input px-4 py-3 pl-11 text-sm rounded-lg border border-border transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono min-h-[120px]"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Stock saat ini: <span className="font-semibold text-foreground">{currentStock}</span> item
          </p>
        </div>

        <NeoButton type="submit" disabled={loading || itemCount === 0} className="w-full">
          <Plus className="w-4 h-4" />
          {loading ? 'Menambahkan...' : `Tambah ${itemCount} Item`}
        </NeoButton>
      </form>
    </div>
  )
}
