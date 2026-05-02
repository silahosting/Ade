'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { createOrUpdateBotSettings, getBotSettings, updateUser } from '@/lib/github-db'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function saveBotSettingsAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const botToken = formData.get('botToken') as string
  const ownerId = formData.get('ownerId') as string
  const botName = formData.get('botName') as string
  const isActive = formData.get('isActive') === 'on'

  if (!botToken || !ownerId) {
    return { error: 'Bot Token dan Owner ID harus diisi' }
  }

  const settings = await createOrUpdateBotSettings(session.id, {
    botToken,
    ownerId,
    botName: botName || undefined,
    isActive,
  })

  if (!settings) {
    return { error: 'Gagal menyimpan pengaturan bot' }
  }

  revalidatePath('/dashboard/settings', 'max')
  return { success: true }
}

export async function toggleBotStatusAction() {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const currentSettings = await getBotSettings(session.id)
  if (!currentSettings) {
    return { error: 'Pengaturan bot belum dikonfigurasi' }
  }

  const settings = await createOrUpdateBotSettings(session.id, {
    ...currentSettings,
    isActive: !currentSettings.isActive,
  })

  if (!settings) {
    return { error: 'Gagal mengubah status bot' }
  }

  revalidatePath('/dashboard/settings', 'max')
  revalidatePath('/dashboard', 'max')
  return { success: true, isActive: settings.isActive }
}

export async function updateProfileAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string

  if (!name || !email) {
    return { error: 'Nama dan email harus diisi' }
  }

  const user = await updateUser(session.id, { name, email })

  if (!user) {
    return { error: 'Gagal mengupdate profil' }
  }

  revalidatePath('/dashboard/profile', 'max')
  return { success: true }
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Semua field harus diisi' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Password baru tidak cocok' }
  }

  if (newPassword.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  // Get user with password
  const { getUserById } = await import('@/lib/github-db')
  const user = await getUserById(session.id)
  if (!user) {
    return { error: 'User tidak ditemukan' }
  }

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) {
    return { error: 'Password saat ini salah' }
  }

  const hashedPassword = await hashPassword(newPassword)
  const updatedUser = await updateUser(session.id, { password: hashedPassword })

  if (!updatedUser) {
    return { error: 'Gagal mengubah password' }
  }

  return { success: true }
}
