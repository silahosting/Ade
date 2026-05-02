import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Package, Calendar, Tag, Hash, DollarSign, Database, Plus } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getProductById } from '@/lib/github-db'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { AddStockForm } from './add-stock-form'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const product = await getProductById(id)

  if (!product || product.userId !== session.id) {
    notFound()
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard/products">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <NeoBadge variant="secondary">{product.category}</NeoBadge>
            <NeoBadge variant={product.isActive ? 'success' : 'warning'}>
              {product.isActive ? 'Aktif' : 'Nonaktif'}
            </NeoBadge>
          </div>
        </div>
        <Link href={`/dashboard/products/${product.id}/edit`}>
          <NeoButton variant="accent" className="w-full sm:w-auto">
            <Edit className="w-4 h-4" />
            Edit
          </NeoButton>
        </Link>
      </div>

      {/* Product Info Card */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="flex flex-col gap-5">
          {/* Image */}
          <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20 flex items-center justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Package className="w-12 h-12 text-primary/50" />
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Harga</p>
                <p className="font-semibold">{formatCurrency(product.price)}</p>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              product.stock > 0 
                ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/20' 
                : 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                product.stock > 0 ? 'bg-success/20' : 'bg-destructive/20'
              }`}>
                <Hash className={`w-5 h-5 ${product.stock > 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Stok</p>
                <p className={`font-semibold ${product.stock > 0 ? 'text-success' : 'text-destructive'}`}>
                  {product.stock} item
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Deskripsi</h3>
            <p className="text-sm whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Stock Items Preview */}
          {product.items && product.items.length > 0 && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">
                Stock Items ({product.items.length})
              </h3>
              <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <ul className="text-xs font-mono flex flex-col gap-1">
                  {product.items.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="text-muted-foreground truncate">
                      {idx + 1}. {item.substring(0, 30)}{item.length > 30 ? '...' : ''}
                    </li>
                  ))}
                  {product.items.length > 5 && (
                    <li className="text-primary text-xs mt-1">
                      +{product.items.length - 5} item lainnya...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Dibuat: {formatDate(product.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Diperbarui: {formatDate(product.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Stock Form */}
      <AddStockForm productId={product.id} productName={product.name} currentStock={product.stock} />
    </div>
  )
}
