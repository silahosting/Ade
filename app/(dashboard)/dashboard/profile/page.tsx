'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Calendar, Save, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardDescription, NeoCardContent, NeoCardFooter } from '@/components/ui/neo-card'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { updateProfileAction, changePasswordAction } from '@/actions/settings.actions'
import type { SessionUser } from '@/types'

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleProfileSubmit(formData: FormData) {
    setSavingProfile(true)
    setMessage(null)
    
    const result = await updateProfileAction(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' })
      fetchUser()
    }
    
    setSavingProfile(false)
  }

  async function handlePasswordSubmit(formData: FormData) {
    setSavingPassword(true)
    setMessage(null)
    
    const result = await changePasswordAction(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Password berhasil diubah!' })
    }
    
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 bg-primary neo-border animate-pulse" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Profil</h1>
        <p className="text-muted-foreground">Kelola informasi akun Anda</p>
      </div>

      {message && (
        <div
          className={`p-4 neo-border-2 flex items-center gap-3 ${
            message.type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Profile Card */}
      <NeoCard className="bg-secondary text-secondary-foreground">
        <NeoCardContent className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white neo-border-2 flex items-center justify-center font-black text-3xl text-secondary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-black text-xl">{user.name}</p>
            <p className="opacity-80">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 text-sm opacity-70">
              <Calendar className="w-4 h-4" />
              Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Update Profile */}
      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle>Informasi Profil</NeoCardTitle>
          <NeoCardDescription>
            Perbarui nama dan email Anda
          </NeoCardDescription>
        </NeoCardHeader>
        
        <form action={handleProfileSubmit}>
          <NeoCardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-bold uppercase tracking-wide">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-bold uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className="pl-11"
                  required
                />
              </div>
            </div>
          </NeoCardContent>

          <NeoCardFooter>
            <NeoButton type="submit" disabled={savingProfile}>
              <Save className="w-5 h-5" />
              {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
            </NeoButton>
          </NeoCardFooter>
        </form>
      </NeoCard>

      {/* Change Password */}
      <NeoCard>
        <NeoCardHeader>
          <NeoCardTitle>Ubah Password</NeoCardTitle>
          <NeoCardDescription>
            Pastikan password baru minimal 6 karakter
          </NeoCardDescription>
        </NeoCardHeader>
        
        <form action={handlePasswordSubmit}>
          <NeoCardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="currentPassword" className="text-sm font-bold uppercase tracking-wide">
                Password Saat Ini
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  placeholder="Masukkan password saat ini"
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="newPassword" className="text-sm font-bold uppercase tracking-wide">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="Min. 6 karakter"
                  className="pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-bold uppercase tracking-wide">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ulangi password baru"
                  className="pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </NeoCardContent>

          <NeoCardFooter>
            <NeoButton type="submit" variant="secondary" disabled={savingPassword}>
              <Lock className="w-5 h-5" />
              {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
            </NeoButton>
          </NeoCardFooter>
        </form>
      </NeoCard>
    </div>
  )
}
