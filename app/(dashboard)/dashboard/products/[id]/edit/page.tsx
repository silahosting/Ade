import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getProductById } from '@/lib/github-db'
import { ProductForm } from '@/components/products/ProductForm'
import { updateProductAction } from '@/actions/product.actions'

export default async function EditProductPage({
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

  async function handleUpdate(formData: FormData) {
    'use server'
    return updateProductAction(id, formData)
  }

  return (
    <div className="max-w-2xl">
      <ProductForm 
        product={product}
        onSubmit={handleUpdate} 
        submitLabel="Simpan Perubahan" 
      />
    </div>
  )
}
