'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Edit, Trash2, Power, Eye, Database, Plus } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { deleteProductAction, toggleProductStatusAction } from '@/actions/product.actions'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onUpdate?: () => void
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function ProductCard({ product, onUpdate }: ProductCardProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await toggleProductStatusAction(product.id)
    onUpdate?.()
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return
    
    setDeleting(true)
    await deleteProductAction(product.id)
    onUpdate?.()
    setDeleting(false)
  }

  const hasItems = product.items && product.items.length > 0

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      product.isActive 
        ? 'bg-card border-border hover:border-primary/30' 
        : 'bg-muted/50 border-border/50 opacity-75'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
          product.isActive 
            ? 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20' 
            : 'bg-muted border border-border'
        }`}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <Package className={`w-6 h-6 ${product.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold truncate">{product.name}</h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <NeoBadge variant="secondary">{product.category}</NeoBadge>
                <NeoBadge variant={product.isActive ? 'success' : 'warning'}>
                  {product.isActive ? 'Aktif' : 'Nonaktif'}
                </NeoBadge>
              </div>
            </div>
            <p className="font-semibold text-primary whitespace-nowrap">
              {formatCurrency(product.price)}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className={`text-sm font-medium ${
                  product.stock > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {product.stock} item
                </span>
              </div>
              {hasItems && (
                <span className="text-xs text-muted-foreground">
                  ({product.items?.length} stok tersedia)
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              <Link href={`/dashboard/products/${product.id}`}>
                <NeoButton variant="outline" size="icon-sm" className="rounded-lg">
                  <Eye className="w-4 h-4" />
                </NeoButton>
              </Link>
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <NeoButton variant="accent" size="icon-sm" className="rounded-lg">
                  <Edit className="w-4 h-4" />
                </NeoButton>
              </Link>
              <NeoButton
                variant={product.isActive ? 'warning' : 'success'}
                size="icon-sm"
                onClick={handleToggle}
                disabled={loading}
                className="rounded-lg"
              >
                <Power className="w-4 h-4" />
              </NeoButton>
              <NeoButton
                variant="destructive"
                size="icon-sm"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </NeoButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
