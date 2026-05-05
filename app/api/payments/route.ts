import { NextRequest, NextResponse } from 'next/server'
import { getPayments } from '@/lib/github-db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payments = await getPayments(user.id)

    return NextResponse.json({
      success: true,
      payments,
    })
  } catch (error) {
    console.error('[Payments API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
