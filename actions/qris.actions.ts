'use server'

export async function createQrisPayment(orderId: string, userId: string) {
  try {
    const response = await fetch('/api/payments/create-qris', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, userId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create QRIS payment')
    }

    return data
  } catch (error) {
    console.error('[v0] Create QRIS Payment Error:', error)
    throw error
  }
}

export async function checkPaymentStatus(orderId: string, transactionId: string) {
  try {
    const response = await fetch('/api/payments/check-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, transactionId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check payment status')
    }

    return data
  } catch (error) {
    console.error('[v0] Check Payment Status Error:', error)
    throw error
  }
}

export async function saveQrisSettings(
  type: 'admin' | 'user',
  username: string,
  apiKey: string,
  token: string,
  userId?: string,
  merchantId?: string,
  codeQr?: string
) {
  try {
    const response = await fetch('/api/settings/qris', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        username,
        apiKey,
        token,
        userId,
        merchantId: merchantId || '',
        codeQr: codeQr || '',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save QRIS settings')
    }

    return data
  } catch (error) {
    console.error('[v0] Save QRIS Settings Error:', error)
    throw error
  }
}

export async function getQrisSettings(type: 'admin' | 'user' = 'admin', userId?: string) {
  try {
    const params = new URLSearchParams()
    params.append('type', type)
    if (userId) params.append('userId', userId)

    const response = await fetch(`/api/settings/qris?${params}`)

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get QRIS settings')
    }

    return data.qrisSettings
  } catch (error) {
    console.error('[v0] Get QRIS Settings Error:', error)
    return null
  }
}
