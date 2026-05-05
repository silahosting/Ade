import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentByOrderId, updateOrder, getUserById, addUserBalance } from '@/lib/github-db'
import { MidtransPaymentStatus, getMidtransConfig } from '@/lib/midtrans'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[v0] Midtrans Webhook Received:', {
      orderId: body.order_id,
      transactionId: body.transaction_id,
      status: body.transaction_status,
      paymentType: body.payment_type,
    })

    const orderId = body.order_id
    const transactionStatus = body.transaction_status
    const transactionId = body.transaction_id

    if (!orderId || !transactionStatus) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Map Midtrans status to our payment status
    let paymentStatus = 'pending'
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      paymentStatus = 'paid'
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending'
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      paymentStatus = 'failed'
    }

    // Update payment in database
    await updatePaymentByOrderId(orderId, {
      status: paymentStatus,
      transactionId: transactionId,
      paidAt: transactionStatus === 'settlement' ? new Date().toISOString() : undefined,
    })

    // If payment successful, update order status
    if (paymentStatus === 'paid') {
      await updateOrder(orderId, {
        status: 'completed',
        paidAt: new Date().toISOString(),
      })

      console.log('[v0] Payment completed for order:', orderId)
    } else if (paymentStatus === 'failed') {
      await updateOrder(orderId, {
        status: 'cancelled',
      })

      console.log('[v0] Payment failed for order:', orderId)
    }

    // Send success response to Midtrans
    return NextResponse.json({
      status: 'success',
      message: 'Webhook processed successfully',
    })
  } catch (error) {
    console.error('[v0] Midtrans Webhook Error:', error)
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// GET for testing webhook
export async function GET() {
  return NextResponse.json({
    status: 'Midtrans Webhook Active',
    timestamp: new Date().toISOString(),
  })
}
