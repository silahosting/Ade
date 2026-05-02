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

    // Validate type
    if (!type || (type !== 'admin' && type !== 'user')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be admin or user' },
        { status: 400 }
      )
    }

    // Validate for user QRIS - needs token, merchantId, codeQr only
    if (type === 'user') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId required for user type' },
          { status: 400 }
        )
      }
      if (!token || !merchantId || !codeQr) {
        return NextResponse.json(
          { error: 'Missing required fields for user QRIS: token, merchantId, codeQr' },
          { status: 400 }
        )
      }
    }

    // Validate for admin QRIS - needs all fields including username and apiKey
    if (type === 'admin') {
      if (!username || !apiKey || !token || !merchantId || !codeQr) {
        return NextResponse.json(
          { error: 'Missing required fields for admin QRIS: username, apiKey, token, merchantId, codeQr' },
          { status: 400 }
        )
      }
    }

    const qrisSettings = await createOrUpdateQrisSettings(
      type,
      {
        username: username || '', // Use empty string for user QRIS
        apiKey: apiKey || '', // Use empty string for user QRIS (will use hardcoded value)
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
