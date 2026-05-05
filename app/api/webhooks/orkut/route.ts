import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentByOrderId, updateOrder, getUserById, addUserBalance } from '@/lib/github-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[Orkut Webhook] Received:', body)

    // Orkut webhook format:
    // {
    //   transactionId: "...",
    //   orderId: "...",
    //   status: "success" | "failed" | "pending",
    //   amount: number,
    //   timestamp: timestamp
    // }

    const { transactionId, orderId, status, amount } = body

    if (!transactionId || !orderId) {
      return NextResponse.json(
        { error: 'Missing transactionId or orderId' },
        { status: 400 }
      )
    }

    // Map Orkut status to our status
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' = 'pending'
    let orderStatus: 'pending' | 'processing' | 'completed' | 'cancelled' = 'pending'

    switch (status) {
      case 'success':
        paymentStatus = 'paid'
        orderStatus = 'processing'
        break
      case 'failed':
        paymentStatus = 'failed'
        orderStatus = 'cancelled'
        break
      case 'expired':
        paymentStatus = 'expired'
        orderStatus = 'cancelled'
        break
      default:
        paymentStatus = 'pending'
    }

    // Update payment
    const payment = await updatePaymentByOrderId(orderId, {
      status: paymentStatus,
      transactionId,
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update order status
    await updateOrder(orderId, {
      status: orderStatus,
      paymentStatus,
    })

    // If payment is successful, add balance to seller
    if (paymentStatus === 'paid' && amount) {
      const seller = await getUserById(payment.userId)
      if (seller) {
        await addUserBalance(payment.userId, amount)
        console.log(`[Orkut Webhook] Added ${amount} to seller ${payment.userId}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    })
  } catch (error) {
    console.error('[Orkut Webhook] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // For testing webhook
  return NextResponse.json({
    message: 'Orkut webhook endpoint is ready',
  })
}
