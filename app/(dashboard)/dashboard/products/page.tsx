import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { getProducts } from '@/lib/github-db'
import { NeoButton } from '@/components/ui/neo-button'
import { ProductCard } from '@/components/products/ProductCard'

export default async function ProductsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const products = await getProducts(session.id)
  const totalStock = products.reduce((sum, p) => sum + (p.items?.length || p.stock || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produk</h1>
          <p className="text-muted-foreground text-sm">Kelola produk yang dijual melalui bot</p>
        </div>
        
        <Link href="/dashboard/products/new">
          <NeoButton className="w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Tambah Produk
          </NeoButton>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="p-8 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Belum Ada Produk</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-sm">
            Mulai tambahkan produk untuk dijual melalui bot Anda
          </p>
          <Link href="/dashboard/products/new">
            <NeoButton>
              <Plus className="w-4 h-4" />
              Tambah Produk Pertama
            </NeoButton>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-sm">
              <span className="text-muted-foreground">Total Produk:</span>
              <span className="font-semibold">{products.length}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm border border-success/20">
              <span>Total Stock:</span>
              <span className="font-semibold">{totalStock} item</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
