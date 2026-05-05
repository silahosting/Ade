import { v4 as uuidv4 } from 'uuid'

interface MidtransConfig {
  serverKey: string
  clientKey: string
  merchantId: string
  isProduction: boolean
}

interface MidtransTransaction {
  orderId: string
  gross_amount: number
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface MidtransSnapResponse {
  token: string
  redirect_url: string
}

export class MidtransPayment {
  private serverKey: string
  private clientKey: string
  private merchantId: string
  private baseUrl: string

  constructor(config: MidtransConfig) {
    this.serverKey = config.serverKey
    this.clientKey = config.clientKey
    this.merchantId = config.merchantId
    this.baseUrl = config.isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1'
  }

  private encodeAuth(): string {
    return Buffer.from(`${this.serverKey}:`).toString('base64')
  }

  async createTransaction(
    data: MidtransTransaction & {
      itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>
      customExpiry?: number // minutes
    }
  ): Promise<MidtransSnapResponse> {
    const body = {
      transaction_details: {
        order_id: `${this.merchantId}-${data.orderId}`,
        gross_amount: data.gross_amount,
      },
      customer_details: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
      },
      item_details: data.itemDetails,
      expiry: data.customExpiry
        ? {
            unit: 'minute',
            length: data.customExpiry,
          }
        : undefined,
    }

    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.encodeAuth()}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Midtrans API error: ${response.status}`)
      }

      const result = await response.json()
      return {
        token: result.token,
        redirect_url: result.redirect_url,
      }
    } catch (error) {
      throw new Error(`Failed to create Midtrans transaction: ${error}`)
    }
  }

  async getTransactionStatus(orderId: string): Promise<any> {
    const fullOrderId = `${this.merchantId}-${orderId}`
    
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${fullOrderId}/status`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${this.encodeAuth()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Midtrans API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error}`)
    }
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    const crypto = require('crypto')
    const orderId = body.order_id
    const statusCode = body.status_code
    const grossAmount = body.gross_amount

    const signatureKey = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
      .digest('hex')

    return signatureKey === signature
  }

  parseWebhookStatus(status: string): 'pending' | 'paid' | 'failed' | 'expired' {
    switch (status) {
      case 'capture':
      case 'settlement':
        return 'paid'
      case 'pending':
        return 'pending'
      case 'expire':
        return 'expired'
      case 'cancel':
      case 'deny':
      case 'failure':
        return 'failed'
      default:
        return 'pending'
    }
  }
}

export function getMidtransConfig(): MidtransConfig {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  const clientKey = process.env.MIDTRANS_CLIENT_KEY
  const merchantId = process.env.MIDTRANS_MERCHANT_ID

  if (!serverKey || !clientKey || !merchantId) {
    throw new Error('Missing Midtrans credentials in environment variables')
  }

  return {
    serverKey,
    clientKey,
    merchantId,
    isProduction: process.env.MIDTRANS_PRODUCTION === 'true',
  }
}
