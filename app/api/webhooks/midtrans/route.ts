import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentByOrderId, updateOrder, getUserById, addUserBalance } from '@/lib/github-db'
import { MidtransPayment, getMidtransConfig } from '@/lib/midtrans'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('X-Callback-Token') || ''

    // Initialize Midtrans to verify signature
    const config = getMidtransConfig()
    const midtrans = new MidtransPayment(config)

    // Verify webhook signature
    // Note: Midtrans sends server_key in the header for verification
    // For production, implement proper signature verification

    const orderId = body.order_id
    const status = body.transaction_status
    const fraudStatus = body.fraud_status

    console.log('[Midtrans Webhook] Processing:', { orderId, status, fraudStatus })

    // Extract order ID (remove merchant ID prefix)
    const [, actualOrderId] = orderId.split('-')

    // Determine payment status
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' = 'pending'
    let orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled' = 'pending'

    if (status === 'capture' || status === 'settlement') {
      if (fraudStatus === 'accept') {
        paymentStatus = 'paid'
        orderStatus = 'processing'
      } else if (fraudStatus === 'deny' || fraudStatus === 'challenge') {
        paymentStatus = 'failed'
        orderStatus = 'cancelled'
      }
    } else if (status === 'pending') {
      paymentStatus = 'pending'
    } else if (status === 'expire') {
      paymentStatus = 'expired'
      orderStatus = 'cancelled'
    } else if (status === 'cancel' || status === 'deny' || status === 'failure') {
      paymentStatus = 'failed'
      orderStatus = 'cancelled'
    }

    // Update payment
    const payment = await updatePaymentByOrderId(actualOrderId, {
      status: paymentStatus,
      midtransTransactionId: body.transaction_id,
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update order status
    await updateOrder(actualOrderId, {
      status: orderStatus,
      paymentStatus,
    })

    // If payment is successful, add balance to seller
    if (paymentStatus === 'paid') {
      const seller = await getUserById(payment.userId)
      if (seller) {
        await addUserBalance(payment.userId, payment.amount)
        console.log(`[Midtrans Webhook] Added ${payment.amount} to seller ${payment.userId}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    })
  } catch (error) {
    console.error('[Midtrans Webhook] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // For testing webhook
  return NextResponse.json({
    message: 'Midtrans webhook endpoint is ready',
  })
}
