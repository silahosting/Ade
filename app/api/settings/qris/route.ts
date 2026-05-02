import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateQrisSettings, getQrisSettings } from '@/lib/github-db'

// GET - Retrieve QRIS settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'admin' | 'user' || 'admin'
    const userId = searchParams.get('userId')

    const qrisSettings = await getQrisSettings(type, userId || undefined)

    return NextResponse.json({
      success: true,
      qrisSettings: qrisSettings ? {
        ...qrisSettings,
        apiKey: qrisSettings.apiKey ? '***' : '', // Hide sensitive data
        token: qrisSettings.token ? '***' : '',
      } : null,
    })
  } catch (error) {
    console.error('[QRIS Settings GET Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/PUT - Create or update QRIS settings
export async function POST(request: NextRequest) {
  try {
    const { type, username, apiKey, token, merchantId, codeQr, userId } = await request.json()

    if (!type || !username || !apiKey || !token || !merchantId || !codeQr) {
      return NextResponse.json(
        { error: 'Missing required fields: type, username, apiKey, token, merchantId, codeQr' },
        { status: 400 }
      )
    }

    if (type !== 'admin' && type !== 'user') {
      return NextResponse.json(
        { error: 'Invalid type. Must be admin or user' },
        { status: 400 }
      )
    }

    if (type === 'user' && !userId) {
      return NextResponse.json(
        { error: 'userId required for user type' },
        { status: 400 }
      )
    }

    const qrisSettings = await createOrUpdateQrisSettings(
      type,
      {
        username,
        apiKey,
        token,
        merchantId,
        codeQr,
        isActive: true,
      },
      type === 'user' ? userId : undefined
    )

    if (!qrisSettings) {
      return NextResponse.json(
        { error: 'Failed to save QRIS settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      qrisSettings: {
        ...qrisSettings,
        apiKey: '***', // Hide sensitive data
        token: '***',
      },
    })
  } catch (error) {
    console.error('[QRIS Settings POST Error]', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}
