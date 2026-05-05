import crypto from 'crypto'

export interface MidtransCreatePaymentResponse {
  success: boolean
  error?: string
  transactionId?: string
  qrisUrl?: string
  qrString?: string
  amount?: number
  originalAmount?: number
  fee?: number
  expiresAt?: string
}

export interface MidtransCheckPaymentResponse {
  success: boolean
  status?: string
  transactionId?: string
  error?: string
  paidAt?: string
}

export interface MidtransPaymentStatus {
  transaction_status: string
  transaction_id: string
  status_code: string
  gross_amount: string
  settlement_time?: string
  [key: string]: any
}

const MIDTRANS_API_BASE = 'https://app.sandbox.midtrans.com/api/v1'

export interface MidtransConfig {
  serverKey: string
  clientKey: string
  merchantId: string
  isActive: boolean
}

export function getMidtransConfig(
  serverKey: string,
  clientKey: string,
  merchantId: string
): MidtransConfig {
  return {
    serverKey,
    clientKey,
    merchantId,
    isActive: !!(serverKey && clientKey && merchantId),
  }
}

export async function createMidtransQrisPayment(
  amount: number,
  description: string,
  clientKey: string,
  serverKey: string,
  merchantId: string
): Promise<MidtransCreatePaymentResponse> {
  try {
    const transactionId = generateTransactionId(merchantId)
    const fee = generateRandomFee()
    const totalAmount = amount + fee

    // Create charge with QRIS payment method
    const response = await fetch(`${MIDTRANS_API_BASE}/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        payment_type: 'qris',
        transaction_details: {
          order_id: transactionId,
          gross_amount: totalAmount,
        },
        custom_field1: description,
        custom_field2: merchantId,
      }),
    })

    const data = (await response.json()) as any

    if (!response.ok) {
      console.error('[v0] Midtrans Create Payment Error:', data)
      return {
        success: false,
        error: data.error_description || data.message || 'Failed to create QRIS payment',
        transactionId: '',
        qrisUrl: '',
        qrString: '',
        amount: totalAmount,
        originalAmount: amount,
        fee,
        expiresAt: '',
      }
    }

    // Extract QRIS data
    const qrString = data.actions?.find((a: any) => a.name === 'generate-qr-code')?.url || ''
    const expiresAt = data.expiry_time || new Date(Date.now() + 15 * 60000).toISOString()

    return {
      success: true,
      transactionId: data.transaction_id,
      qrisUrl: qrString,
      qrString: qrString,
      amount: totalAmount,
      originalAmount: amount,
      fee,
      expiresAt,
    }
  } catch (error) {
    console.error('[v0] Midtrans Create Payment Exception:', error)
    return {
      success: false,
      error: `Exception: ${String(error)}`,
      transactionId: '',
      qrisUrl: '',
      qrString: '',
      amount,
      originalAmount: amount,
      fee: 0,
      expiresAt: '',
    }
  }
}

export async function checkMidtransPaymentStatus(
  transactionId: string,
  serverKey: string
): Promise<MidtransCheckPaymentResponse> {
  try {
    const response = await fetch(`${MIDTRANS_API_BASE}/transactions/${transactionId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
      },
    })

    const data = (await response.json()) as MidtransPaymentStatus

    if (!response.ok) {
      console.error('[v0] Midtrans Check Status Error:', data)
      return {
        success: false,
        status: 'failed',
        transactionId,
        error: 'Failed to check payment status',
      }
    }

    // Map Midtrans status to simple status
    let status = 'pending'
    if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
      status = 'paid'
    } else if (data.transaction_status === 'pending') {
      status = 'pending'
    } else if (
      data.transaction_status === 'deny' ||
      data.transaction_status === 'cancel' ||
      data.transaction_status === 'expire'
    ) {
      status = 'failed'
    }

    return {
      success: true,
      status,
      transactionId: data.transaction_id,
      paidAt: data.settlement_time,
    }
  } catch (error) {
    console.error('[v0] Midtrans Check Status Exception:', error)
    return {
      success: false,
      status: 'failed',
      transactionId,
      error: `Exception: ${String(error)}`,
    }
  }
}

function generateTransactionId(merchantId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${merchantId}-${timestamp}-${random}`
}

function generateRandomFee(): number {
  const fees = [100, 200, 300, 400, 500]
  return fees[Math.floor(Math.random() * fees.length)]
}
