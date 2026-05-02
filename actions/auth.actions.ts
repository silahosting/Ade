'use server'

import { redirect } from 'next/navigation'
import { createUser, getUserByEmail } from '@/lib/github-db'
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth'

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!name || !email || !password) {
    return { error: 'Semua field harus diisi' }
  }

  if (password !== confirmPassword) {
    return { error: 'Password tidak cocok' }
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return { error: 'Email sudah terdaftar' }
  }

  const hashedPassword = await hashPassword(password)
  const user = await createUser({
    name,
    email,
    password: hashedPassword,
  })

  if (!user) {
    return { error: 'Gagal membuat akun. Silakan coba lagi.' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password harus diisi' }
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return { error: 'Email atau password salah' }
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return { error: 'Email atau password salah' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logoutAction() {
  await destroySession()
  redirect('/login')
}
