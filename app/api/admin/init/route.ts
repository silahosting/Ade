import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUsers } from '@/lib/github-db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const existingUsers = await getUsers()
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Admin sudah pernah dibuat sebelumnya. Gunakan login atau reset password.' },
        { status: 400 }
      )
    }

    // Hash password using same algorithm as login
    const hashedPassword = await hashPassword(password)

    // Create admin user
    const adminUser = await createUser({
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Gagal membuat admin account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account berhasil dibuat',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
    })
  } catch (error) {
    console.error('[v0] Admin Init Error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check if admin already exists
    const users = await getUsers()
    const adminExists = users && users.some((u) => u.role === 'admin')

    if (adminExists) {
      return NextResponse.json({
        initialized: true,
        message: 'Admin sudah dibuat, silakan login',
      })
    }

    return NextResponse.json({
      initialized: false,
      message: 'Admin belum dibuat, silakan lanjutkan inisialisasi',
    })
  } catch (error) {
    return NextResponse.json({
      initialized: false,
      error: String(error),
    })
  }
}
