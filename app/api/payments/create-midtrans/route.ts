import { NextRequest, NextResponse } from 'next/server'
import { getOrderById, createPayment, getProductById, getUserById } from '@/lib/github-db'
import { MidtransPayment, getMidtransConfig } from '@/lib/midtrans'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get product for item details
    const product = await getProductById(order.productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get seller details
    const seller = await getUserById(order.userId)
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      )
    }

    // Initialize Midtrans
    const config = getMidtransConfig()
    const midtrans = new MidtransPayment(config)

    // Create transaction
    const transaction = await midtrans.createTransaction({
      orderId,
      gross_amount: order.totalPrice,
      firstName: order.buyerName.split(' ')[0] || 'Buyer',
      lastName: order.buyerName.split(' ').slice(1).join(' ') || '',
      email: order.buyerContact || 'buyer@example.com',
      phone: order.buyerContact || '62812345678',
      itemDetails: [
        {
          id: order.productId,
          price: product.price,
          quantity: order.quantity,
          name: product.name,
        },
      ],
      customExpiry: 30, // 30 minutes
    })

    // Create payment record
    const payment = await createPayment({
      orderId,
      userId: order.userId,
      amount: order.totalPrice,
      paymentMethod: 'midtrans',
      midtransTransactionId: transaction.token,
      midtransSnapUrl: transaction.redirect_url,
      status: 'pending',
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('[Midtrans] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    )
  }
}
