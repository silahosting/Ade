import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ProductForm } from '@/components/products/ProductForm'
import { createProductAction } from '@/actions/product.actions'

export default async function NewProductPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl">
      <ProductForm 
        onSubmit={createProductAction} 
        submitLabel="Tambah Produk" 
      />
    </div>
  )
}
