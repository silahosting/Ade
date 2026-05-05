import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateQrisSettings } from '@/lib/github-db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { provider, midtransClientKey, midtransServerKey, midtransMerchantId } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    let settings
    if (provider === 'midtrans') {
      if (!midtransClientKey || !midtransServerKey || !midtransMerchantId) {
        return NextResponse.json(
          { error: 'Midtrans credentials are required' },
          { status: 400 }
        )
      }

      settings = await createOrUpdateQrisSettings('admin', {
        provider: 'midtrans',
        midtransClientKey,
        midtransServerKey,
        midtransMerchantId,
        isActive: true,
      })
    }

    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to save payment settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settings saved successfully',
      settings,
    })
  } catch (error) {
    console.error('[Payment Settings] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    )
  }
}
