import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getBotSettings } from '@/lib/github-db'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getBotSettings(session.id)

  return NextResponse.json({ settings })
}
